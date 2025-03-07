const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'Airesphone'
  },
  stage: {
    type: String,
    enum: ['CLOSED', 'CONTACTED', 'NEW LEAD', 'QUOTE SENT'],
    required: true
  },
  source: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  inquiry: {
    type: String,
    required: true
  },
  contactInfo: {
    email: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    companyName: {
      type: String,
      required: true
    }
  }
});

module.exports = mongoose.model('Opportunity', OpportunitySchema); 