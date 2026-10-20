const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    transactionId: { type: String, unique: true, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'success' },
    method: { type: String, enum: ['card', 'upi', 'netbanking', 'wallet', 'cash'] },
    gateway: { type: String, default: 'manual' },
    metadata: mongoose.Schema.Types.Mixed,
    refundAmount: Number,
    refundedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
