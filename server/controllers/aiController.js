const geminiService = require('../services/ai/geminiService');
const ChatHistory = require('../models/ChatHistory');
const Trip = require('../models/Trip');

// ─── Helper ───────────────────────────────────────────────────────────────────
const respond = (res, data) => res.status(200).json({ success: true, data });
const err = (next, error) => next(error);

// ─── POST /api/ai/plan  (generate full trip itinerary + save as trip) ─────────
exports.generatePlan = async (req, res, next) => {
  try {
    const { destination, budget, travelers, duration, interests, transportationMode, currency = 'INR', startDate } = req.body;

    if (!destination || !budget || !travelers || !duration) {
      return res.status(400).json({ success: false, message: 'destination, budget, travelers and duration are required.' });
    }

    // Call Gemini
    const itinerary = await geminiService.generateItinerary({
      destination, budget, travelers, duration, interests, transportationMode, currency,
    });

    // Auto-save the generated trip to DB for the logged-in user
    let savedTrip = null;
    try {
      savedTrip = await Trip.create({
        user: req.user._id,
        title: itinerary.title || `${duration}-Day Trip to ${destination}`,
        destination,
        destinationCoordinates: itinerary.destinationCoordinates,
        duration: parseInt(duration),
        travelers: parseInt(travelers),
        budget: parseInt(budget),
        currency,
        interests: interests || [],
        transportationMode: transportationMode || 'mixed',
        overview: itinerary.overview,
        highlights: itinerary.highlights,
        itinerary: itinerary.itinerary,
        budgetBreakdown: itinerary.budgetBreakdown,
        recommendedHotels: itinerary.recommendedHotels,
        recommendedRestaurants: itinerary.recommendedRestaurants,
        travelTips: itinerary.travelTips,
        packingChecklist: itinerary.packingChecklist,
        weatherInfo: itinerary.weatherInfo,
        aiGenerated: true,
        isSaved: false,
        ...(startDate && { startDate: new Date(startDate) }),
      });
    } catch (saveErr) {
      console.error('Trip auto-save failed (non-blocking):', saveErr.message);
    }

    return respond(res, { itinerary, tripId: savedTrip?._id });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/itinerary  (alias for backward compat) ─────────────────────
exports.generateItinerary = async (req, res, next) => {
  try {
    const itinerary = await geminiService.generateItinerary(req.body);
    return respond(res, { itinerary });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/recommend-hotels ───────────────────────────────────────────
exports.recommendHotels = async (req, res, next) => {
  try {
    const hotels = await geminiService.recommendHotels(req.body);
    return respond(res, { hotels });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/budget ─────────────────────────────────────────────────────
exports.generateBudget = async (req, res, next) => {
  try {
    const budgetPlan = await geminiService.generateBudget(req.body);
    return respond(res, { budgetPlan });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/packing ────────────────────────────────────────────────────
exports.generatePackingList = async (req, res, next) => {
  try {
    const packingList = await geminiService.generatePackingList(req.body);
    return respond(res, { packingList });
  } catch (error) {
    next(error);
  }
};

// ─── POST /api/ai/chat ───────────────────────────────────────────────────────
// Frontend sends { message, sessionId }
// We load history from DB, call Gemini, save updated history, return reply
exports.chat = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({ success: false, message: 'message and sessionId are required.' });
    }

    // Load or create session
    let session = await ChatHistory.findOne({ sessionId, user: req.user._id });
    if (!session) {
      session = new ChatHistory({
        user: req.user._id,
        sessionId,
        title: message.substring(0, 60),
        messages: [],
        totalMessages: 0,
        lastMessage: '',
      });
    }

    // Get recent history (last 20 messages to keep context reasonable)
    const history = session.messages.slice(-20);

    // Call Gemini with current message + history
    const reply = await geminiService.chat(message, history);

    // Append both user message and AI reply to session
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: reply });
    session.lastMessage = reply.substring(0, 100);
    session.lastActivity = new Date();
    session.totalMessages = session.messages.length;

    // Update title from first message if still default
    if (session.title === 'New Conversation' && message.length > 0) {
      session.title = message.substring(0, 60);
    }

    await session.save();

    return respond(res, { reply, sessionId });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/ai/chat/history ────────────────────────────────────────────────
exports.getChatHistory = async (req, res, next) => {
  try {
    const sessions = await ChatHistory.find({ user: req.user._id })
      .sort({ lastActivity: -1 })
      .limit(20)
      .select('sessionId title lastMessage lastActivity totalMessages createdAt');

    return respond(res, {
      sessions: sessions.map((s) => ({
        sessionId: s.sessionId,
        title: s.title,
        lastMessage: s.lastMessage,
        lastActivity: s.lastActivity,
        totalMessages: s.totalMessages,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─── GET /api/ai/chat/:sessionId ─────────────────────────────────────────────
exports.getChatSession = async (req, res, next) => {
  try {
    const chat = await ChatHistory.findOne({
      sessionId: req.params.sessionId,
      user: req.user._id,
    });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat session not found.' });
    }

    return respond(res, { chat });
  } catch (error) {
    next(error);
  }
};

// ─── DELETE /api/ai/chat/:sessionId ──────────────────────────────────────────
exports.deleteChatSession = async (req, res, next) => {
  try {
    await ChatHistory.findOneAndDelete({
      sessionId: req.params.sessionId,
      user: req.user._id,
    });
    return res.status(200).json({ success: true, message: 'Chat session deleted.' });
  } catch (error) {
    next(error);
  }
};
