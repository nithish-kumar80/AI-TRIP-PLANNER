# VoyageAI — Implementation Documentation

> **Living document** — updated after every phase. Describes what is actually built, not what is planned.
> Last updated: Phase 1 completion (2026-09-21)

---

## Architecture

```
React Frontend (client/)
        │
        │ REST API (axios)
        ▼
Node.js / Express (server/)          ← Main application backend
        │
        ├── MongoDB (mongoose)        ← All persistent data
        ├── Python AI Service (ai-service/)   ← Phase 4+
        └── External APIs (Gemini, Groq)
```

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| 0 | Existing project audit | ✅ Complete |
| 1 | New data models + routes | ✅ Complete |
| 2 | Overpass data pipeline | ✅ Scripts created — run pipeline to populate |
| 3 | Cosine similarity baseline | ✅ Implemented in recommendationController.js |
| 4 | Python FastAPI setup | 🔲 Not started |
| 5 | Embeddings + semantic search | 🔲 Not started |
| 6 | ML recommendation model | 🔲 Not started |
| 7 | Hybrid recommendation engine | 🔲 Not started |
| 8 | Cost prediction | 🔲 Not started |
| 9 | Route optimization | 🔲 Not started |
| 10 | Context-aware engine | 🔲 Not started |
| 11 | Structured itinerary generator | 🔲 Not started |
| 12 | LLM refactor (presentation only) | 🔲 Not started |
| 13 | Personalization loop | 🔲 Not started |
| 14 | Hotel + restaurant ranking | 🔲 Not started |
| 15 | AI analytics dashboard | 🔲 Not started |

---

## Database Models

### User (existing)
Standard auth user. Has name, email, password (bcrypt), role, Google OAuth fields.

### Trip (existing)
AI-generated travel itinerary linked to User. Stores destination, dates, budget, interests, AI-generated itinerary JSON.

### Hotel (existing) — 45 seeded
Hotel inventory for demo booking. 45 hotels × 16 cities. Feature: demo hotel booking.

### Room (existing) — 135 seeded
3 room types per hotel. Linked to Hotel. Price used for booking cost calculation.

### Booking (existing)
Demo booking record. Links User → Hotel → Room. Always `isDemo: true`.

### **Place (NEW — Phase 1)**
Tourist attractions, natural sites, historic places from OpenStreetMap.

**What it contains:**
- Name, description, coordinates, city, country
- category: museum | viewpoint | fort | beach | park | waterfall | peak | etc.
- placeType: culture | nature | adventure | food | relaxation | nightlife | photography

**Feature Vector (the key AI data):**
```json
{
  "natureScore":        0.90,
  "adventureScore":     0.40,
  "cultureScore":       0.30,
  "foodScore":          0.00,
  "relaxationScore":    0.85,
  "nightlifeScore":     0.00,
  "photographyScore":   0.85,
  "accessibilityScore": 0.70
}
```
These 8 numbers are the "place feature vector." Used for cosine similarity against the user preference vector.

**Why these dimensions?**
They map to common travel motivations. A user who says "I love nature + photography" gets a vector with high nature/photography values. A beach has high nature/relaxation/photography. Cosine similarity measures how aligned these vectors are.

**Data source:** OpenStreetMap via Overpass API (ODbL license). Feature scores derived from OSM tag semantics in `data/pipeline/clean_places.py`.

### **Restaurant (NEW — Phase 1)**
Food/drink establishments. Seeded with curated representative data (labeled `dataSource: 'seeded'`).

### **UserInteraction (NEW — Phase 1)**
Records every user action on a Place: VIEW, CLICK, LIKE, SAVE, REJECT, VISITED, ITINERARY_ADDED, ITINERARY_REMOVED.

**Why track interactions?**
1. Updates the preference vector (personalization)
2. Generates training data for ML model (Phase 6)
3. Enables Precision@K / NDCG@K calculation (Phase 15)

**mlLabel field:** 1 = positive (LIKE/SAVE/VISITED), 0 = negative (REJECT), -1 = neutral (VIEW/CLICK). Used as the target label for binary classification in Phase 6.

### **UserPreference (NEW — Phase 1)**
One document per user. Stores the normalized preference vector.

**The vector:**
```json
{
  "nature":       0.85,
  "adventure":    0.70,
  "culture":      0.40,
  "food":         0.60,
  "relaxation":   0.55,
  "nightlife":    0.20,
  "photography":  0.90
}
```
Values are 0–1. Starts at 0.5 defaults, updated by interaction signals.

**Update rule:**
When user LIKES a beach (natureScore=0.90, photographyScore=0.85):
```
nature    += 0.10 × 0.90 = 0.09  → new nature = 0.85 + 0.09 = 0.94 (capped at 1.0)
photography += 0.10 × 0.85 = 0.085 → new photography = 0.90 + 0.085 ≈ 0.985
```
INTERACTION_WEIGHT = 0.10 for LIKE.

### **Recommendation (NEW — Phase 1)**
Stores every scored recommendation result. Enables:
- Audit trail (verify scores are real, not invented)
- Precision@K / NDCG@K calculation
- Engine version tracking

---

## Recommendation Engine — Baseline (Phase 3)

**File:** `server/controllers/recommendationController.js`

**Algorithm:** Cosine Similarity + Weighted Scoring

