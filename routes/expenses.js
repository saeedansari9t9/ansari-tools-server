const express = require("express");
const Expense = require("../models/Expense");
const router = express.Router();

// ✅ Add new expense
router.post("/", async (req, res) => {
  try {
    const { title, amount, date, note, category } = req.body;
    if (!title || !amount || !date || !category) {
      return res.status(400).json({ message: "Title, amount and date are required" });
    }
    const expense = await Expense.create({
      title,
      amount,
      date,
      note,
      category,
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

// ✅ Get daily grouped expenses (for month or all time)
router.get("/grouped", async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month); // optional

    const match = {
      $expr: { $eq: [{ $year: "$date" }, year] },
    };
    if (month) {
      match.$expr = {
        $and: [
          { $eq: [{ $year: "$date" }, year] },
          { $eq: [{ $month: "$date" }, month] },
        ],
      };
    }

    const result = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            day: { $dayOfMonth: "$date" },
            month: { $month: "$date" },
            year: { $year: "$date" },
          },
          totalAmount: { $sum: "$amount" },
          expenses: { $push: "$$ROOT" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
    ]);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/summary/monthly", async (req, res) => {
  try {
    const result = await Expense.aggregate([
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
    ]);
    res.json(result);
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
