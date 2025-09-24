// backend/src/db.js
const mongoose = require('mongoose') 

const uri = process.env.MONGODB_URI;

mongoose.set('strictQuery', true);

 async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI||'mongodb+srv://admin:admin@cluster0.fjybaeb.mongodb.net/ansari', {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
}

module.exports =  {connectDB} 