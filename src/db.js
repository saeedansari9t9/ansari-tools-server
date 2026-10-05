const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

let cachedConnection = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    await cachedConnection;
    return mongoose.connection;
  }

  const connectionString = process.env.MONGODB_URI;
  if (!connectionString) {
    throw new Error('MONGODB_URI is required. Configure it in the deployment environment.');
  }

  try {
    cachedConnection = mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority',
    });

    await cachedConnection;

    mongoose.connection.on('error', () => {
      console.error('MongoDB connection error');
    });
    mongoose.connection.on('disconnected', () => {
      cachedConnection = null;
    });

    console.log('MongoDB connected');
    return mongoose.connection;
  } catch (error) {
    cachedConnection = null;
    console.error('MongoDB connection failed');
    throw error;
  }
}

module.exports = { connectDB };
