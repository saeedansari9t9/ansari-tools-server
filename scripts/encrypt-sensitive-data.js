const mongoose = require('mongoose');
const Tool = require('../models/Tool');
const ToolCredential = require('../models/ToolCredential');
const { getEncryptionKey, isEncrypted } = require('../utils/fieldEncryption');
require('dotenv').config();

async function encryptSensitiveData() {
  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) throw new Error('MONGODB_URI is required');
  getEncryptionKey();

  await mongoose.connect(connectionString);
  let cookieCount = 0;
  let credentialCount = 0;

  const tools = await Tool.find({ cookies: { $nin: [null, ''] } }).select('+cookies');
  for (const tool of tools) {
    if (!isEncrypted(tool.cookies)) {
      const plaintext = tool.cookies;
      tool.cookies = plaintext;
      tool.markModified('cookies');
      await tool.save();
      cookieCount += 1;
    }
  }

  const credentials = await ToolCredential.find({ password: { $nin: [null, ''] } }).select('+password');
  for (const credential of credentials) {
    if (!isEncrypted(credential.password)) {
      const plaintext = credential.password;
      credential.password = plaintext;
      credential.markModified('password');
      await credential.save();
      credentialCount += 1;
    }
  }

  console.log(`Encrypted ${cookieCount} tool cookie records and ${credentialCount} credential records.`);
}

encryptSensitiveData()
  .catch((error) => {
    console.error('Sensitive-data migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
