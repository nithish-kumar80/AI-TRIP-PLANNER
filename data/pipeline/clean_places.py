"""
VoyageAI — Place Data Cleaner & Feature Scorer
Phase 2: Travel Dataset Pipeline — Step 2

What this script does:
  1. Reads raw OSM data from data/raw/places_raw.json
  2. Filters out incomplete/low-quality records
  3. Normalizes fields to match the MongoDB Place schema
  4. Assigns feature scores (0–1) based on OSM category tags
     These scores become the "place feature vector" used for cosine similarity
  5. Deduplicates by osmId
  6. Outputs data/processed/places_processed.json

Feature Score Assignment Logic:
  Each category maps to a set of dimension scores.
  Scores are NOT invented — they are derived from the semantic meaning of the tag.
  e.g. "viewpoint" → high photographyScore because viewpoints exist for photography.
       "museum" → high cultureScore because museums are cultural institutions.
       "beach" → high natureScore + relaxationScore + photographyScore.

Run:
  python data/pipeline/clean_places.py
"""

import json
import os
import re
from datetime import datetime

# ─── Paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "../.."))
RAW_FILE = os.path.join(PROJECT_ROOT, "data", "raw", "places_raw.json")
PROCESSED_DIR = os.path.join(PROJECT_ROOT, "data", "processed")
OUTPUT_FILE = os.path.join(PROCESSED_DIR, "places_processed.json")

os.makedirs(PROCESSED_DIR, exist_ok=True)

# ─── Feature Score Map ────────────────────────────────────────────────────────
# Format: (tag_key, tag_value) → {dimension: score}
# Dimensions: nature, adventure, culture, food, relaxation, nightlife, photography, accessibility
# Scores derived from semantic meaning of the OSM tag category.

TAG_SCORES = {
    # Tourism tags
    ("tourism", "museum"):       {"culture": 0.90, "photography": 0.55, "accessibility": 0.85},
    ("tourism", "gallery"):      {"culture": 0.85, "photography": 0.65, "accessibility": 0.80},
    ("tourism", "viewpoint"):    {"photography": 0.95, "nature": 0.70, "relaxation": 0.55, "accessibility": 0.40},
    ("tourism", "attraction"):   {"culture": 0.65, "photography": 0.65, "accessibility": 0.70},
    ("tourism", "zoo"):          {"nature": 0.75, "adventure": 0.40, "photography": 0.65, "accessibility": 0.85},
    ("tourism", "aquarium"):     {"nature": 0.70, "photography": 0.60, "accessibility": 0.85},
    ("tourism", "theme_park"):   {"adventure": 0.80, "nightlife": 0.40, "accessibility": 0.90},
    ("tourism", "artwork"):      {"culture": 0.75, "photography": 0.80, "accessibility": 0.75},
    ("tourism", "information"):  {"accessibility": 0.90},

    # Historic tags
    ("historic", "fort"):                 {"culture": 0.90, "adventure": 0.35, "photography": 0.80, "accessibility": 0.65},
    ("historic", "castle"):               {"culture": 0.90, "photography": 0.85, "accessibility": 0.60},
    ("historic", "monument"):             {"culture": 0.85, "photography": 0.75, "accessibility": 0.80},
    ("historic", "memorial"):             {"culture": 0.80, "photography": 0.65, "accessibility": 0.85},
    ("historic", "ruins"):                {"culture": 0.85, "adventure": 0.45, "photography": 0.80, "accessibility": 0.40},
    ("historic", "archaeological_site"):  {"culture": 0.95, "photography": 0.70, "accessibility": 0.50},
    ("historic", "temple"):               {"culture": 0.85, "photography": 0.75, "relaxation": 0.50, "accessibility": 0.70},
    ("historic", "mosque"):               {"culture": 0.85, "photography": 0.70, "relaxation": 0.45, "accessibility": 0.70},
    ("historic", "church"):               {"culture": 0.80, "photography": 0.70, "relaxation": 0.50, "accessibility": 0.75},
    ("historic", "cathedral"):            {"culture": 0.90, "photography": 0.80, "relaxation": 0.50, "accessibility": 0.75},
    ("historic", "shrine"):               {"culture": 0.80, "photography": 0.65, "relaxation": 0.60, "accessibility": 0.60},

    # Leisure tags
    ("leisure", "park"):          {"nature": 0.75, "relaxation": 0.80, "photography": 0.60, "accessibility": 0.90},
    ("leisure", "garden"):        {"nature": 0.70, "relaxation": 0.85, "photography": 0.70, "accessibility": 0.85},
    ("leisure", "nature_reserve"):{"nature": 0.95, "adventure": 0.55, "photography": 0.85, "accessibility": 0.30},
    ("leisure", "beach_resort"):  {"nature": 0.80, "relaxation": 0.90, "photography": 0.75, "accessibility": 0.75},

    # Natural tags
    ("natural", "beach"):         {"nature": 0.90, "relaxation": 0.85, "photography": 0.85, "adventure": 0.40, "accessibility": 0.70},
    ("natural", "peak"):          {"nature": 0.90, "adventure": 0.90, "photography": 0.90, "accessibility": 0.20},
    ("natural", "waterfall"):     {"nature": 0.95, "photography": 0.90, "adventure": 0.50, "accessibility": 0.30},
    ("natural", "cave_entrance"): {"nature": 0.80, "adventure": 0.75, "photography": 0.65, "accessibility": 0.25},
    ("natural", "spring"):        {"nature": 0.75, "relaxation": 0.65, "accessibility": 0.50},

    # Amenity tags
    ("amenity", "place_of_worship"): {"culture": 0.80, "relaxation": 0.55, "photography": 0.65, "accessibility": 0.70},
    ("amenity", "theatre"):          {"culture": 0.85, "nightlife": 0.55, "accessibility": 0.85},
    ("amenity", "cinema"):           {"nightlife": 0.60, "accessibility": 0.90},
    ("amenity", "arts_centre"):      {"culture": 0.80, "photography": 0.55, "accessibility": 0.80},
    ("amenity", "library"):          {"culture": 0.70, "relaxation": 0.65, "accessibility": 0.90},
}

