const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminAuth = require('../middleware/adminAuth');

// POST admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if admin exists (include password field)
    console.log('Looking for email:', email.toLowerCase());
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    console.log('Admin found:', admin ? admin.email : 'Not found');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({ message: 'Admin account is deactivated' });
    }

    // Verify password
    console.log('Admin found:', admin.email);
    console.log('Password provided:', password);
    console.log('Stored password hash:', admin.password);
    const isPasswordValid = await admin.comparePassword(password);
    console.log('Password valid:', isPasswordValid);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        adminId: admin._id, 
        email: admin.email,
        isAdmin: true 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' } // Token expires in 7 days (1 week)
    );

    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        isAdmin: admin.isAdmin,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// GET verify admin token
router.get('/verify', adminAuth, async (req, res) => {
  try {
    res.json({
      message: 'Token is valid',
      admin: {
        id: req.admin._id,
        firstName: req.admin.firstName,
        lastName: req.admin.lastName,
        email: req.admin.email,
        isAdmin: req.admin.isAdmin
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying token' });
  }
});

// GET all admins (protected)
router.get('/', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    // Search by name or email if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const admins = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Admin.countDocuments(query);

    res.json({
      admins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admins', error: error.message });
  }
});

// GET single admin (protected)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin', error: error.message });
  }
});

// POST create new admin (protected)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, isAdmin = true } = req.body;

    // Only check if email already exists (essential check)
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'An admin with this email already exists' 
      });
    }

    // Create admin without server-side validation (client-side handles validation)
    const admin = new Admin({
      firstName: firstName?.trim() || '',
      lastName: lastName?.trim() || '',
      email: email?.toLowerCase().trim() || '',
      phone: phone?.trim() || '',
      password: password || '',
      isAdmin
    });

    const savedAdmin = await admin.save();
    
    // Remove password from response
    const adminResponse = savedAdmin.toJSON();
    
    res.status(201).json({
      message: 'Admin created successfully',
      admin: adminResponse
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error creating admin', error: error.message });
  }
});

// PUT update admin (protected)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, isActive } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if email already exists (excluding current admin)
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: req.params.id }
      });

      if (existingAdmin) {
        return res.status(400).json({ 
          message: 'An admin with this email already exists' 
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error updating admin', error: error.message });
  }
});

// DELETE admin (protected)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting admin', error: error.message });
  }
});

// POST change password (protected)
router.post('/:id/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: 'Validation error', errors });
    }
    res.status(500).json({ message: 'Error changing password', error: error.message });
  }
});

// GET admin statistics (protected)
router.get('/stats/overview', adminAuth, async (req, res) => {
  try {
    const total = await Admin.countDocuments();
    const active = await Admin.countDocuments({ isActive: true });
    const inactive = await Admin.countDocuments({ isActive: false });
    
    // Recent admins (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = await Admin.countDocuments({ 
      createdAt: { $gte: thirtyDaysAgo } 
    });

    res.json({
      total,
      active,
      inactive,
      recent
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin statistics', error: error.message });
  }
});

module.exports = router;
