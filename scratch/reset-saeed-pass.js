const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectionString = 'mongodb://admin:admin@ac-qdi0wnv-shard-00-00.fjybaeb.mongodb.net:27017,ac-qdi0wnv-shard-00-01.fjybaeb.mongodb.net:27017,ac-qdi0wnv-shard-00-02.fjybaeb.mongodb.net:27017/ansari?ssl=true&replicaSet=atlas-wfhdr2-shard-0&authSource=admin&retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
  name: String,
  username: { type: String, lowercase: true },
  password: { type: String, required: true },
  role: String
}, { collection: 'users' });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function run() {
  console.log('Connecting to database...');
  try {
    await mongoose.connect(connectionString, { serverSelectionTimeoutMS: 15000 });
    console.log('Connected!');

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('saeed123', salt);

    const result = await User.updateOne(
      { username: 'saeed' },
      { $set: { password: hashedPassword } }
    );

    console.log('Update result:', result);
    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

run();
