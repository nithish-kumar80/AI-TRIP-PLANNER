const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/baseline', recommendationController.getBaselineRecommendations);
router.get('/preferences', recommendationController.getMyPreferences);
router.put('/preferences', recommendationController.updatePreferences);

// Phase 7 routes (Hybrid engine — added when Python service is ready)
// router.get('/personalized', recommendationController.getHybridRecommendations);
// router.get('/semantic', recommendationController.getSemanticRecommendations);

module.exports = router;
