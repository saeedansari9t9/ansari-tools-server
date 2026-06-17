const mongoose = require('mongoose');

const connectionString = 'mongodb://admin:admin@ac-qdi0wnv-shard-00-00.fjybaeb.mongodb.net:27017,ac-qdi0wnv-shard-00-01.fjybaeb.mongodb.net:27017,ac-qdi0wnv-shard-00-02.fjybaeb.mongodb.net:27017/ansari?ssl=true&replicaSet=atlas-wfhdr2-shard-0&authSource=admin&retryWrites=true&w=majority';

// Inline User and Admin Schemas
const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, lowercase: true },
  role: String
}, { collection: 'users' });

const adminSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, lowercase: true },
  isAdmin: Boolean,
  isActive: Boolean
}, { collection: 'admins' });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function run() {
  console.log('Connecting to:', connectionString);
  try {
    await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected to MongoDB');
    
    const users = await User.find({});
    console.log(`\nFound ${users.length} users:`);
    users.forEach(u => {
      console.log(`- Username: ${u.username}, Name: ${u.name}, Role: ${u.role}`);
    });

    const admins = await Admin.find({});
    console.log(`\nFound ${admins.length} admins:`);
    admins.forEach(a => {
      console.log(`- Email: ${a.email}, Name: ${a.firstName} ${a.lastName}, Admin: ${a.isAdmin}, Active: ${a.isActive}`);
    });
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
