// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config()
const productRoutes = require("./routes/products");  // Import product routes
const canvaSubscriptionRoutes = require("./routes/canvaSubscriptions");  // Import canva subscription routes
const adminRoutes = require("./routes/admins");  // Import admin routes
const { connectDB } = require("./src/db");

const app = express();
// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://ansaritools.com', 'https://www.ansaritools.com', 'https://ansari-tools-client.vercel.app'] // Production URLs
    : ['http://localhost:3000', 'http://localhost:5173'], // Development URLs
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions)); // Enable CORS for cross-origin requests
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
connectDB()

// Use routes
app.use("/api/products", productRoutes);
app.use("/api/canva-subscriptions", canvaSubscriptionRoutes);
app.use("/api/admins", adminRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin API available at: http://localhost:${PORT}/api/admins`);
});