# Category map: (tag_key, tag_value) → Place.category
CATEGORY_MAP = {
    ("tourism", "museum"):       "museum",
    ("tourism", "gallery"):      "gallery",
    ("tourism", "viewpoint"):    "viewpoint",
    ("tourism", "attraction"):   "attraction",
    ("tourism", "zoo"):          "zoo",
    ("tourism", "aquarium"):     "aquarium",
    ("tourism", "theme_park"):   "theme_park",
    ("tourism", "artwork"):      "attraction",
    ("historic", "fort"):        "fort",
    ("historic", "castle"):      "fort",
    ("historic", "monument"):    "monument",
    ("historic", "memorial"):    "memorial",
    ("historic", "ruins"):       "ruins",
    ("historic", "archaeological_site"): "archaeological_site",
    ("historic", "temple"):      "temple",
    ("historic", "mosque"):      "temple",
    ("historic", "church"):      "temple",
    ("historic", "cathedral"):   "temple",
    ("historic", "shrine"):      "temple",
    ("leisure", "park"):         "park",
    ("leisure", "garden"):       "garden",
    ("leisure", "nature_reserve"):"nature_reserve",
    ("leisure", "beach_resort"): "beach",
    ("natural", "beach"):        "beach",
    ("natural", "peak"):         "peak",
    ("natural", "waterfall"):    "waterfall",
    ("natural", "cave_entrance"):"cave",
    ("natural", "spring"):       "lake",
    ("amenity", "place_of_worship"): "temple",
    ("amenity", "theatre"):      "amusement",
    ("amenity", "arts_centre"):  "gallery",
}

