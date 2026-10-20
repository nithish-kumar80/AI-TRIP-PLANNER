const mongoose = require('mongoose');

/**
 * UserPreference — stores each user's normalized preference vector.
 *
 * This is the mathematical heart of personalization.
 *
 * The preference vector has 7 dimensions, each 0–1:
 *   nature       → forests, beaches, wildlife, parks
 *   adventure    → trekking, rafting, rock climbing
 *   culture      → museums, temples, heritage, history
 *   food         → restaurants, street food, food markets
 *   relaxation   → spas, gardens, quiet beaches
 *   nightlife    → clubs, bars, evening shows
 *   photography  → viewpoints, architecture, landscapes
 *
 * Updated by:
 *   1. User onboarding (ProfilePage interests)
 *   2. Interaction signals (UserInteraction events)
 *   3. Explicit profile preference settings
 *
 * version increments on every update — used to track preference drift
 * over time in the AI analytics dashboard.
 */
const userPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one preference document per user
    },

    // ─── Preference Vector ───────────────────────────────────────────────────
    nature:       { type: Number, min: 0, max: 1, default: 0.5 },
    adventure:    { type: Number, min: 0, max: 1, default: 0.5 },
    culture:      { type: Number, min: 0, max: 1, default: 0.5 },
    food:         { type: Number, min: 0, max: 1, default: 0.5 },
    relaxation:   { type: Number, min: 0, max: 1, default: 0.5 },
    nightlife:    { type: Number, min: 0, max: 1, default: 0.2 },
    photography:  { type: Number, min: 0, max: 1, default: 0.5 },

    // ─── Budget & Style Preferences ──────────────────────────────────────────
    budgetPerDay: { type: Number, default: 2000 }, // INR/day total spend
    accommodationPreference: {
      type: String,
      enum: ['budget', 'midrange', 'luxury'],
      default: 'midrange',
    },
    pace: {
      type: String,
      enum: ['slow', 'moderate', 'fast'],
      default: 'moderate',
    },
    transportPreference: {
      type: String,
      enum: ['public', 'private', 'mixed'],
      default: 'mixed',
    },
    cuisinePreferences: { type: [String], default: [] },
    dietaryRestrictions: { type: [String], default: [] },

    // ─── Vector Statistics ───────────────────────────────────────────────────
    // Used for AI analytics dashboard and debugging
    totalInteractions: { type: Number, default: 0 },
    version:           { type: Number, default: 1 }, // increments on every vector update
    initializedFrom:   { type: String, enum: ['onboarding', 'interactions', 'manual', 'default'], default: 'default' },
  },
  { timestamps: true }
);

/**
 * Returns the preference vector as a plain JS array [nature, adventure, culture, food, relaxation, nightlife, photography]
 * Used by the cosine-similarity engine.
 */
userPreferenceSchema.methods.toVector = function () {
  return [
    this.nature,
    this.adventure,
    this.culture,
    this.food,
    this.relaxation,
    this.nightlife,
    this.photography,
  ];
};

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
