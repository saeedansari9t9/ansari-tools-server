// backend/src/db.js
const mongoose = require('mongoose') 

mongoose.set('strictQuery', true);

let cachedConnection = null;

async function connectDB() {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return mongoose.connection;
    }
    
    if (cachedConnection) {
      console.log('🔄 Awaiting existing MongoDB connection process...');
      await cachedConnection;
      return mongoose.connection;
    }
    
    const connectionString = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb+srv://admin:admin@cluster0.fjybaeb.mongodb.net/ansari?retryWrites=true&w=majority';
    
    console.log('🔄 Connecting to MongoDB...');
    
    cachedConnection = mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 30000, // 30 seconds timeout
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    });
    
    await cachedConnection;
    
    console.log('✅ MongoDB connected successfully');
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      cachedConnection = null; // Clear connection cache on disconnect
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });
    
    return mongoose.connection;
    
  } catch (err) {
    cachedConnection = null; // Clear connection cache on failure
    console.error('\n❌ MongoDB Connection Error:', err.message);
    
    if (err.message.includes('ETIMEOUT') || err.message.includes('ENOTFOUND')) {
      console.error('\n⚠️ Network/DNS Timeout Error!');
      console.error('Please check the following:');
      console.error('   1. ✅ Internet connection is working');
      console.error('   2. ✅ MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0 for all)');
      console.error('   3. ✅ MongoDB connection string in .env file is correct');
      console.error('   4. ✅ MongoDB Atlas cluster is running');
      console.error('\n💡 Tip: Create a .env file in backend/ folder with:');
      console.error('   MONGODB_URI=your_mongodb_connection_string\n');
    } else if (err.message.includes('authentication failed') || err.message.includes('bad auth')) {
      console.error('\n⚠️ Authentication Failed!');
      console.error('Please check your MongoDB username and password in the connection string.\n');
    } else {
      console.error('\n⚠️ Connection failed. Please verify your MongoDB connection string.\n');
    }
    
    throw err;
  }
}

module.exports = { connectDB } 