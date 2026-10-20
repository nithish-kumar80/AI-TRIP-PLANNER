const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    roomNumber: String,
    roomType: {
      type: String,
      enum: ['standard', 'deluxe', 'suite', 'executive', 'penthouse', 'studio', 'family', 'accessible'],
      required: true,
    },
    name: { type: String, required: true },
    description: String,
    images: [String],
    maxOccupancy: { type: Number, required: true, min: 1 },
    bedType: { type: String, enum: ['single', 'double', 'queen', 'king', 'twin', 'bunk'], default: 'double' },
    bedCount: { type: Number, default: 1 },
    size: Number, // sq ft
    floorLevel: Number,
    pricePerNight: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    amenities: [String],
    view: { type: String, enum: ['city', 'ocean', 'garden', 'pool', 'mountain', 'courtyard', 'none'], default: 'none' },
    isAvailable: { type: Boolean, default: true },
    smokingAllowed: { type: Boolean, default: false },
    totalRooms: { type: Number, default: 5 },
    availableRooms: { type: Number, default: 5 },
  },
  { timestamps: true }
);

roomSchema.index({ hotel: 1, isAvailable: 1 });

module.exports = mongoose.model('Room', roomSchema);
