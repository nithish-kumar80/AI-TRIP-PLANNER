const mongoose = require('mongoose');

/**
 * UserInteraction — tracks every user action on a place.
 *
 * This is the raw signal used to:
 *   1. Update the user's preference vector (UserPreference)
 *   2. Generate training data for the ML recommendation model
 *   3. Drive personalization analytics on the AI insights dashboard
 *
 * Interaction weights (used in preference update):
 *   VIEW            → +0.01  (weak signal)
 *   CLICK           → +0.02
 *   LIKE            → +0.10  (strong positive)
 *   SAVE            → +0.08
 *   ITINERARY_ADDED → +0.12  (strongest positive)
 *   REJECT          → -0.08  (strong negative)
 *   ITINERARY_REMOVED → -0.05
 *   VISITED         → +0.15  (post-trip confirmation)
 */
const userInteractionSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    place: { type: mongoose.Schema.Types.ObjectId, ref: 'Place', required: true },

    interactionType: {
      type: String,
      required: true,
      enum: [
        'VIEW',
        'CLICK',
        'LIKE',
        'SAVE',
        'REJECT',
        'VISITED',
        'ITINERARY_ADDED',
        'ITINERARY_REMOVED',
      ],
    },

    // Context at time of interaction
    context: {
      tripId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
      destination:  { type: String, default: '' },
      sessionId:    { type: String, default: '' },
    },

    // For ML training dataset
    // Derived score: 1 = positive interaction (LIKE/SAVE/ITINERARY_ADDED/VISITED)
    //                0 = negative interaction (REJECT/ITINERARY_REMOVED)
    //               -1 = neutral (VIEW/CLICK — excluded from binary classification)
    mlLabel: { type: Number, enum: [-1, 0, 1], default: -1 },
  },
  { timestamps: true }
);

userInteractionSchema.index({ user: 1, place: 1, interactionType: 1 });
userInteractionSchema.index({ user: 1, createdAt: -1 });
userInteractionSchema.index({ place: 1, interactionType: 1 });

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
