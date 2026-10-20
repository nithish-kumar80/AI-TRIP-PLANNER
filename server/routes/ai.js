const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// All AI routes require auth + rate limit
router.use(protect, aiLimiter);

// ─── Trip Planning ─────────────────────────────────────────────────────────────
// /api/ai/plan  ← what the frontend TripPlannerPage calls
router.post('/plan', aiController.generatePlan);

// /api/ai/itinerary  ← legacy alias
router.post('/itinerary', aiController.generateItinerary);

// ─── Supporting AI features ───────────────────────────────────────────────────
// /api/ai/recommend-hotels  ← what frontend aiService.recommendHotels calls
router.post('/recommend-hotels', aiController.recommendHotels);

// /api/ai/hotels  ← legacy alias
router.post('/hotels', aiController.recommendHotels);

// /api/ai/budget
router.post('/budget', aiController.generateBudget);

// /api/ai/packing
router.post('/packing', aiController.generatePackingList);

// ─── Chat ─────────────────────────────────────────────────────────────────────
// ORDER MATTERS: /chat/history must come before /chat/:sessionId
router.get('/chat/history', aiController.getChatHistory);
router.get('/chat/:sessionId', aiController.getChatSession);
router.delete('/chat/:sessionId', aiController.deleteChatSession);
router.post('/chat', aiController.chat);

module.exports = router;
