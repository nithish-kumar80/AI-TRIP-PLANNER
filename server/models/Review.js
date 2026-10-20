const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, maxlength: 150 },
    comment: { type: String, required: true, maxlength: 2000 },
    ratings: {
      cleanliness: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 },
    },
    images: [String],
    travelType: { type: String, enum: ['solo', 'couple', 'family', 'business', 'friends'] },
    helpfulVotes: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: true },
    response: {
      text: String,
      respondedAt: Date,
      respondedBy: String,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for same booking
reviewSchema.index({ user: 1, booking: 1 }, { unique: true });
reviewSchema.index({ hotel: 1, rating: -1 });

// Update hotel average rating after review save
reviewSchema.post('save', async function () {
  const Hotel = require('./Hotel');
  const stats = await this.constructor.aggregate([
    { $match: { hotel: this.hotel } },
    { $group: { _id: '$hotel', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Hotel.findByIdAndUpdate(this.hotel, {
      averageRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
