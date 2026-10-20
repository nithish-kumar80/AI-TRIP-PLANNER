const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const { optionalAuth } = require('../middleware/auth');

// NOTE: /featured must come BEFORE /:id so it isn't captured by the wildcard
router.get('/featured', optionalAuth, hotelController.getFeaturedHotels);
router.get('/', optionalAuth, hotelController.searchHotels);
router.get('/:id', optionalAuth, hotelController.getHotel);

module.exports = router;
