const mongoose = require("mongoose");
const { decryptSensitive, encryptSensitive } = require('../utils/fieldEncryption');

const toolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, default: "" },
    accessUrl: { type: String, default: "" },
    description: { type: String, default: "" },
    cookies: { type: String, default: "", select: false, set: encryptSensitive },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

toolSchema.methods.revealCookies = function revealCookies() {
  return decryptSensitive(this.cookies || '');
};

module.exports = mongoose.model("Tool", toolSchema);
