"""
VoyageAI -- Overpass API Place Fetcher
Phase 2: Travel Dataset Pipeline -- Step 1

What this script does:
  Queries the OpenStreetMap Overpass API for tourist attractions, natural sites,
  historic places, and leisure spots in each target city.

Data source: OpenStreetMap via Overpass API (https://overpass-api.de)
License: OpenStreetMap data is available under ODbL (Open Database License).
         See: https://www.openstreetmap.org/copyright

Output: data/raw/places_raw.json
        One JSON file per city stored in data/raw/by_city/

Run:
  cd "c:/AI trip planner"
  python data/pipeline/fetch_places.py

Notes:
  - Overpass API is free but rate-limited. This script adds delays between requests.
  - Results are nodes only (points of interest). Ways/relations would require more processing.
  - Not all POIs have names -- unnamed ones are filtered out.
  - OSM data coverage varies by city. Indian cities have good coverage; smaller towns less so.
  - If overpass-api.de is slow, the script automatically tries overpass.kumi.systems as mirror.
"""

import sys
import io
# Fix Windows console encoding -- Overpass returns UTF-8 data
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')


import json
import time
import os
import requests
from datetime import datetime

# -- Configuration ---------------------------------------------------------------

# Primary and mirror Overpass API endpoints
OVERPASS_URLS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",   # mirror 1
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",  # mirror 2
]
REQUEST_DELAY = 4   # seconds between cities (be a good citizen)
TIMEOUT = 60        # seconds per request
MAX_RESULTS = 150   # max places per city
MAX_RETRIES = 3     # retries per query before giving up

# Output directories
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
RAW_DIR = os.path.join(PROJECT_ROOT, "data", "raw")
BY_CITY_DIR = os.path.join(RAW_DIR, "by_city")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(BY_CITY_DIR, exist_ok=True)

# ─── Target Cities ────────────────────────────────────────────────────────────
# These match the cities seeded in the hotel dataset.
# osm_area_name: the name as it appears in OSM (used in area query)
# country: for context
# admin_level: OSM administrative level for the area boundary search

CITIES = [
    {"name": "chennai",   "osm_area_name": "Chennai",    "country": "India"},
    {"name": "bangalore", "osm_area_name": "Bengaluru",   "country": "India"},
    {"name": "hyderabad", "osm_area_name": "Hyderabad",   "country": "India"},
    {"name": "mumbai",    "osm_area_name": "Mumbai",      "country": "India"},
    {"name": "new delhi", "osm_area_name": "New Delhi",   "country": "India"},
    {"name": "goa",       "osm_area_name": "Goa",         "country": "India"},
    {"name": "jaipur",    "osm_area_name": "Jaipur",      "country": "India"},
    {"name": "kochi",     "osm_area_name": "Kochi",       "country": "India"},
    {"name": "ooty",      "osm_area_name": "Ooty",        "country": "India"},
    {"name": "manali",    "osm_area_name": "Manali",      "country": "India"},
    {"name": "udaipur",   "osm_area_name": "Udaipur",     "country": "India"},
    {"name": "kolkata",   "osm_area_name": "Kolkata",     "country": "India"},
    {"name": "paris",     "osm_area_name": "Paris",       "country": "France"},
    {"name": "dubai",     "osm_area_name": "Dubai",       "country": "UAE"},
    {"name": "bali",      "osm_area_name": "Bali",        "country": "Indonesia"},
    {"name": "singapore", "osm_area_name": "Singapore",   "country": "Singapore"},
]

# ─── Overpass Query Template ──────────────────────────────────────────────────
# Fetches nodes (points) matching tourism, historic, leisure, and natural tags.
# We use the area search to find POIs within the city boundary.
# Sorted by importance (bbox center as reference).

def build_query(city_name: str, max_results: int) -> str:
    """
    Build an Overpass QL query for tourist POIs in a named city.
    Uses a union of relevant tourism/historic/leisure/natural tags.
    """
    return f"""
[out:json][timeout:{TIMEOUT}];
(
  area["name"="{city_name}"]["boundary"="administrative"]->.city;
  area["name"="{city_name}"]["place"~"city|town|suburb"]->.city2;
);
(
  node["tourism"~"attraction|museum|viewpoint|gallery|zoo|aquarium|theme_park|artwork|information"](area.city);
  node["historic"~"monument|memorial|castle|ruins|fort|archaeological_site|temple|mosque|church|cathedral|shrine"](area.city);
  node["leisure"~"park|garden|nature_reserve|beach_resort|miniature_golf"](area.city);
  node["natural"~"beach|peak|waterfall|cave_entrance|spring"](area.city);
  node["amenity"~"place_of_worship|theatre|cinema|arts_centre|library"](area.city);
);
out body {max_results};
"""


def build_query_fallback(city_name: str, country: str, max_results: int) -> str:
    """
    Fallback query using bbox-based area search for cities where admin boundary fails.
    Uses geocoding-style approach with the country as context.
    """
    return f"""
[out:json][timeout:{TIMEOUT}];
area["name"="{city_name}"]["addr:country"~"{country}",i]->.city;
(
  node["tourism"~"attraction|museum|viewpoint|gallery|zoo|aquarium|theme_park"](area.city);
  node["historic"~"monument|memorial|fort|ruins|archaeological_site"](area.city);
  node["leisure"~"park|garden|nature_reserve"](area.city);
  node["natural"~"beach|peak|waterfall"](area.city);
);
out body {max_results};
"""


