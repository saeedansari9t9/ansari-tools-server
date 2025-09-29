const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ansari-tools');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@ansaritools.com' });
    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      process.exit(0);
    }

    // Create new admin
    const admin = new Admin({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@ansaritools.com',
      phone: '+1234567890',
      password: 'admin123',
      isAdmin: true,
      isActive: true
    });

    await admin.save();
    console.log('Admin created successfully:', admin.email);
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();
