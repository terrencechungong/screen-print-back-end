import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema({
  callId: { type: String, unique: true, required: true },
  callerNumber: String,
  recipientNumber: String,
  duration: Number, // In seconds
  transcript: String,
  keywords: [String], // Extracted from transcript
  sentiment: String, // "positive", "negative", "neutral"
  createdAt: { type: Date, default: Date.now },
});

export const Call = mongoose.model('Call', CallSchema);
