const express = require('express');
const router = express.Router();
const placeController = require('../controllers/placeController');
const { optionalAuth } = require('../middleware/auth');

router.get('/cities', placeController.getCities);
router.get('/categories', placeController.getCategories);
router.get('/city/:city', placeController.getPlacesByCity);
router.get('/', optionalAuth, placeController.getPlaces);
router.get('/:id', optionalAuth, placeController.getPlace);

module.exports = router;
