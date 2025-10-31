// models/Sale.js
const mongoose = require("mongoose");

const SaleItemSchema = new mongoose.Schema(
  {
    productName: { type: String, required: true, trim: true },
    sellingPrice: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: false, default: 0 },
  },
  { _id: false }
);

const SaleSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    items: { type: [SaleItemSchema], default: [] },
    totalSalesAmount: { type: Number, required: true, default: 0 },
    totalProfit: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Normalize and compute totals before save/update
function computeTotals(doc) {
  if (!doc.items) doc.items = [];
  // Ensure per-item profit reflects single unit (no quantity)
  doc.items = doc.items.map((it) => {
    const sellingPrice = Number(it.sellingPrice || 0);
    const costPrice = Number(it.costPrice || 0);
    const profit = sellingPrice - costPrice;
    return { ...it.toObject?.() ?? it, sellingPrice, costPrice, profit };
  });

  const totals = doc.items.reduce(
    (acc, it) => {
      acc.totalSalesAmount += it.sellingPrice;
      acc.totalProfit += it.profit;
      return acc;
    },
    { totalSalesAmount: 0, totalProfit: 0 }
  );

  doc.totalSalesAmount = totals.totalSalesAmount;
  doc.totalProfit = totals.totalProfit;

  // Normalize date to start of day (UTC) for consistent queries
  if (doc.date) {
    const d = new Date(doc.date);
    doc.date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
}

SaleSchema.pre("save", function (next) {
  computeTotals(this);
  next();
});

SaleSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  // When updating with $set, work on that object
  const working = update.$set ? update.$set : update;
  if (working.items || working.date) {
    const tempDoc = { ...working };
    if (!tempDoc.items && this._update.$push) {
      tempDoc.items = []; // minimal safety
    }
    computeTotals(tempDoc);
    if (update.$set) {
      update.$set.totalSalesAmount = tempDoc.totalSalesAmount;
      update.$set.totalProfit = tempDoc.totalProfit;
      update.$set.date = tempDoc.date;
    } else {
      update.totalSalesAmount = tempDoc.totalSalesAmount;
      update.totalProfit = tempDoc.totalProfit;
      update.date = tempDoc.date;
    }
    this.setUpdate(update);
  }
  next();
});

module.exports = mongoose.model("Sale", SaleSchema);


