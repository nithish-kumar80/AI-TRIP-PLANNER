/**
 * agentController.js
 * Handles all /api/agent/* routes.
 *
 * POST /api/agent/generate  — generate a new trip
 * POST /api/agent/modify    — modify an existing trip
 */

const Trip = require('../models/Trip');
const { generateTrip, modifyTrip } = require('../services/agent/travelAgent');

// ─── POST /api/agent/generate ─────────────────────────────────────────────────
// Accepts either:
//   { userText: "Plan me a 5-day trip to Paris..." }      ← natural language
//   { formData: { destination, duration, budget, ... } }   ← form submission
exports.generate = async (req, res, next) => {
  try {
    const { userText, formData } = req.body;
    if (!userText && !formData) {
      return res.status(400).json({ success: false, message: 'Provide userText or formData.' });
    }

    const result = await generateTrip({ userText, formData }, req.user._id);
    const { trip, intent, stages, costs, weather, events } = result;

    // Save to MongoDB (status = 'planned' by default)
    const saved = await Trip.create({ ...trip, user: req.user._id });

    return res.status(201).json({
      success: true,
      message: 'Trip generated successfully.',
      data: {
        trip: saved,
        intent,
        costs,
        stages,
        weatherSummary: weather?.length > 0 ? {
          avgTempC: Math.round(weather.reduce((s, d) => s + d.tempC, 0) / weather.length),
          rainyDays: weather.filter(d => d.rain).length,
          isMock: weather[0]?.isMock || false,
        } : null,
        eventCount: events?.length || 0,
        isMockWeather: weather?.[0]?.isMock || false,
        isMockEvents: events?.[0]?.isMock || false,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/agent/modify ───────────────────────────────────────────────────
// Accepts:
//   { tripId, modificationText, currentIntent }
// Re-runs the agent with the modification applied to the intent.
exports.modify = async (req, res, next) => {
  try {
    const { tripId, modificationText, currentIntent } = req.body;
    if (!currentIntent || !modificationText) {
      return res.status(400).json({ success: false, message: 'Provide currentIntent and modificationText.' });
    }

    const result = await modifyTrip(currentIntent, modificationText, req.user._id);
    const { trip, modification, stages, costs } = result;

    // If tripId provided, update existing trip; otherwise create new
    let saved;
    if (tripId) {
      const existing = await Trip.findOne({ _id: tripId, user: req.user._id });
      if (!existing) return res.status(404).json({ success: false, message: 'Trip not found.' });
      saved = await Trip.findByIdAndUpdate(tripId, { ...trip }, { new: true });
    } else {
      saved = await Trip.create({ ...trip, user: req.user._id });
    }

    return res.json({
      success: true,
      message: `Trip modified: ${modification.action}`,
      data: { trip: saved, modification, stages, costs },
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/agent/confirm ──────────────────────────────────────────────────
// Mark a trip as confirmed (user approved the itinerary).
exports.confirm = async (req, res, next) => {
  try {
    const { tripId } = req.body;
    if (!tripId) return res.status(400).json({ success: false, message: 'tripId required.' });

    const trip = await Trip.findOneAndUpdate(
      { _id: tripId, user: req.user._id },
      { status: 'planned', isSaved: true },
      { new: true }
    );
    if (!trip) return res.status(404).json({ success: false, message: 'Trip not found.' });

    return res.json({
      success: true,
      message: 'Trip confirmed. You can now view hotel recommendations and make a demo booking.',
      data: { trip },
    });
  } catch (err) {
    next(err);
  }
};
