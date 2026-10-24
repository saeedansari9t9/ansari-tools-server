const mongoose = require('mongoose');

mongoose.set('strictQuery', true);

// Global cache for serverless and long-running Node processes
if (!global.mongooseCache) {
  global.mongooseCache = { conn: null, promise: null };
}

let listenersAttached = false;

function setupEventListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err?.message || err);
    if (global.mongooseCache) {
      global.mongooseCache.conn = null;
      global.mongooseCache.promise = null;
    }
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection disconnected. Resetting cache...');
    if (global.mongooseCache) {
      global.mongooseCache.conn = null;
      global.mongooseCache.promise = null;
    }
  });
}

async function connectDB() {
  setupEventListeners();

  // 1. If already fully connected (readyState = 1), return immediately
  if (mongoose.connection.readyState === 1) {
    global.mongooseCache.conn = mongoose.connection;
    return mongoose.connection;
  }

  // 2. If currently connecting (readyState = 2), wait for the active promise or connection event
  if (mongoose.connection.readyState === 2 && global.mongooseCache.promise) {
    try {
      await global.mongooseCache.promise;
      if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
      }
    } catch (_) {
      // Promise failed; continue to reconnect below
    }
  }

  const connectionString = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!connectionString) {
    throw new Error('MONGODB_URI (or MONGO_URI) is required. Configure it in the deployment environment.');
  }

  // 3. Initiate new connection if no active promise
  if (!global.mongooseCache.promise || mongoose.connection.readyState === 0) {
    const opts = {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      heartbeatFrequencyMS: 10000, // Ping Atlas every 10s to keep sockets alive and prevent idle drop
      maxPoolSize: 10,
      minPoolSize: 2,              // Maintain at least 2 warm connections in pool
      retryWrites: true,
      w: 'majority',
      bufferCommands: true,        // Allow Mongoose to queue operations while reconnecting
    };

    global.mongooseCache.promise = mongoose.connect(connectionString, opts)
      .then((m) => {
        global.mongooseCache.conn = m.connection;
        return m.connection;
      })
      .catch((err) => {
        global.mongooseCache.promise = null;
        global.mongooseCache.conn = null;
        console.error('❌ MongoDB connect error:', err?.message || err);
        throw err;
      });
  }

  try {
    global.mongooseCache.conn = await global.mongooseCache.promise;
  } catch (error) {
    global.mongooseCache.promise = null;
    global.mongooseCache.conn = null;
    throw error;
  }

  return global.mongooseCache.conn;
}

module.exports = { connectDB };
