const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    tripId: mongoose.Schema.Types.ObjectId,
    suggestedActions: [String],
    relatedDestinations: [String],
  },
}, { _id: false });

const chatHistorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: String, required: true, unique: true },
    title: { type: String, default: 'New Conversation' },
    messages: [messageSchema],
    isActive: { type: Boolean, default: true },
    totalMessages: { type: Number, default: 0 },
    lastMessage: { type: String, default: '' },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatHistorySchema.index({ user: 1, lastActivity: -1 });

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
