const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const { validateStrongPassword } = require('./utils/security');
require('dotenv').config();

async function createAdmin() {
  try {
    const connectionString = process.env.MONGODB_URI;
    const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD;

    if (!connectionString) throw new Error('MONGODB_URI is required');
    if (!email || !password) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');

    const passwordError = validateStrongPassword(password);
    if (passwordError) throw new Error(passwordError);

    await mongoose.connect(connectionString);

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      return;
    }

    const admin = new Admin({
      firstName: process.env.ADMIN_FIRST_NAME || 'Admin',
      lastName: process.env.ADMIN_LAST_NAME || 'User',
      email,
      phone: process.env.ADMIN_PHONE || '',
      password,
      isAdmin: true,
      isActive: true,
    });

    await admin.save();
    console.log('Admin created successfully:', admin.email);
  } catch (error) {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

createAdmin();
