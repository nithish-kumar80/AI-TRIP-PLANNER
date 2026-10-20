const mongoose = require('mongoose');

/**
 * Restaurant — food/drink establishments seeded from OpenStreetMap.
 * Ranked by: cuisine match + budget + distance + rating + dietary options.
 * dataSource tracks whether data came from OSM or was manually seeded.
 */
const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },

    city: { type: String, required: true, lowercase: true, trim: true },
    country: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    // Cuisine types (can have multiple: e.g. ['Indian', 'South Indian'])
    cuisine: { type: [String], default: ['local'] },

    priceRange: {
      type: String,
      enum: ['$', '$$', '$$$', '$$$$'],
      default: '$$',
    },
    pricePerPerson: { type: Number, default: 300 }, // INR

    rating: { type: Number, min: 0, max: 5, default: 4.0 },
    reviewCount: { type: Number, default: 0 },

    dietaryOptions: {
      type: [String],
      enum: ['vegetarian', 'vegan', 'halal', 'jain', 'gluten_free', 'non_vegetarian', 'seafood'],
      default: [],
    },
    mealTypes: {
      type: [String],
      enum: ['breakfast', 'brunch', 'lunch', 'dinner', 'snacks', 'drinks', 'all_day'],
      default: ['lunch', 'dinner'],
    },

    openingHours: {
      open:  { type: String, default: '11:00' },
      close: { type: String, default: '22:00' },
      closedDays: { type: [String], default: [] },
    },

    tags:       { type: [String], default: [] },
    dataSource: {
      type: String,
      enum: ['OpenStreetMap', 'seeded', 'manual'],
      default: 'OpenStreetMap',
    },
    osmId: { type: String, default: null, sparse: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

restaurantSchema.index({ city: 1, cuisine: 1 });
restaurantSchema.index({ city: 1, priceRange: 1 });
restaurantSchema.index({ name: 'text', cuisine: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