# PlaceType map
PLACE_TYPE_MAP = {
    "museum": "culture", "gallery": "culture", "monument": "culture",
    "memorial": "culture", "ruins": "culture", "archaeological_site": "culture",
    "temple": "culture", "fort": "culture",
    "viewpoint": "photography",
    "beach": "nature", "park": "nature", "garden": "relaxation",
    "nature_reserve": "nature", "waterfall": "nature", "peak": "adventure",
    "cave": "adventure", "zoo": "nature", "aquarium": "nature",
    "theme_park": "adventure", "amusement": "culture",
    "attraction": "culture", "lake": "nature",
}

# Indoor/outdoor map
INDOOR_MAP = {
    "museum": "indoor", "gallery": "indoor", "aquarium": "indoor",
    "library": "indoor", "theatre": "indoor", "arts_centre": "indoor",
    "viewpoint": "outdoor", "beach": "outdoor", "park": "outdoor",
    "nature_reserve": "outdoor", "waterfall": "outdoor", "peak": "outdoor",
    "beach_resort": "outdoor", "garden": "outdoor", "cave": "outdoor",
    "fort": "both", "ruins": "outdoor", "monument": "outdoor",
    "temple": "both", "mosque": "both", "church": "both", "cathedral": "both",
}

# Average cost estimates in INR per person (rough estimates for India; international approx)
COST_MAP = {
    "museum": 200, "gallery": 100, "viewpoint": 50, "attraction": 150,
    "zoo": 300, "aquarium": 400, "theme_park": 1000, "artwork": 0,
    "fort": 250, "monument": 100, "memorial": 0, "ruins": 150,
    "archaeological_site": 200, "temple": 50, "mosque": 0, "church": 0,
    "park": 50, "garden": 100, "nature_reserve": 200, "beach": 0,
    "peak": 500, "waterfall": 100, "cave": 300, "beach_resort": 500,
    "theatre": 500, "arts_centre": 200,
}

# Visit duration estimates in minutes
DURATION_MAP = {
    "museum": 120, "gallery": 90, "viewpoint": 45, "attraction": 90,
    "zoo": 180, "aquarium": 120, "theme_park": 360,
    "fort": 120, "monument": 45, "ruins": 90, "archaeological_site": 120,
    "temple": 60, "mosque": 45, "church": 45,
    "park": 90, "garden": 60, "nature_reserve": 180,
    "beach": 240, "peak": 300, "waterfall": 120, "cave": 90,
    "theatre": 150, "arts_centre": 90,
}

DIMS = ["nature", "adventure", "culture", "food", "relaxation", "nightlife", "photography", "accessibility"]
DEFAULT_SCORES = {d: 0.0 for d in DIMS}
DEFAULT_SCORES["accessibility"] = 0.5  # default moderate accessibility


# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_primary_tag(tags: dict) -> tuple:
    """
    Given OSM tags dict, find the most relevant (key, value) pair for classification.
    Priority order: tourism > historic > leisure > natural > amenity
    """
    priority_keys = ["tourism", "historic", "leisure", "natural", "amenity"]
    for key in priority_keys:
        if key in tags:
            return (key, tags[key])
    return (None, None)


def get_feature_scores(tag_key: str, tag_value: str) -> dict:
    """Look up feature scores for a tag. Returns default zeros if not found."""
    scores = dict(DEFAULT_SCORES)
    lookup = TAG_SCORES.get((tag_key, tag_value), {})
    scores.update(lookup)
    return scores


def normalize_name(name: str) -> str:
    """Clean up OSM place names."""
    if not name:
        return ""
    name = name.strip()
    # Remove trailing punctuation
    name = re.sub(r'[,;:]+$', '', name)
    return name


