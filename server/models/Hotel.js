const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: String,
    address: { type: String, required: true },
    city: { type: String, required: true, lowercase: true },
    country: { type: String, required: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    images: [String],
    coverImage: String,
    starRating: { type: Number, min: 1, max: 5, default: 3 },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    pricePerNight: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    amenities: [{
      type: String,
      enum: ['wifi', 'pool', 'gym', 'spa', 'restaurant', 'bar', 'parking', 'airconditioning',
             'room_service', 'conference', 'pet_friendly', 'beach_access', 'airport_shuttle',
             'laundry', 'concierge', 'ev_charging', 'business_center', 'kids_club'],
    }],
    hotelType: { type: String, enum: ['hotel', 'resort', 'boutique', 'hostel', 'villa', 'apartment', 'guesthouse'], default: 'hotel' },
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    policies: {
      cancellationPolicy: { type: String, default: 'Free cancellation up to 24 hours before check-in' },
      petPolicy: String,
      smokingPolicy: { type: String, default: 'Non-smoking property' },
      ageRestriction: { type: Number, default: 18 },
    },
    contactInfo: {
      phone: String,
      email: String,
      website: String,
    },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    nearbyAttractions: [{ name: String, distance: String, type: String }],
    tags: [String],
  },
  { timestamps: true }
);

hotelSchema.index({ city: 1, pricePerNight: 1 });
// Note: 2dsphere index removed — geo queries not used in current implementation
hotelSchema.index({ name: 'text', city: 'text', description: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema);
