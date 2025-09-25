// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require('dotenv').config()
const userRoutes = require("./routes/users");  // Import user routes
const productRoutes = require("./routes/products");  // Import product routes
const canvaSubscriptionRoutes = require("./routes/canvaSubscriptions");  // Import canva subscription routes
const { connectDB } = require("./src/db");

const app = express();
app.use(cors()); // Enable CORS for cross-origin requests
app.use(express.json()); // For parsing application/json

// Connect to MongoDB
connectDB()

// Use routes
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/canva-subscriptions", canvaSubscriptionRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
