// migrateSales.js
const mongoose = require('mongoose');
const Sale = require('./models/Sale'); // ✅ connects to your "sales" collection

// 🔧 Replace with your actual MongoDB database name if different
mongoose.connect('mongodb+srv://admin:admin@cluster0.fjybaeb.mongodb.net/ansari', {
  serverSelectionTimeoutMS: 5000,
});

(async () => {
  try {
    const oldSales = await Sale.find({
      $or: [
        { items: { $exists: true, $ne: [] } },
        { totalSalesAmount: { $exists: true } },
      ],
    });

    console.log(`Found ${oldSales.length} old sales to migrate...`);

    let migratedCount = 0;

    for (const sale of oldSales) {
      // 🧩 CASE 1: Old format with items array
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        for (const item of sale.items) {
          if (!item.productName) continue;
          await Sale.create({
            date: sale.date,
            productName: item.productName,
            sellingPrice: Number(item.sellingPrice) || 0,
            costPrice: Number(item.costPrice) || 0,
            profit:
              Number(item.profit) ||
              (Number(item.sellingPrice) - Number(item.costPrice)),
            createdAt: sale.createdAt,
            updatedAt: sale.updatedAt,
          });
          migratedCount++;
        }
      }

      // 🧩 CASE 2: Old format with totals but no array
      else if (sale.totalSalesAmount !== undefined) {
        await Sale.create({
          date: sale.date,
          productName: sale.productName || 'Unknown Product',
          sellingPrice: Number(sale.totalSalesAmount) || 0,
          costPrice:
            Number(sale.totalSalesAmount) - Number(sale.totalProfit) || 0,
          profit: Number(sale.totalProfit) || 0,
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt,
        });
        migratedCount++;
      }

      // 🗑 Delete old doc after migration
      await Sale.deleteOne({ _id: sale._id });
    }

    console.log(`✅ Migration complete! ${migratedCount} sales flattened.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
})();
