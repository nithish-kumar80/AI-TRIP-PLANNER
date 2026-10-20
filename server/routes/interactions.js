const express = require('express');
const router = express.Router();
const interactionController = require('../controllers/interactionController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', interactionController.createInteraction);
router.get('/', interactionController.getMyInteractions);
router.get('/stats', interactionController.getInteractionStats);

module.exports = router;
