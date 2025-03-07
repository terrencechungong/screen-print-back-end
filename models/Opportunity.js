const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  invoiceGenerated: {
    type: Boolean,
    default: false
  },
  invoiceLink: {
    type: String,
    default: ''
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