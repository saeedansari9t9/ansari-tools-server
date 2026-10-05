const crypto = require('crypto');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { validateStrongPassword } = require('../utils/security');
require('dotenv').config();

function generateTemporaryPassword() {
  let password;
  do {
    password = `${crypto.randomBytes(24).toString('base64url')}aA1!`;
  } while (validateStrongPassword(password));
  return password;
}

async function resetAdminPassword() {
  const email = process.argv[2]?.toLowerCase().trim();
  const connectionString = process.env.MONGODB_URI;

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    throw new Error('Usage: npm run admin:reset-password -- owner@example.com');
  }
  if (!connectionString) throw new Error('MONGODB_URI is required');

  await mongoose.connect(connectionString);
  const admin = await Admin.findOne({ email }).select('+tokenVersion +failedLoginAttempts +lockUntil');
  if (!admin) throw new Error(`Admin not found: ${email}`);

  const temporaryPassword = generateTemporaryPassword();
  admin.password = temporaryPassword;
  admin.isActive = true;
  admin.failedLoginAttempts = 0;
  admin.lockUntil = null;
  await admin.save();

  console.log('Admin password reset and all previous admin sessions revoked.');
  console.log(`Admin: ${email}`);
  console.log(`One-time temporary password: ${temporaryPassword}`);
  console.log('Log in, change it immediately, then clear this terminal output.');
}

resetAdminPassword()
  .catch((error) => {
    console.error('Admin password reset failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
