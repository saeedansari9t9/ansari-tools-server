// routes/tools.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ToolCredential = require('../models/ToolCredential'); // Naya model banayenge

// JWT verify middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

// POST /api/get-credentials
router.post('/get-credentials', authMiddleware, async (req, res) => {
  const { tool } = req.body;

  if (!tool) {
    return res.status(400).json({ msg: 'Tool name is required' });
  }

  try {
    const credential = await ToolCredential.findOne({ toolName: tool });

    if (!credential) {
      return res.status(404).json({ msg: 'Credentials not found for this tool' });
    }

    res.json({
      email: credential.email,
      password: credential.password // Abhi plain, baad mein encrypt kar lenge
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;