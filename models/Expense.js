const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // e.g. "Dinner with friends"
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    note: { type: String },
    category: { type: String, required: true }, 
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", ExpenseSchema);
