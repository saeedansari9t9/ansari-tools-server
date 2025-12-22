// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const productRoutes = require("./routes/products");
const canvaSubscriptionRoutes = require("./routes/canvaSubscriptions");
const adminRoutes = require("./routes/admins");
const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/sales");
const expensesRoutes = require("./routes/expenses");
const adminTools = require("./routes/adminTools");
const { connectDB } = require("./src/db");

const app = express();

// ==========================
// 🔥 MIDDLEWARE ORDER MATTERS
// ==========================
app.use(express.json());
app.use(cookieParser());

// ✅ CORS (ONLY ONCE & BEFORE ROUTES)
app.use(
  cors({
    origin: [
      "https://ansaritools.com",
      "https://www.ansaritools.com",
      "https://dash.ansaritools.com",
      "https://api.ansaritools.com",
      "http://localhost:3000",
      "http://localhost:5173"
    ],
    credentials: true,
  })
);

// ==========================
// DB connection checker
// ==========================
const checkDBConnection = (req, res, next) => {
  try {
    if (mongoose.connection?.readyState === 1) return next();

    return res.status(503).json({
      message: "Database connection not ready",
      readyState: mongoose.connection?.readyState ?? "unknown",
    });
  } catch (err) {
    return res.status(503).json({ message: "Database error", error: err.message });
  }
};

// ==========================
// ROUTES
// ==========================
app.use("/api/auth", checkDBConnection, authRoutes);
app.use("/api/expenses", checkDBConnection, expensesRoutes);
app.use("/api/products", checkDBConnection, productRoutes);
app.use("/api/canva-subscriptions", checkDBConnection, canvaSubscriptionRoutes);
app.use("/api/admins", checkDBConnection, adminRoutes);
app.use("/api/sales", checkDBConnection, salesRoutes);

app.use("/api/user", checkDBConnection, require("./routes/userDashboard"));
app.use("/api/admin", checkDBConnection, adminTools);
app.use("/api", require("./routes/logout"));

// ==========================
// START SERVER
// ==========================
async function startServer() {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
