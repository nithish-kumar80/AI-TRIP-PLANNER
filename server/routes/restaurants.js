const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurantController');
const { optionalAuth } = require('../middleware/auth');

router.get('/city/:city', restaurantController.getRestaurantsByCity);
router.get('/', optionalAuth, restaurantController.getRestaurants);
router.get('/:id', optionalAuth, restaurantController.getRestaurant);

module.exports = router;
