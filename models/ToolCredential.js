// models/ToolCredential.js
const mongoose = require('mongoose');
const { decryptSensitive, encryptSensitive } = require('../utils/fieldEncryption');

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
    required: true,
    select: false,
    set: encryptSensitive
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

toolCredentialSchema.methods.revealPassword = function revealPassword() {
  return decryptSensitive(this.password);
};

module.exports = mongoose.model('ToolCredential', toolCredentialSchema);
