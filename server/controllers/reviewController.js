const Review = require('../models/Review');

exports.createReview = async (req, res, next) => {
  try {
    const reviewData = req.body;
    reviewData.user = req.user.id;
    const review = new Review(reviewData);
    await review.save();
    res.status(201).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

exports.getHotelReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ hotel: req.params.hotelId }).populate('user', 'name avatar');
    res.status(200).json({ success: true, reviews });
  } catch (error) {
    next(error);
  }
};
