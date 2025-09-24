// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

// Hash the password before saving to DB
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();  // If password not modified, continue
  this.password = await bcrypt.hash(this.password, 10);  // Hash the password
  next();
});

// Method to compare entered password with hashed password in DB
UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", UserSchema);
