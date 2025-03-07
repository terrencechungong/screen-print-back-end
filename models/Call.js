const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  callId: {
    type: String,
    required: true,
    unique: true
  },
  transcriptUrl: String,
  summary: String,
  opportunityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  },
  fromNumber: String,
  toNumber: String,
  duration: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  concatenatedTranscript: String,
  transcripts: [{
    id: Number,
    user: String,
    text: String,
    created_at: Date
  }],
  analysis: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  recordingUrl: String,
  status: String
});

module.exports = mongoose.model('Call', CallSchema); 