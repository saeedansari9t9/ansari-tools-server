// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config()
const productRoutes = require("./routes/products");  // Import product routes
const canvaSubscriptionRoutes = require("./routes/canvaSubscriptions");  // Import canva subscription routes
const adminRoutes = require("./routes/admins");  // Import admin routes
const authRoutes = require("./routes/auth");  // Import auth routes
const { connectDB } = require("./src/db");
const salesRoutes = require("./routes/sales");
const expensesRoutes = require("./routes/expenses");

const app = express();
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // For parsing application/json

// Middleware to check MongoDB connection for API routes only
const checkDBConnection = (req, res, next) => {
  try {
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      return next();
    }
    return res.status(503).json({ 
      message: 'Database connection not ready. Please try again in a moment.',
      error: 'Service temporarily unavailable',
      readyState: mongoose.connection ? mongoose.connection.readyState : 'unknown'
    });
  } catch (err) {
    return res.status(503).json({ 
      message: 'Database connection error.',
      error: err.message
    });
  }
};

// Use routes with DB connection check
app.use("/api/auth", checkDBConnection, authRoutes);  // Auth routes (signup/login)
app.use("/api/expenses", checkDBConnection, expensesRoutes);
app.use("/api/products", checkDBConnection, productRoutes);
app.use("/api/canva-subscriptions", checkDBConnection, canvaSubscriptionRoutes);
app.use("/api/admins", checkDBConnection, adminRoutes);
app.use("/api/sales", checkDBConnection, salesRoutes);

// Connect to MongoDB before starting server
async function startServer() {
  try {
    await connectDB();

    // Start the server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Admin API available at: http://localhost:${PORT}/api/admins`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