### What is Cosine Similarity?

Given two vectors A and B, cosine similarity measures the angle between them:

```
cos(θ) = (A · B) / (|A| × |B|)

Where:
  A · B   = dot product = Σ(Aᵢ × Bᵢ)
  |A|     = magnitude = √(Σ Aᵢ²)
  Result  = 0 (completely different) to 1 (identical direction)
```

**Example:**
```
User vector:  [0.9, 0.8, 0.3, 0.7, 0.5, 0.2, 0.85]  (nature, adventure, culture, food, relaxation, nightlife, photography)
Beach vector: [0.9, 0.4, 0.0, 0.0, 0.85, 0.0, 0.85]

Dot product = 0.9×0.9 + 0.8×0.4 + 0.3×0 + 0.7×0 + 0.5×0.85 + 0.2×0 + 0.85×0.85
            = 0.81 + 0.32 + 0 + 0 + 0.425 + 0 + 0.7225
            = 2.2775

|User|  = √(0.81 + 0.64 + 0.09 + 0.49 + 0.25 + 0.04 + 0.7225) = √3.0425 ≈ 1.744
|Beach| = √(0.81 + 0.16 + 0 + 0 + 0.7225 + 0 + 0.7225) = √2.415 ≈ 1.554

cos(θ) = 2.2775 / (1.744 × 1.554) = 2.2775 / 2.710 ≈ 0.840
```

Score 0.84 — high match (makes sense: nature lover + photography + beach are well aligned).

### Scoring Formula

```javascript
hybridScore =
  preferenceScore × 0.45   // cosine similarity
  + budgetScore   × 0.25   // how well cost fits budget
  + ratingScore   × 0.20   // normalized rating (place.rating / 5)
  + seasonScore   × 0.10   // seasonal fit
```

### Reason Generation
Reasons are generated from score thresholds — NOT from LLM:
- `preferenceScore ≥ 0.7` → "Matches your nature & photography interests"
- `budgetScore ≥ 0.9` → "Fits within your daily budget"
- `seasonScore ≥ 0.8` → "Great time of year to visit"

---

## Data Pipeline

### Step 1: Fetch (OpenStreetMap)
```
python data/pipeline/fetch_places.py
```
Queries Overpass API for tourist POIs in 16 cities.
Output: `data/raw/places_raw.json` + per-city files.

### Step 2: Clean + Score
```
python data/pipeline/clean_places.py
```
- Filters unnamed/incomplete records
- Assigns feature scores from OSM tag semantics
- Deduplicates by OSM ID
- Builds descriptions from tags
Output: `data/processed/places_processed.json`

### Step 3: Seed MongoDB
```
node server/scripts/seedPlaces.js
```
Reads processed JSON, inserts into MongoDB Place collection.
Also seeds representative restaurants (labeled `dataSource: 'seeded'`).

---

## API Endpoints (Current)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET  /api/auth/me`
- `GET  /api/auth/google`

### Places (NEW)
- `GET  /api/places` — search with filters (city, category, type, rating)
- `GET  /api/places/:id`
- `GET  /api/places/city/:city`
- `GET  /api/places/cities`
- `GET  /api/places/categories`

### Restaurants (NEW)
- `GET  /api/restaurants` — filter by city/cuisine/priceRange/dietary
- `GET  /api/restaurants/:id`
- `GET  /api/restaurants/city/:city`

### Interactions (NEW)
- `POST /api/interactions` — record user action on a place
- `GET  /api/interactions` — get my interactions
- `GET  /api/interactions/stats`

### Recommendations (NEW)
- `GET  /api/recommendations/baseline` — cosine similarity recommendations
- `GET  /api/recommendations/preferences` — get my preference vector
- `PUT  /api/recommendations/preferences` — update preference vector

### Hotels
- `GET  /api/hotels`
- `GET  /api/hotels/:id`
- `GET  /api/hotels/featured`

### Bookings
- `POST /api/bookings` — create demo booking
- `GET  /api/bookings` — my bookings
- `PUT  /api/bookings/:id/cancel`

---

## Authentication

JWT-based with refresh tokens.
- Access token: 15 min, stored in localStorage
- Refresh token: 7 days, stored in httpOnly cookie
- bcrypt (12 rounds) for password hashing
- Google OAuth via Passport.js

**Protected routes:** use `protect` middleware which verifies JWT.
**Optional auth:** `optionalAuth` — enriches request if token present but doesn't block.

---

## Environment Variables

See `server/.env.example`. Key variables:
- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — token signing
- `GEMINI_API_KEY` — Google Gemini for itinerary generation
- `AI_SERVICE_URL` — Python FastAPI service URL (Phase 4+)
- `DEMO_MODE` — enables demo/mock fallbacks

---

## What the LLM Currently Does (Pre-Phase 12)

Current state (Phase 0 architecture — will be refactored in Phase 12):

```
User input (destination + prefs)
↓
Gemini / Groq
↓
Full itinerary JSON (invented by LLM)
↓
MongoDB (saved as Trip)
```

**Phase 12 target:**
```
Algorithm → structured itinerary JSON
↓
LLM receives the JSON
↓
LLM writes natural-language explanations
↓
Frontend
```

The LLM will not invent attraction names, prices, or availability after Phase 12.
