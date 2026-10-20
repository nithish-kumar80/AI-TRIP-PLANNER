const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { protect } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

// All agent routes require authentication
router.use(protect, aiLimiter);

// POST /api/agent/generate — full AI agent pipeline
// Body: { userText: "..." } or { formData: { destination, duration, budget, ... } }
router.post('/generate', agentController.generate);

// POST /api/agent/modify — natural-language modification
// Body: { tripId, modificationText, currentIntent }
router.post('/modify', agentController.modify);

// POST /api/agent/confirm — confirm an itinerary (enables hotel booking step)
// Body: { tripId }
router.post('/confirm', agentController.confirm);

module.exports = router;
