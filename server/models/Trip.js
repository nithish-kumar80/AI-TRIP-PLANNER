const mongoose = require('mongoose');

const dayActivitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  location: String,
  description: String,
  estimatedCost: Number,
  coordinates: { lat: Number, lng: Number },
}, { _id: false });

// Separate schema needed — Mongoose reserves the 'type' keyword,
// so inline { type: String, name: String } is misread as a String field.
const mealSchema = new mongoose.Schema({
  mealType: String,   // renamed from 'type' to avoid Mongoose conflict
  name: String,
  cuisine: String,
  priceRange: String,
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: Number,
  date: String,
  title: String,
  activities: [dayActivitySchema],
  meals: [mealSchema],
  accommodation: { name: String, address: String, checkIn: String, checkOut: String },
}, { _id: false });

const tripSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    destination: { type: String, required: true },
    destinationCoordinates: { lat: Number, lng: Number },
    coverImage: { type: String, default: null },
    startDate: Date,
    endDate: Date,
    duration: { type: Number, required: true }, // days
    travelers: { type: Number, required: true, min: 1 },
    budget: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    interests: [String],
    transportationMode: { type: String, enum: ['flight', 'train', 'bus', 'car', 'mixed'], default: 'mixed' },
    status: { type: String, enum: ['draft', 'planned', 'active', 'completed', 'cancelled'], default: 'planned' },
    overview: String,
    highlights: [String],
    itinerary: [daySchema],
    budgetBreakdown: {
      hotel: Number,
      transport: Number,
      food: Number,
      shopping: Number,
      entertainment: Number,
      emergency: Number,
    },
    recommendedHotels: [{
      name: String,
      address: String,
      pricePerNight: Number,
      rating: Number,
      amenities: [String],
      whyRecommended: String,
    }],
    recommendedRestaurants: [{
      name: String,
      cuisine: String,
      priceRange: String,
      rating: Number,
      address: String,
    }],
    travelTips: [String],
    packingChecklist: {
      clothes: [String],
      electronics: [String],
      medicines: [String],
      documents: [String],
      accessories: [String],
    },
    aiGenerated: { type: Boolean, default: false },
    isPublic: { type: Boolean, default: false },
    isSaved: { type: Boolean, default: true },
    tags: [String],
    weatherInfo: {
      season: String,
      avgTemp: String,
      climate: String,
    },
  },
  { timestamps: true }
);

tripSchema.index({ user: 1, createdAt: -1 });
tripSchema.index({ destination: 'text', title: 'text' });

module.exports = mongoose.model('Trip', tripSchema);
