const UserPreference = require('../models/UserPreference');
const Recommendation = require('../models/Recommendation');
const Place = require('../models/Place');
const { AppError } = require('../middleware/errorHandler');

// ─── Cosine Similarity (pure JS implementation — Phase 3 baseline) ────────────
// Formula: cos(θ) = (A · B) / (|A| × |B|)
// Returns a value between 0 (completely different) and 1 (identical direction).
// This is the ACTUAL mathematical calculation — not an invented score.
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot  += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// Convert a Place document into the same 7-dimensional vector as UserPreference
function placeToVector(place) {
  return [
    place.natureScore,
    place.adventureScore,
    place.cultureScore,
    place.foodScore,
    place.relaxationScore,
    place.nightlifeScore,
    place.photographyScore,
  ];
}

// Budget score: 1.0 if cost ≤ budget, decays as cost exceeds budget
function budgetScore(averageCost, budgetPerDay) {
  if (!averageCost || averageCost === 0) return 0.8; // unknown cost — moderate score
  if (averageCost <= budgetPerDay) return 1.0;
  const ratio = averageCost / budgetPerDay;
  return Math.max(0, 1 - (ratio - 1)); // linear decay above budget
}

// Season score: 1.0 if travel month is in bestSeason, 0.5 if 'all', 0.3 if no match
function seasonScore(place, travelMonth) {
  if (!travelMonth) return 0.5;
  if (place.bestSeason.includes('all')) return 0.7;
  const SEASON_MAP = {
    12: 'winter', 1: 'winter', 2: 'winter',
    3: 'spring',  4: 'spring', 5: 'spring',
    6: 'monsoon', 7: 'monsoon', 8: 'monsoon',
    9: 'autumn',  10: 'autumn', 11: 'autumn',
  };
  const currentSeason = SEASON_MAP[parseInt(travelMonth)];
  return place.bestSeason.includes(currentSeason) ? 1.0 : 0.3;
}

// Generate human-readable reasons from score components (NOT from LLM)
function generateReasons(preferenceScore, budgetSc, seasonSc, ratingScore, userPref, place) {
  const reasons = [];
  if (preferenceScore >= 0.7) {
    const topDims = ['nature', 'adventure', 'culture', 'food', 'relaxation', 'photography'];
    const matching = topDims.filter(d => userPref[d] > 0.6 && place[`${d}Score`] > 0.6);
    if (matching.length > 0) reasons.push(`Matches your ${matching.join(' & ')} interests`);
  }
  if (budgetSc >= 0.9) reasons.push('Fits within your daily budget');
  else if (budgetSc < 0.5) reasons.push('Note: May exceed your budget');
  if (seasonSc >= 0.8) reasons.push('Great time of year to visit');
  if (ratingScore >= 0.8) reasons.push(`Highly rated (${(place.rating).toFixed(1)}/5)`);
  if (reasons.length === 0) reasons.push('Recommended based on your travel profile');
  return reasons;
}

// ─── BASELINE RECOMMENDATION ENGINE ─────────────────────────────────────────
// Phase 3 implementation: pure cosine similarity + weighted scoring.
// No ML model yet (Phase 6). Engine version = 'baseline-v1'.
const BASELINE_WEIGHTS = {
  preference: 0.45, // cosine similarity between user and place vectors
  budget:     0.25, // how well the cost fits the user's budget
  rating:     0.20, // normalized place rating
  season:     0.10, // seasonal fit
};

