// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config()
const productRoutes = require("./routes/products");  // Import product routes
const canvaSubscriptionRoutes = require("./routes/canvaSubscriptions");  // Import canva subscription routes
const adminRoutes = require("./routes/admins");  // Import admin routes
const { connectDB } = require("./src/db");
const salesRoutes = require("./routes/sales");
const expensesRoutes = require("./routes/expenses");

const app = express();
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
connectDB()

// Use routes
app.use("/api/expenses", expensesRoutes);
app.use("/api/products", productRoutes);
app.use("/api/canva-subscriptions", canvaSubscriptionRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/sales", salesRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin API available at: http://localhost:${PORT}/api/admins`);
});
