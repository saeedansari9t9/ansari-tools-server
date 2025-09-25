const mongoose = require('mongoose');

const canvaSubscriptionSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  duration: {
    type: String,
    required: true,
    enum: ['6 Months', '1 Year'],
    default: '6 Months'
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'inactive', 'expired'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for better query performance
canvaSubscriptionSchema.index({ email: 1 });
canvaSubscriptionSchema.index({ status: 1 });
canvaSubscriptionSchema.index({ date: -1 });

module.exports = mongoose.model('CanvaSubscription', canvaSubscriptionSchema);
