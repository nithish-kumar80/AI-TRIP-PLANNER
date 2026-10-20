const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/', protect, reviewController.createReview);
router.get('/hotel/:hotelId', optionalAuth, reviewController.getHotelReviews);

module.exports = router;
