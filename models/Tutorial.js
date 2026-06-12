const mongoose = require('mongoose');

const tutorialSchema = new mongoose.Schema({
  title: {
    type: String,
    default: 'Tutorials'
  },
  description: {
    type: String,
    default: "If you're not sure how to use a tool, simply click the button below to watch the tutorial video. It will guide you step-by-step so you can start using the tool correctly."
  },
  youtubeUrl: {
    type: String,
    default: 'https://www.youtube.com/'
  },
  tip: {
    type: String,
    default: "If you still face any issue after watching the tutorial, contact our support team and we'll help you."
  },
  extensionFileUrl: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tutorial', tutorialSchema);
