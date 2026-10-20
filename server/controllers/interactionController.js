const UserInteraction = require('../models/UserInteraction');
const UserPreference = require('../models/UserPreference');
const Place = require('../models/Place');
const { AppError } = require('../middleware/errorHandler');

// Weight applied to each interaction type when updating the preference vector
const INTERACTION_WEIGHTS = {
  VIEW:              0.01,
  CLICK:             0.02,
  LIKE:              0.10,
  SAVE:              0.08,
  ITINERARY_ADDED:   0.12,
  VISITED:           0.15,
  REJECT:           -0.08,
  ITINERARY_REMOVED:-0.05,
};

// ml label mapping: 1 = positive, 0 = negative, -1 = neutral (excluded from classification)
const ML_LABELS = {
  LIKE: 1, SAVE: 1, ITINERARY_ADDED: 1, VISITED: 1,
  REJECT: 0, ITINERARY_REMOVED: 0,
  VIEW: -1, CLICK: -1,
};

// POST /api/interactions
exports.createInteraction = async (req, res, next) => {
  try {
    const { placeId, interactionType, context = {} } = req.body;
    const userId = req.user._id;

    if (!placeId)         throw new AppError('placeId is required.', 400);
    if (!interactionType) throw new AppError('interactionType is required.', 400);

    const place = await Place.findById(placeId);
    if (!place) throw new AppError('Place not found.', 404);

    // Save interaction
    const interaction = await UserInteraction.create({
      user: userId,
      place: placeId,
      interactionType,
      context,
      mlLabel: ML_LABELS[interactionType] ?? -1,
    });

    // Update preference vector asynchronously (non-blocking)
    updatePreferenceVector(userId, place, interactionType).catch(console.error);

    return res.status(201).json({
      success: true,
      message: 'Interaction recorded.',
      data: { interaction },
    });
  } catch (err) { next(err); }
};

// GET /api/interactions — get current user's interactions
exports.getMyInteractions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, interactionType } = req.query;
    const filter = { user: req.user._id };
    if (interactionType) filter.interactionType = interactionType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [interactions, total] = await Promise.all([
      UserInteraction.find(filter)
        .populate('place', 'name city category placeType')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      UserInteraction.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: { interactions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

// GET /api/interactions/stats — interaction counts by type (for analytics)
exports.getInteractionStats = async (req, res, next) => {
  try {
    const stats = await UserInteraction.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$interactionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json({ success: true, data: { stats } });
  } catch (err) { next(err); }
};

// ─── Internal: Update UserPreference vector from an interaction ───────────────
async function updatePreferenceVector(userId, place, interactionType) {
  const weight = INTERACTION_WEIGHTS[interactionType] ?? 0;
  if (weight === 0) return; // VIEW — no update

  let pref = await UserPreference.findOne({ user: userId });
  if (!pref) {
    pref = await UserPreference.create({ user: userId, initializedFrom: 'interactions' });
  }

  // Apply weight proportionally to each dimension based on the place's feature scores
  // e.g. LIKE on a beach (natureScore=0.9): nature += 0.10 × 0.9 = 0.09
  const dims = ['nature', 'adventure', 'culture', 'food', 'relaxation', 'nightlife', 'photography'];
  const scoreMap = {
    nature:      place.natureScore,
    adventure:   place.adventureScore,
    culture:     place.cultureScore,
    food:        place.foodScore,
    relaxation:  place.relaxationScore,
    nightlife:   place.nightlifeScore,
    photography: place.photographyScore,
  };

  let updated = false;
  for (const dim of dims) {
    const delta = weight * (scoreMap[dim] || 0);
    if (Math.abs(delta) > 0.001) {
      pref[dim] = Math.max(0, Math.min(1, pref[dim] + delta));
      updated = true;
    }
  }

  if (updated) {
    pref.totalInteractions += 1;
    pref.version += 1;
    pref.initializedFrom = 'interactions';
    await pref.save();
  }
}