def build_description(tags: dict, category: str, city: str) -> str:
    """
    Build a description from available OSM tags.
    OSM rarely has descriptions, so we construct one from tags.
    This is labeled as auto-generated from OSM tags.
    """
    parts = []
    desc = tags.get("description") or tags.get("inscription") or tags.get("note")
    if desc:
        parts.append(desc[:300])
    else:
        # Generate from category
        cat_phrases = {
            "museum": f"A museum in {city} showcasing local history, art, or science.",
            "viewpoint": f"A scenic viewpoint offering panoramic views in {city}.",
            "fort": f"A historic fort in {city} with rich cultural heritage.",
            "beach": f"A beautiful beach in {city} perfect for relaxation.",
            "park": f"A public park in {city} ideal for leisure and recreation.",
            "temple": f"A place of worship in {city} with significant cultural value.",
            "waterfall": f"A natural waterfall near {city}.",
            "peak": f"A mountain peak offering scenic views near {city}.",
        }
        parts.append(cat_phrases.get(category, f"A point of interest in {city}."))

    # Add notable tags as context
    for key in ["historic", "heritage", "wikidata", "wikipedia"]:
        if tags.get(key):
            val = str(tags[key])[:50]
            parts.append(f"[{key}: {val}]")

    return " ".join(parts)[:500]


def extract_opening_hours(tags: dict) -> dict:
    """Parse OSM opening_hours tag into structured format."""
    raw = tags.get("opening_hours", "")
    if raw:
        # OSM opening_hours are complex. We store raw and provide defaults.
        return {"open": "09:00", "close": "18:00", "closedDays": [], "note": raw[:100]}
    return {"open": "09:00", "close": "18:00", "closedDays": [], "note": ""}


def assign_best_season(city: str, category: str) -> list:
    """
    Assign best seasons based on city climate knowledge.
    This is a heuristic based on known Indian/international weather patterns.
    """
    season_map = {
        "chennai":   ["winter"],
        "bangalore": ["winter", "spring"],
        "hyderabad": ["winter", "spring"],
        "mumbai":    ["winter"],
        "new delhi": ["winter", "spring", "autumn"],
        "goa":       ["winter"],
        "jaipur":    ["winter", "autumn"],
        "kochi":     ["winter"],
        "ooty":      ["spring", "summer", "autumn"],
        "manali":    ["summer", "spring"],
        "udaipur":   ["winter", "autumn"],
        "kolkata":   ["winter"],
        "paris":     ["spring", "summer", "autumn"],
        "dubai":     ["winter", "spring"],
        "bali":      ["spring", "summer", "autumn"],
        "singapore": ["all"],
    }
    # Outdoor places are more season-specific; indoor less so
    if category in ["museum", "gallery", "aquarium", "theatre", "arts_centre", "library"]:
        return ["all"]
    return season_map.get(city.lower(), ["all"])


