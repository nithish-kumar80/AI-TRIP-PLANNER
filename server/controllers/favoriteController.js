const Favorite = require('../models/Favorite');

exports.addFavorite = async (req, res, next) => {
  try {
    const favoriteData = req.body;
    favoriteData.user = req.user.id;
    const favorite = new Favorite(favoriteData);
    await favorite.save();
    res.status(201).json({ success: true, favorite });
  } catch (error) {
    next(error);
  }
};

exports.getFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id }).populate('hotel trip');
    res.status(200).json({ success: true, favorites });
  } catch (error) {
    next(error);
  }
};

exports.removeFavorite = async (req, res, next) => {
  try {
    await Favorite.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.status(200).json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    next(error);
  }
};
