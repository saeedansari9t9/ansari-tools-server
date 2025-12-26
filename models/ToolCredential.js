// models/ToolCredential.js
const mongoose = require('mongoose');

const toolCredentialSchema = new mongoose.Schema({
  toolName: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ToolCredential', toolCredentialSchema);