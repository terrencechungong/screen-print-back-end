const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  pipeline: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Opportunity'
  }],
  calls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Call'
  }],
  // We'll add aiKnowledgeBase, quotes, and forms later when you provide their structure
  createdAt: {
    type: Date,
    default: Date.now
  },
  phoneNumber: {
    type: String,
    unique: true,
    sparse: true  // Allows null values while maintaining uniqueness
  }
});

module.exports = mongoose.model('User', UserSchema); 