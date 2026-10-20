# VoyageAI — ML Dataset Documentation

> **Living document** — updated whenever datasets change significantly.
> Last updated: Phase 1 / Phase 2 (2026-09-21)

---

## Data Transparency Principle

VoyageAI clearly distinguishes between:

| Label | Meaning |
|---|---|
| `OpenStreetMap` | Real public geographic data (ODbL license) |
| `seeded` | Curated data written by the developer |
| `synthetic` | Algorithmically generated data (for ML training) |
| `manual` | Hand-entered corrections or additions |
| `wikidata` | Data from Wikidata (CC0 license) |

Never claim synthetic/seeded data represents real-world user behavior.

---

## Dataset 1 — Places

### Source
**OpenStreetMap** via Overpass API  
URL: `https://overpass-api.de/api/interpreter`  
License: **Open Database License (ODbL)**  
Attribution: © OpenStreetMap contributors

### Purpose
Provides real tourist attraction data for 16 cities.
Used by the recommendation engine as the candidate pool.

### Pipeline
```
Overpass API query
↓ fetch_places.py
data/raw/places_raw.json (per-city files in data/raw/by_city/)
↓ clean_places.py
data/processed/places_processed.json
↓ server/scripts/seedPlaces.js
MongoDB: places collection
```

### Raw Fields (from OSM)
| Field | Description |
|---|---|
| `id` | OSM node ID |
| `type` | always "node" (we query nodes only) |
| `lat`, `lon` | coordinates |
| `tags.name` | place name |
| `tags.tourism` | tourism category (museum, viewpoint, etc.) |
| `tags.historic` | historic category (fort, monument, etc.) |
| `tags.leisure` | leisure category (park, garden, etc.) |
| `tags.natural` | natural category (beach, peak, waterfall, etc.) |
| `tags.opening_hours` | opening hours string (OSM format) |
| `tags.wikipedia` | Wikipedia article link |
| `tags.wikidata` | Wikidata entity ID |

### Cleaning Steps
1. **Filter unnamed** — remove any node without `tags.name`
2. **Filter no coordinates** — remove nodes missing lat/lon
3. **Filter no relevant tag** — must have at least one of: tourism, historic, leisure, natural, amenity
4. **Normalize name** — trim whitespace, remove trailing punctuation
5. **Deduplicate** — by `osmId` (type/id), no duplicate insertions

### Feature Engineering

**Feature scores (0–1)** are assigned based on OSM tag semantics:

```
Example: tags.natural = "beach"
→ natureScore = 0.90
→ relaxationScore = 0.85
→ photographyScore = 0.85
→ adventureScore = 0.40
→ All other scores = 0.00

Reasoning: Beaches are strongly associated with nature, relaxation, and photography.
           Adventure is moderate (water sports). No nightlife/culture/food signal from the "beach" tag alone.
```

Full mapping documented in: `data/pipeline/clean_places.py` → `TAG_SCORES` dict

**Derived fields:**
- `popularity`: 0.5 default + 0.3 if Wikipedia-linked + 0.2 if Wikidata-linked (max 1.0)
- `rating`: from `tags.stars` if present, else 4.0 default
- `averageCost`: estimated from category (e.g. museums ≈ ₹200, viewpoints ≈ ₹50) — these are estimates, not real prices
- `visitDuration`: estimated from category (e.g. museums ≈ 120 min)
- `bestSeason`: heuristic based on city climate knowledge

**Important limitations:**
- Cost and duration are rough estimates from category averages, not real ticket prices
- OSM coverage varies — major Indian cities have good coverage; smaller towns may have fewer entries
- OSM data may be outdated or incomplete for newer attractions

### Missing Value Handling
| Field | Handling |
|---|---|
| `rating` | Default 4.0 |
| `averageCost` | Estimated from category (documented above) |
| `visitDuration` | Estimated from category |
| `description` | Auto-generated from tags + city name |
| `openingHours` | Default 09:00–18:00 with raw OSM hours stored in `note` |
| `images` | Empty array (no OSM image data) |

### Record Count (estimated after pipeline)
Depends on Overpass API results. Expected: **500–1500 places** across 16 cities.
Actual count logged in `data/processed/places_processed.json` → `total_records`.

---

## Dataset 2 — Restaurants

### Source
**Seeded** — curated by developer (not from external API).  
`dataSource: 'seeded'` in every restaurant document.

