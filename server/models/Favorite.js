const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemType: { type: String, enum: ['hotel', 'destination', 'trip'], required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null },
    destination: { type: String, default: null },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    notes: String,
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, itemType: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
