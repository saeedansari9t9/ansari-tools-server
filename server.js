// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require('helmet');
const cookieParser = require("cookie-parser");
require("dotenv").config();
const path = require("path");

const productRoutes = require("./routes/products");
const canvaSubscriptionRoutes = require("./routes/canvaSubscriptions");
const adminRoutes = require("./routes/admins");
const authRoutes = require("./routes/auth");
const salesRoutes = require("./routes/sales");
const expensesRoutes = require("./routes/expenses");
const adminTools = require("./routes/adminTools");
const { connectDB } = require("./src/db");
const { validateRuntimeSecrets } = require('./utils/security');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ==========================
// 🔥 MIDDLEWARE ORDER MATTERS
// ==========================
app.use(helmet());
app.use(express.json({ limit: '1mb', strict: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ CORS (ONLY ONCE & BEFORE ROUTES)
const allowedOrigins = new Set([
  'https://ansaritools.com',
  'https://www.ansaritools.com',
  'https://dash.ansaritools.com',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean),
]);

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.add('http://localhost:3000');
  allowedOrigins.add('http://localhost:5173');
  allowedOrigins.add('http://localhost:5174');
  allowedOrigins.add('http://127.0.0.1:3000');
  allowedOrigins.add('http://127.0.0.1:5173');
  allowedOrigins.add('http://127.0.0.1:5174');
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));

// ==========================
// DB connection checker
// ==========================
const checkDBConnection = async (req, res, next) => {
  try {
    if (mongoose.connection?.readyState === 1) return next();

    console.log(`⚠️ DB connection readyState is ${mongoose.connection?.readyState}. Waiting for connection...`);
    await connectDB();

    if (mongoose.connection?.readyState === 1) return next();

    return res.status(503).json({
      message: "Database connection not ready",
      readyState: mongoose.connection?.readyState ?? "unknown",
    });
  } catch (err) {
    return res.status(503).json({ message: "Database unavailable" });
  }
};

const noStore = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};

// ==========================
// ROUTES
// ==========================
app.use("/api/auth", checkDBConnection, authRoutes);
app.use("/api/expenses", noStore, checkDBConnection, expensesRoutes);
app.use("/api/products", checkDBConnection, productRoutes);
app.use("/api/canva-subscriptions", noStore, checkDBConnection, canvaSubscriptionRoutes);
app.use("/api/admins", noStore, checkDBConnection, adminRoutes);
app.use("/api/sales", noStore, checkDBConnection, salesRoutes);

app.use("/api", checkDBConnection, require("./routes/tools"));
app.use("/api/user", checkDBConnection, require("./routes/userDashboard"));
app.use("/api/admin", checkDBConnection, adminTools);
app.use("/api", require("./routes/logout"));

app.use((err, _req, res, _next) => {
  if (err?.message === 'Origin not allowed') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large' });
  }
  console.error('Unhandled request error');
  return res.status(500).json({ message: 'Internal server error' });
});

// ==========================
// START SERVER
// ==========================
async function startServer() {
  try {
    validateRuntimeSecrets();
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

module.exports = app;
