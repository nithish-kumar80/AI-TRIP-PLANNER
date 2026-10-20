const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', favoriteController.addFavorite);
router.get('/', favoriteController.getFavorites);
router.delete('/:id', favoriteController.removeFavorite);

module.exports = router;
