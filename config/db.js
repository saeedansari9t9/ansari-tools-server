const mongoose = require('mongoose');

async function connectDB() {
  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error('MONGODB_URI is required. Configure it in the deployment environment.');
  }

  await mongoose.connect(connectionString);
  console.log('MongoDB connected');
}

module.exports = connectDB;
