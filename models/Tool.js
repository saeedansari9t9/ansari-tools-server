const mongoose = require("mongoose");

const toolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    accessUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    cookies: { type: String, default: "" }, // Stores the JSON array of cookies
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tool", toolSchema);
