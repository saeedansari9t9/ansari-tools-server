const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// POST /api/auth/signup - User registration
router.post('/signup', async (req, res) => {
  try {
    const { name, username, password } = req.body;

    // Validation
    if (!name || !username || !password) {
      return res.status(400).json({
        message: 'Please provide name, username, and password'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({
      username: username.toLowerCase()
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Username already exists'
      });
    }

    // Create new user (ROLE FORCE = user)
    const user = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      password,
      role: 'user'
    });

    const savedUser = await user.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: savedUser._id,
        username: savedUser.username,
        role: savedUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        username: savedUser.username,
        role: savedUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }

    return res.status(500).json({
      message: 'Server error during signup'
    });
  }
});

// POST /api/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        message: 'Please provide username and password'
      });
    }

    // Find user & include password
    const user = await User
      .findOne({ username: username.toLowerCase() })
      .select('+password');

    if (!user) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Server error during login'
    });
  }
});

module.exports = router;