# -- Fetcher -----------------------------------------------------------------------

def fetch_city(city: dict) -> list:
    """
    Fetch POIs for a single city from Overpass API.
    Tries each mirror URL in OVERPASS_URLS, then falls back to a simpler query.
    Returns a list of raw OSM node dicts, or [] if all attempts fail.
    """
    city_name = city["osm_area_name"]
    country = city["country"]
    print(f"\n  Fetching: {city_name} ({country})...")

    queries = [
        ("primary", build_query(city_name, MAX_RESULTS)),
        ("fallback", build_query_fallback(city_name, country, MAX_RESULTS)),
    ]

    for q_name, query in queries:
        for url_idx, url in enumerate(OVERPASS_URLS):
            for retry in range(MAX_RETRIES):
                try:
                    response = requests.post(
                        url,
                        data={"data": query},
                        timeout=TIMEOUT,
                        headers={"User-Agent": "VoyageAI-DataPipeline/1.0 (portfolio project)"},
                    )
                    if response.status_code in (429, 504, 503, 502):
                        wait = REQUEST_DELAY * (2 ** retry)
                        print(f"    [HTTP {response.status_code}] mirror={url_idx+1} query={q_name} retry={retry+1} waiting {wait}s...")
                        time.sleep(wait)
                        continue
                    response.raise_for_status()
                    data = response.json()
                    elements = data.get("elements", [])

                    # Filter: must have a name and coordinates
                    named = [
                        e for e in elements
                        if e.get("type") == "node"
                        and e.get("tags", {}).get("name")
                        and e.get("lat") is not None
                        and e.get("lon") is not None
                    ]

                    if named:
                        print(f"    OK: {len(named)} named POIs (mirror={url_idx+1} query={q_name})")
                        return named
                    else:
                        print(f"    No named POIs (mirror={url_idx+1} query={q_name}), trying next...")
                        break  # move to next query/mirror

                except requests.exceptions.Timeout:
                    print(f"    TIMEOUT (mirror={url_idx+1} query={q_name} retry={retry+1})")
                    time.sleep(REQUEST_DELAY * 2)
                except requests.exceptions.RequestException as e:
                    print(f"    ERROR (mirror={url_idx+1} query={q_name}): {str(e)[:80]}")
                    time.sleep(REQUEST_DELAY)

    print(f"    SKIP: {city_name} -- all attempts failed.")
    return []


def attach_city_metadata(elements: list, city: dict) -> list:
    """
    Attach our internal city name and country to each element.
    OSM elements only have coordinates and tags — not our normalized city key.
    """
    enriched = []
    for el in elements:
        el["_voyage_city"] = city["name"]         # our normalized city key (lowercase)
        el["_voyage_country"] = city["country"]
        el["_voyage_osm_area"] = city["osm_area_name"]
        enriched.append(el)
    return enriched


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("VoyageAI — Overpass API Place Fetcher")
    print(f"Target: {len(CITIES)} cities")
    print(f"Max per city: {MAX_RESULTS}")
    print(f"Output: {RAW_DIR}")
    print("=" * 60)

    all_places = []
    city_summary = {}

    for i, city in enumerate(CITIES, 1):
        print(f"\n[{i}/{len(CITIES)}] {city['name'].upper()}")
        elements = fetch_city(city)

        if elements:
            enriched = attach_city_metadata(elements, city)
            all_places.extend(enriched)
            city_summary[city["name"]] = len(enriched)

            # Save per-city raw file
            city_file = os.path.join(BY_CITY_DIR, f"{city['name'].replace(' ', '_')}_raw.json")
            with open(city_file, "w", encoding="utf-8") as f:
                json.dump(enriched, f, ensure_ascii=False, indent=2)
            print(f"    Saved: {city_file}")
        else:
            city_summary[city["name"]] = 0

        # Rate limiting -- be respectful of the free Overpass API
        if i < len(CITIES):
            print(f"    Waiting {REQUEST_DELAY}s before next city...")
            time.sleep(REQUEST_DELAY)

    # Save combined raw file
    combined_file = os.path.join(RAW_DIR, "places_raw.json")
    with open(combined_file, "w", encoding="utf-8") as f:
        json.dump({
            "fetched_at": datetime.utcnow().isoformat() + "Z",
            "data_source": "OpenStreetMap Overpass API",
            "license": "ODbL - https://www.openstreetmap.org/copyright",
            "total_records": len(all_places),
            "cities": city_summary,
            "elements": all_places,
        }, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 60)
    print("FETCH COMPLETE")
    print(f"Total POIs fetched: {len(all_places)}")
    print("\nCity breakdown:")
    for city, count in city_summary.items():
        status = "OK" if count > 0 else "FAILED"
        print(f"  {status}  {city:<15} {count} places")
    print(f"\nCombined file: {combined_file}")
    print("Next step: python data/pipeline/clean_places.py")
    print("=" * 60)


if __name__ == "__main__":
    main()
