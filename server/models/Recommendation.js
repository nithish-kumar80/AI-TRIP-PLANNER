const mongoose = require('mongoose');

/**
 * Recommendation — stores scored recommendation results for a user/trip context.
 *
 * Why store recommendations?
 * 1. Audit trail — we can verify the engine produced real scores (not invented)
 * 2. Analytics — compute Precision@K, Recall@K, NDCG@K from later interactions
 * 3. Debugging — inspect what score components drove each recommendation
 * 4. A/B testing when multiple engine versions exist
 *
 * Every score field maps to a real calculation:
 *   preferenceScore → cosine similarity(userVector, placeVector)
 *   semanticScore   → cosine similarity(queryEmbedding, placeEmbedding)
 *   mlScore         → XGBoost probability output
 *   budgetScore     → 1 - |normalizedCost - normalizedBudget|
 *   ratingScore     → place.rating / 5
 *   seasonScore     → 1 if bestSeason matches travel dates, 0.5 otherwise
 *   hybridScore     → weighted sum of all above
 */
const recommendationSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },
    trip:  { type: mongoose.Schema.Types.ObjectId, ref: 'Trip',  default: null },

    // ─── Score Components ────────────────────────────────────────────────────
    hybridScore:     { type: Number, min: 0, max: 1, default: 0 }, // final weighted score
    preferenceScore: { type: Number, min: 0, max: 1, default: 0 }, // cosine similarity
    semanticScore:   { type: Number, min: 0, max: 1, default: 0 }, // embedding similarity
    mlScore:         { type: Number, min: 0, max: 1, default: 0 }, // ML model probability
    budgetScore:     { type: Number, min: 0, max: 1, default: 0 }, // budget compatibility
    ratingScore:     { type: Number, min: 0, max: 1, default: 0 }, // normalized rating
    seasonScore:     { type: Number, min: 0, max: 1, default: 0 }, // seasonal fit

    // ─── Explainability ──────────────────────────────────────────────────────
    // Generated from score components — NOT from LLM
    reasons: { type: [String], default: [] },

    rank: { type: Number, default: 0 }, // position in the ranked list

    // ─── Context ─────────────────────────────────────────────────────────────
    context: {
      destination:  { type: String, default: '' },
      budget:       { type: Number, default: 0 },
      travelers:    { type: Number, default: 1 },
      travelDates:  { start: Date, end: Date },
      query:        { type: String, default: '' }, // semantic search query if any
    },

    // ─── Outcome Tracking (filled after user interaction) ────────────────────
    wasShownToUser:  { type: Boolean, default: false },
    interactionType: { type: String, default: null }, // what user did with it

    // ─── Engine Metadata ─────────────────────────────────────────────────────
    engineVersion: { type: String, default: 'baseline-v1' }, // baseline, hybrid-v1, etc.
    weights: {
      // Store the weights used at time of scoring for reproducibility
      semantic:    { type: Number, default: 0 },
      preference:  { type: Number, default: 0 },
      ml:          { type: Number, default: 0 },
      budget:      { type: Number, default: 0 },
      rating:      { type: Number, default: 0 },
      season:      { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

recommendationSchema.index({ user: 1, trip: 1, hybridScore: -1 });
recommendationSchema.index({ user: 1, createdAt: -1 });
recommendationSchema.index({ place: 1, interactionType: 1 }); // for precision/recall calculation

module.exports = mongoose.model('Recommendation', recommendationSchema);
