// routes/sales.js
const express = require("express");
const Sale = require("../models/Sale");

const router = express.Router();

// Helper: parse YYYY-MM-DD to UTC start/end
function getDayRange(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return { start, end };
}

// Create or update sale for a specific date
router.post("/", async (req, res) => {
  try {
    const { date, items = [] } = req.body;
    if (!date) return res.status(400).json({ message: "date is required (YYYY-MM-DD)" });
    if (!Array.isArray(items)) return res.status(400).json({ message: "items must be an array" });
    const { start } = getDayRange(date);

    // Always create a NEW sale document (no upsert/replace by date)
    const sale = new Sale({ date: start, items });
    await sale.save();
    res.status(201).json(sale);
  } catch (err) {
    console.error("POST /api/sales error:", err);
    const msg = err?.message || "Server error";
    res.status(500).json({ message: msg });
  }
});

// Get today summary and items
router.get("/today", async (req, res) => {
  try {
    const { start, end } = getDayRange();
    const sales = await Sale.find({ date: { $gte: start, $lt: end } }).sort({ createdAt: 1 });
    const combined = sales.reduce(
      (acc, s) => {
        acc.totalSalesAmount += s.totalSalesAmount;
        acc.totalProfit += s.totalProfit;
        acc.totalOrders += s.items.length;
        acc.items = acc.items.concat(s.items);
        return acc;
      },
      { date: start, items: [], totalSalesAmount: 0, totalProfit: 0, totalOrders: 0 }
    );
    return res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
});

// Get by date (YYYY-MM-DD)
router.get("/by-date", async (req, res) => {
  try {
    const { date } = req.query;
    const { start, end } = getDayRange(date);
    const sales = await Sale.find({ date: { $gte: start, $lt: end } }).sort({ createdAt: 1 });
    if (!sales.length) return res.status(404).json({ message: "No sale found for date" });
    const combined = sales.reduce(
      (acc, s) => {
        acc.totalSalesAmount += s.totalSalesAmount;
        acc.totalProfit += s.totalProfit;
        acc.items = acc.items.concat(s.items);
        return acc;
      },
      { date: start, items: [], totalSalesAmount: 0, totalProfit: 0 }
    );
    res.json(combined);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err?.message || "Server error" });
  }
});

// List all sales (optional - for debugging/UI)
router.get("/", async (_req, res) => {
  try {
    const sales = await Sale.find({}).sort({ date: -1 });
    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update by id
router.put("/:id", async (req, res) => {
  try {
    const { items, date } = req.body;
    const updated = await Sale.findOneAndUpdate(
      { _id: req.params.id },
      { items, date },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Sale not found" });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Monthly aggregation: year, month (1-12)
router.get("/monthly", async (req, res) => {
  try {
    const now = new Date();
    const year = Number(req.query.year || now.getUTCFullYear());
    const monthReq = req.query.month ? Number(req.query.month) : now.getUTCMonth() + 1; // 1-12
    const month = monthReq - 1; // 0-11

    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month + 1, 1));

    const sales = await Sale.find({ date: { $gte: start, $lt: end } }).sort({ date: 1, createdAt: 1 });

    const totalMonthlySales = sales.reduce((s, d) => s + d.totalSalesAmount, 0);
    const totalMonthlyProfit = sales.reduce((s, d) => s + d.totalProfit, 0);

    // Aggregate day-wise (sum across multiple docs per day)
    const dayMap = new Map(); // key = time number for day start, value = {totalSalesAmount, totalProfit}
    for (const s of sales) {
      const key = s.date.getTime();
      const cur = dayMap.get(key) || { totalSalesAmount: 0, totalProfit: 0 };
      cur.totalSalesAmount += s.totalSalesAmount;
      cur.totalProfit += s.totalProfit;
      dayMap.set(key, cur);
    }

    const daysInMonth = Math.floor((end - start) / (24 * 60 * 60 * 1000));
    const series = Array.from({ length: daysInMonth }).map((_, i) => {
      const dayDate = new Date(Date.UTC(year, month, i + 1));
      const key = dayDate.getTime();
      const agg = dayMap.get(key) || { totalSalesAmount: 0, totalProfit: 0 };
      return { date: dayDate, totalSalesAmount: agg.totalSalesAmount, totalProfit: agg.totalProfit };
    });

    const avgDailySales = daysInMonth > 0 ? totalMonthlySales / daysInMonth : 0;

    res.json({
      month: month + 1,
      year,
      totalMonthlySales,
      totalMonthlyProfit,
      avgDailySales,
      series,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;