// GET /api/recommendations/baseline?city=...&budget=...&travelers=...&month=...
exports.getBaselineRecommendations = async (req, res, next) => {
  try {
    const { city, budget, travelers = 1, month, limit = 20 } = req.query;
    const userId = req.user._id;

    // 1. Get user preference vector
    let userPref = await UserPreference.findOne({ user: userId });
    if (!userPref) {
      userPref = await UserPreference.create({ user: userId, initializedFrom: 'default' });
    }
    const userVec = userPref.toVector();
    const dailyBudget = budget ? parseInt(budget) / Math.max(parseInt(travelers), 1) : userPref.budgetPerDay;

    // 2. Get candidate places
    const filter = { isActive: true };
    if (city) filter.city = { $regex: city, $options: 'i' };
    const places = await Place.find(filter).limit(200); // candidate pool

    if (places.length === 0) {
      return res.json({ success: true, data: { recommendations: [], message: `No places found for ${city || 'this destination'}.` } });
    }

    // 3. Score each place
    const scored = places.map(place => {
      const placeVec   = placeToVector(place);
      const prefScore  = cosineSimilarity(userVec, placeVec);
      const budgScore  = budgetScore(place.averageCost, dailyBudget);
      const ratScore   = place.rating / 5;
      const seasScore  = seasonScore(place, month);
      const hybrid     = (
        prefScore  * BASELINE_WEIGHTS.preference +
        budgScore  * BASELINE_WEIGHTS.budget +
        ratScore   * BASELINE_WEIGHTS.rating +
        seasScore  * BASELINE_WEIGHTS.season
      );
      const reasons = generateReasons(prefScore, budgScore, seasScore, ratScore, userPref, place);
      return {
        place,
        scores: {
          hybridScore:     Math.round(hybrid * 1000) / 1000,
          preferenceScore: Math.round(prefScore * 1000) / 1000,
          semanticScore:   0,    // Phase 5
          mlScore:         0,    // Phase 6
          budgetScore:     Math.round(budgScore * 1000) / 1000,
          ratingScore:     Math.round(ratScore * 1000) / 1000,
          seasonScore:     Math.round(seasScore * 1000) / 1000,
        },
        reasons,
      };
    });

    // 4. Sort by hybrid score, take top-K
    scored.sort((a, b) => b.scores.hybridScore - a.scores.hybridScore);
    const topK = scored.slice(0, parseInt(limit));

    // 5. Persist recommendations for analytics (non-blocking)
    persistRecommendations(userId, topK, { city, budget: dailyBudget, travelers, month }).catch(console.error);

    return res.json({
      success: true,
      data: {
        recommendations: topK,
        userPreferenceVector: {
          nature:      userPref.nature,
          adventure:   userPref.adventure,
          culture:     userPref.culture,
          food:        userPref.food,
          relaxation:  userPref.relaxation,
          nightlife:   userPref.nightlife,
          photography: userPref.photography,
        },
        engineVersion: 'baseline-v1',
        weights: BASELINE_WEIGHTS,
        totalCandidates: places.length,
        note: 'Scores computed via cosine similarity + weighted ranking. ML model (Phase 6) not yet active.',
      },
    });
  } catch (err) { next(err); }
};

// GET /api/recommendations/preferences — get current user's preference vector
exports.getMyPreferences = async (req, res, next) => {
  try {
    let pref = await UserPreference.findOne({ user: req.user._id });
    if (!pref) pref = await UserPreference.create({ user: req.user._id, initializedFrom: 'default' });
    return res.json({ success: true, data: { preferences: pref } });
  } catch (err) { next(err); }
};

// PUT /api/recommendations/preferences — update preference vector from profile
exports.updatePreferences = async (req, res, next) => {
  try {
    const allowed = ['nature', 'adventure', 'culture', 'food', 'relaxation', 'nightlife', 'photography',
                     'budgetPerDay', 'accommodationPreference', 'pace', 'transportPreference',
                     'cuisinePreferences', 'dietaryRestrictions'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    let pref = await UserPreference.findOneAndUpdate(
      { user: req.user._id },
      { ...updates, $inc: { version: 1 }, initializedFrom: 'onboarding' },
      { new: true, upsert: true, runValidators: true }
    );

    return res.json({ success: true, message: 'Preferences updated.', data: { preferences: pref } });
  } catch (err) { next(err); }
};

// ─── Persist recommendations to DB for later analytics ───────────────────────
async function persistRecommendations(userId, recommendations, context) {
  try {
    const docs = recommendations.map((r, i) => ({
      user:  userId,
      place: r.place._id,
      rank:  i + 1,
      ...r.scores,
      reasons: r.reasons,
      context,
      engineVersion: 'baseline-v1',
      weights: BASELINE_WEIGHTS,
      wasShownToUser: true,
    }));
    await Recommendation.insertMany(docs, { ordered: false });
  } catch (e) {
    console.warn('[Recommendations] Persist failed (non-critical):', e.message);
  }
}
