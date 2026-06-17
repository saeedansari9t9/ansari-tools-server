const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userAuth = require('../middleware/userAuth');

// POST /api/auth/signup - User registration
router.post('/signup', async (req, res) => {
  try {
    const { name, username, password } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ message: 'Please provide name, username, and password' });
    }

    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    const user = new User({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      password,
      role: 'user'
    });

    const savedUser = await user.save();

    const token = jwt.sign(
      { userId: savedUser._id, username: savedUser.username, role: savedUser.role, tokenVersion: savedUser.tokenVersion || 0 },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: savedUser._id, name: savedUser.name, username: savedUser.username, role: savedUser.role }
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    return res.status(500).json({ message: 'Server error during signup' });
  }
});

// POST /api/auth/login - User login (single session enforced)
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user with password + sessionToken
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('+password +sessionToken');

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // ✅ Verify password first (applies to ALL roles)
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // ✅ ADMIN role: skip session locking — admin can login from anywhere freely
    if (user.role === 'admin') {
      const token = jwt.sign(
        {
          userId: user._id,
          username: user.username,
          role: user.role,
          tokenVersion: user.tokenVersion || 0
          // No sessionToken for admin — no restriction
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      try {
        const UserLog = require('../models/UserLog');
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim() || req.ip || 'unknown';
        await new UserLog({ user: user._id, ip, userAgent: req.headers['user-agent'] || 'unknown' }).save();
      } catch (_) {}

      return res.json({
        message: 'Login successful',
        token,
        user: { id: user._id, name: user.name, username: user.username, role: user.role }
      });
    }

    // ✅ USER role only: Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({
        message: 'Your account has been locked due to login from multiple devices. Please contact the administrator to unlock your account.',
        code: 'ACCOUNT_LOCKED'
      });
    }


    // ✅ USER role only: Single-session check — if sessionToken already exists → LOCK account
    if (user.sessionToken) {
      user.isLocked = true;
      user.lockReason = 'Login attempted from a second device while a session was already active.';
      await user.save();

      // Log suspicious attempt
      try {
        const UserLog = require('../models/UserLog');
        const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim() || 'unknown';
        await new UserLog({ user: user._id, ip, userAgent: req.headers['user-agent'] || 'unknown' }).save();
      } catch (_) {}

      return res.status(403).json({
        message: 'Your account has been locked because a login was attempted from a second device. Please contact the administrator to unlock your account.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // ✅ USER role only: No existing session — generate a unique sessionToken
    const sessionToken = crypto.randomBytes(32).toString('hex');
    user.sessionToken = sessionToken;
    await user.save();

    // Generate JWT with sessionToken embedded
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        tokenVersion: user.tokenVersion || 0,
        sessionToken
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Save Login log
    try {
      const UserLog = require('../models/UserLog');
      const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim() || req.ip || 'unknown';
      await new UserLog({ user: user._id, ip, userAgent: req.headers['user-agent'] || 'unknown' }).save();
    } catch (logErr) {
      console.error('Failed to save login log:', logErr);
    }

    return res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/logout - Clear session token (user must be logged in)
router.post('/logout', userAuth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.userId, { sessionToken: null });
    return res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
