const express = require("express");
const Expense = require("../models/Expense");
const router = express.Router();

// ✅ Add new expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, date, note } = req.body;
    if (!title || !amount || !date) {
      return res.status(400).json({ message: "Title, amount and date are required" });
    }
    const expense = await Expense.create({
      title,
      amount,
      date,
      note,
    });
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get all expenses
router.get("/", async (_req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Get expenses by month
router.get("/monthly", async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year || now.getFullYear());
    const month = Number(req.query.month || now.getMonth() + 1) - 1;

    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1));

    const expenses = await Expense.find({
      date: { $gte: start, $lt: end },
    }).sort({ date: -1 });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      month: month + 1,
      year,
      total,
      expenses,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Delete expense
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Expense.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