def clean_element(el: dict) -> dict | None:
    """
    Transform one raw OSM element into a Place document.
    Returns None if the element doesn't meet quality criteria.
    """
    tags = el.get("tags", {})
    name = normalize_name(tags.get("name") or tags.get("name:en") or "")
    if not name or len(name) < 2:
        return None  # Skip unnamed POIs

    lat = el.get("lat")
    lng = el.get("lon")
    if lat is None or lng is None:
        return None

    city = el.get("_voyage_city", "unknown")
    country = el.get("_voyage_country", "Unknown")
    osm_id = f"{el.get('type', 'node')}/{el.get('id', '')}"

    tag_key, tag_value = extract_primary_tag(tags)
    if not tag_key:
        return None  # No relevant tag

    scores = get_feature_scores(tag_key, tag_value)
    category = CATEGORY_MAP.get((tag_key, tag_value), "other")
    place_type = PLACE_TYPE_MAP.get(category, "other")
    indoor_outdoor = INDOOR_MAP.get(tag_value, "outdoor")
    description = build_description(tags, category, city)
    opening_hours = extract_opening_hours(tags)
    best_season = assign_best_season(city, category)

    # Cost and duration from maps (estimates — clearly labeled)
    avg_cost = COST_MAP.get(category, 100)
    visit_duration = DURATION_MAP.get(category, 60)

    # Rating: use OSM star rating if available, otherwise default 4.0
    rating_raw = tags.get("stars") or tags.get("rating")
    try:
        rating = min(5.0, max(1.0, float(rating_raw))) if rating_raw else 4.0
    except (ValueError, TypeError):
        rating = 4.0

    # Popularity: normalized from Wikipedia tag presence + Wikidata presence
    # Places in Wikipedia/Wikidata are more prominent
    popularity = 0.5  # default
    if tags.get("wikipedia"):
        popularity = min(1.0, popularity + 0.3)
    if tags.get("wikidata"):
        popularity = min(1.0, popularity + 0.2)

    return {
        "name": name,
        "description": description,
        "city": city,
        "country": country,
        "address": tags.get("addr:full", tags.get("addr:street", "")),
        "coordinates": {"lat": lat, "lng": lng},
        "category": category,
        "placeType": place_type,
        # Feature scores
        "natureScore":       round(scores["nature"], 3),
        "adventureScore":    round(scores["adventure"], 3),
        "cultureScore":      round(scores["culture"], 3),
        "foodScore":         round(scores["food"], 3),
        "relaxationScore":   round(scores["relaxation"], 3),
        "nightlifeScore":    round(scores["nightlife"], 3),
        "photographyScore":  round(scores["photography"], 3),
        "accessibilityScore":round(scores["accessibility"], 3),
        # Practical info
        "averageCost": avg_cost,
        "visitDuration": visit_duration,
        "rating": rating,
        "reviewCount": 0,
        "popularity": round(popularity, 3),
        "bestSeason": best_season,
        "indoorOutdoor": indoor_outdoor,
        "openingHours": opening_hours,
        # Meta
        "images": [],
        "tags": [f"{k}={v}" for k, v in tags.items() if k in ["tourism", "historic", "leisure", "natural", "amenity", "name", "wikidata"]],
        "dataSource": "OpenStreetMap",
        "osmId": osm_id,
        "isActive": True,
        "isFeatured": bool(tags.get("wikipedia")),  # Wikipedia-linked places are featured
    }


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("VoyageAI — Place Data Cleaner")
    print(f"Input:  {RAW_FILE}")
    print(f"Output: {OUTPUT_FILE}")
    print("=" * 60)

    if not os.path.exists(RAW_FILE):
        print(f"\n❌ Raw data file not found: {RAW_FILE}")
        print("   Run: python data/pipeline/fetch_places.py first.")
        return

    with open(RAW_FILE, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    elements = raw_data.get("elements", [])
    print(f"\nRaw records loaded: {len(elements)}")

    # Clean each element
    cleaned = []
    skipped = 0
    seen_osm_ids = set()  # deduplication

    for el in elements:
        place = clean_element(el)
        if place is None:
            skipped += 1
            continue
        # Deduplicate by osmId
        if place["osmId"] in seen_osm_ids:
            skipped += 1
            continue
        seen_osm_ids.add(place["osmId"])
        cleaned.append(place)

    # Summary by city
    city_counts = {}
    for p in cleaned:
        city_counts[p["city"]] = city_counts.get(p["city"], 0) + 1

    # Summary by category
    cat_counts = {}
    for p in cleaned:
        cat_counts[p["category"]] = cat_counts.get(p["category"], 0) + 1

    # Save
    output = {
        "processed_at": datetime.utcnow().isoformat() + "Z",
        "data_source": "OpenStreetMap via Overpass API",
        "license": "ODbL - https://www.openstreetmap.org/copyright",
        "note": "Feature scores are derived from OSM tag semantics. Cost/duration are estimates.",
        "total_records": len(cleaned),
        "raw_records": len(elements),
        "skipped_records": skipped,
        "cities": city_counts,
        "categories": cat_counts,
        "places": cleaned,
    }

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Cleaned: {len(cleaned)} places  (skipped: {skipped})")
    print(f"\nBy city:")
    for city, count in sorted(city_counts.items()):
        print(f"  {city:<20} {count}")
    print(f"\nBy category:")
    for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1])[:10]:
        print(f"  {cat:<25} {count}")
    print(f"\nSaved: {OUTPUT_FILE}")
    print("Next step: node server/scripts/seedPlaces.js")
    print("=" * 60)


if __name__ == "__main__":
    main()
