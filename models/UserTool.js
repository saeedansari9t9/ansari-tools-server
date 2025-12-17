const mongoose = require("mongoose");

const userToolSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tool: { type: mongoose.Schema.Types.ObjectId, ref: "Tool", required: true },
    expiresAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["active", "expired"],
      default: "active"
    }
  },
  { timestamps: true }
);

userToolSchema.index({ user: 1, tool: 1 }, { unique: true });

module.exports = mongoose.model("UserTool", userToolSchema);
