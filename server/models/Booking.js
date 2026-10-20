const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hotel: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', default: null },
    bookingReference: { type: String, unique: true, required: true },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    nights: { type: Number, required: true },
    guests: {
      adults: { type: Number, default: 1 },
      children: { type: Number, default: 0 },
    },
    pricePerNight: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    taxes: { type: Number, default: 0 },
    discountAmount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'refunded'],
      default: 'confirmed',
    },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'paid' },
    paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'], default: 'card' },
    guestDetails: {
      name: String,
      email: String,
      phone: String,
    },
    specialRequests: String,
    cancellationReason: String,
    cancelledAt: Date,
    reviewLeft: { type: Boolean, default: false },
  },
  { timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ hotel: 1, checkIn: 1 });
// bookingReference already has a unique index from the field definition above

module.exports = mongoose.model('Booking', bookingSchema);
