// models/Product.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  originalPrice: { type: String, required: true },
  duration: { type: String, required: true },
  badge: { type: String, required: true },
  rating: { type: Number, required: true },
  reviews: { type: Number, required: true },
  image: { type: String, required: true }, // Cloudinary URL
  hasVariants: { type: Boolean, default: false },
  variants: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    originalPrice: { type: String, required: true },
    priceNumber: { type: Number, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    features: [{ type: String }]
  }],
  features: [{ type: String }],
  specifications: [{
    label: { type: String, required: true },
    value: { type: String, required: true }
  }],
  category: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ProductSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Product", ProductSchema);