### Purpose
Provides restaurant data for itinerary generation and restaurant recommendation.
OSM restaurant data is often sparse/incomplete for price range, dietary options, and meal types — hence curated seed.

### Coverage
~24 representative restaurants across all seeded cities.
Not exhaustive — meant to demonstrate the recommendation system, not replace a real restaurant API.

### Fields
All standard Restaurant schema fields (name, city, cuisine, priceRange, pricePerPerson, rating, dietaryOptions, mealTypes).

### Limitations
- Does not represent all restaurants in each city
- Prices are approximate as of 2024
- Ratings are approximate public ratings
- Not updated in real-time

---

## Dataset 3 — Hotels

### Source
**Seeded** — created by developer in `server/scripts/seedHotels.js`.  
`dataSource: 'seeded'` implied.

### Coverage
45 hotels × 16 cities, 3 room types each (135 rooms total).

### Purpose
Demo hotel booking only. Not real hotel inventory.

---

## Dataset 4 — User Interactions (ML Training Data)

### Source
**Synthetic** — will be generated algorithmically in Phase 6 (`training/generate_interactions.py`).

### Purpose
Training data for the binary classification ML model (Phase 6).

**Target variable:** `mlLabel`
- 1 = positive interaction (LIKE, SAVE, ITINERARY_ADDED, VISITED)
- 0 = negative interaction (REJECT, ITINERARY_REMOVED)
- -1 = neutral (VIEW, CLICK — excluded from training)

### Features (planned for Phase 6)
| Feature | Source |
|---|---|
| `userNature` | UserPreference.nature |
| `userAdventure` | UserPreference.adventure |
| `userCulture` | UserPreference.culture |
| `placeNatureScore` | Place.natureScore |
| `placeCategory` | Place.category (encoded) |
| `placeRating` | Place.rating |
| `placeCost` | Place.averageCost |
| `budgetRatio` | place.averageCost / user.budgetPerDay |
| `seasonMatch` | 1 if travel month in bestSeason, else 0 |

**Important limitation:**
As of Phase 6, no real user interaction data exists. Training will use synthetic interactions generated from seeded places and simulated user preferences. Model metrics will be reported on this synthetic data. This means the model has not been validated on real user behavior.

### Train / Validation / Test Split
- 70% training
- 15% validation
- 15% test

---

## ML Models (Planned)

### Model 1 — Recommendation Classifier (Phase 6)
- **Type:** Binary classification
- **Algorithms compared:** Logistic Regression, Random Forest, XGBoost
- **Target:** Will user like this place? (1/0)
- **Metrics:** Precision@5, Recall@5, NDCG@5
- **Training data:** Synthetic interaction dataset
- **Saved to:** `ai-service/saved_models/recommendation_model.joblib`

### Model 2 — Cost Predictor (Phase 8)
- **Type:** Regression
- **Algorithms compared:** Linear Regression, Random Forest Regressor, XGBoost Regressor
- **Target:** Total trip cost in INR
- **Metrics:** MAE, RMSE, R²
- **Training data:** Synthetic trip cost dataset
- **Saved to:** `ai-service/saved_models/cost_model.joblib`

---

## Semantic Embeddings (Phase 5)

### Source
**Sentence Transformers** — `all-MiniLM-L6-v2` model (Apache 2.0 license)  
Model card: https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2

### What gets embedded
Place names + descriptions → 384-dimensional float vectors.

### Storage
`ai-service/data/place_embeddings.npy` — NumPy array of shape (n_places, 384).

### Usage
User natural-language query → embedding → cosine similarity → top-K semantically similar places.

---

## How Each Dataset Flows into Each Model

### Recommendation Classifier
```
Place (category, scores, rating, cost) + UserPreference (vector) + UserInteraction (mlLabel)
→ clean_places.py + generate_interactions.py
→ Feature matrix X, labels y
→ train_recommendation.py (XGBoost)
→ saved_models/recommendation_model.joblib
→ FastAPI /recommend endpoint
→ Node.js /api/recommendations/personalized
```

### Cost Predictor
```
Trip (destination, duration, travelers, budget, interests) — synthetic
→ Feature engineering (destination encoding, season encoding)
→ train_cost_model.py (XGBoost Regressor)
→ saved_models/cost_model.joblib
→ FastAPI /predict-cost endpoint
→ Node.js /api/predictions/cost
```
