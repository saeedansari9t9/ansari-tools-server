const express = require('express');
const Admin = require('../models/Admin');
const websiteAdminAuth = require('../middleware/websiteAdminAuth');
const websiteOwnerAuth = require('../middleware/websiteOwnerAuth');
const { authWriteRateLimit, loginRateLimit } = require('../middleware/rateLimits');
const {
  adminCookieOptions,
  clearAdminCookieOptions,
  legacyAdminCookieOptions,
  signAdminToken,
  validateStrongPassword,
} = require('../utils/security');

const router = express.Router();
const MAX_FAILED_LOGINS = 5;
const ACCOUNT_LOCK_MS = 15 * 60 * 1000;

function publicAdmin(admin) {
  return {
    id: admin._id,
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone,
    isAdmin: true,
    lastLogin: admin.lastLogin,
  };
}

function isConfiguredOwner(admin) {
  return (process.env.ADMIN_OWNER_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .includes(admin.email.toLowerCase());
}

router.post('/login', loginRateLimit, async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password || email.length > 254 || password.length > 128) {
      return res.status(400).json({ message: 'Valid email and password are required' });
    }

    const admin = await Admin.findOne({ email }).select(
      '+password +tokenVersion +failedLoginAttempts +lockUntil'
    );

    if (admin?.lockUntil && admin.lockUntil > new Date()) {
      return res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
    }

    const passwordMatches = admin ? await admin.comparePassword(password) : false;
    if (!admin || !passwordMatches || !admin.isActive) {
      if (admin) {
        const attempts = (admin.failedLoginAttempts || 0) + 1;
        admin.failedLoginAttempts = attempts >= MAX_FAILED_LOGINS ? 0 : attempts;
        admin.lockUntil = attempts >= MAX_FAILED_LOGINS
          ? new Date(Date.now() + ACCOUNT_LOCK_MS)
          : null;
        await admin.save();
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    admin.failedLoginAttempts = 0;
    admin.lockUntil = null;
    admin.lastLogin = new Date();
    await admin.save();

    res.clearCookie('admin_token', legacyAdminCookieOptions());
    res.cookie('admin_token', signAdminToken(admin), adminCookieOptions());
    return res.json({
      message: 'Admin login successful',
      admin: publicAdmin(admin),
    });
  } catch (error) {
    console.error('Admin login failed');
    return res.status(500).json({ message: 'Server error during login' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('admin_token', clearAdminCookieOptions());
  res.clearCookie('admin_token', legacyAdminCookieOptions());
  return res.json({ message: 'Logged out successfully' });
});

router.get('/me', websiteAdminAuth, (req, res) => {
  return res.json({ ok: true, admin: publicAdmin(req.admin) });
});

router.get('/verify', websiteAdminAuth, (req, res) => {
  return res.json({ message: 'Token is valid', admin: publicAdmin(req.admin) });
});

async function changeOwnPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const passwordError = validateStrongPassword(newPassword);
    if (passwordError) return res.status(400).json({ message: passwordError });
    if (typeof currentPassword !== 'string' || currentPassword.length > 128) {
      return res.status(400).json({ message: 'Current password is required' });
    }

    const admin = await Admin.findById(req.admin._id).select('+password +tokenVersion');
    if (!admin || !(await admin.comparePassword(currentPassword))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (await admin.comparePassword(newPassword)) {
      return res.status(400).json({ message: 'New password must be different' });
    }

    admin.password = newPassword;
    await admin.save();
    res.clearCookie('admin_token', clearAdminCookieOptions());
    res.clearCookie('admin_token', legacyAdminCookieOptions());
    return res.json({ message: 'Password changed. Please log in again.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error changing password' });
  }
}

router.post('/change-password', authWriteRateLimit, websiteAdminAuth, changeOwnPassword);

// Backwards-compatible endpoint. An admin may only change their own password.
router.post('/:id/change-password', authWriteRateLimit, websiteAdminAuth, async (req, res) => {
  if (String(req.admin._id) !== req.params.id) {
    return res.status(403).json({ message: 'You can only change your own password' });
  }

  return changeOwnPassword(req, res);
});

router.get('/stats/overview', websiteAdminAuth, websiteOwnerAuth, async (req, res) => {
  try {
    const [total, active, inactive, recent] = await Promise.all([
      Admin.countDocuments(),
      Admin.countDocuments({ isActive: true }),
      Admin.countDocuments({ isActive: false }),
      Admin.countDocuments({ createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }),
    ]);
    return res.json({ total, active, inactive, recent });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching admin statistics' });
  }
});

router.get('/', websiteAdminAuth, websiteOwnerAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const query = {};

    if (typeof req.query.search === 'string' && req.query.search.trim()) {
      const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { firstName: { $regex: escaped, $options: 'i' } },
        { lastName: { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }

    const [admins, total] = await Promise.all([
      Admin.find(query).sort({ createdAt: -1 }).limit(limit).skip((page - 1) * limit),
      Admin.countDocuments(query),
    ]);

    return res.json({
      admins,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching admins' });
  }
});

router.post('/', authWriteRateLimit, websiteAdminAuth, websiteOwnerAuth, async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const passwordError = validateStrongPassword(req.body.password);
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (passwordError) return res.status(400).json({ message: passwordError });
    if (await Admin.exists({ email })) {
      return res.status(409).json({ message: 'An admin with this email already exists' });
    }

    const admin = await Admin.create({
      firstName: typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '',
      lastName: typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '',
      email,
      phone: typeof req.body.phone === 'string' ? req.body.phone.trim() : '',
      password: req.body.password,
      isAdmin: true,
      isActive: true,
      createdBy: req.admin._id,
    });

    return res.status(201).json({ message: 'Admin created successfully', admin: publicAdmin(admin) });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating admin' });
  }
});

router.get('/:id', websiteAdminAuth, async (req, res) => {
  const isSelf = String(req.admin._id) === req.params.id;
  if (!isSelf && !isConfiguredOwner(req.admin)) {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    return res.json(publicAdmin(admin));
  } catch (error) {
    return res.status(400).json({ message: 'Invalid admin id' });
  }
});

router.put('/:id', authWriteRateLimit, websiteAdminAuth, async (req, res) => {
  const isSelf = String(req.admin._id) === req.params.id;
  const isOwner = isConfiguredOwner(req.admin);
  if (!isSelf && !isOwner) return res.status(403).json({ message: 'Access denied' });
  if (!isOwner && (req.body.email !== undefined || req.body.isActive !== undefined)) {
    return res.status(403).json({ message: 'Only an owner can change email or account status' });
  }

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    if (typeof req.body.firstName === 'string') admin.firstName = req.body.firstName.trim();
    if (typeof req.body.lastName === 'string') admin.lastName = req.body.lastName.trim();
    if (typeof req.body.phone === 'string') admin.phone = req.body.phone.trim();
    if (isOwner && typeof req.body.email === 'string') admin.email = req.body.email.toLowerCase().trim();
    if (isOwner && typeof req.body.isActive === 'boolean') {
      if (isSelf && req.body.isActive === false) {
        return res.status(400).json({ message: 'You cannot deactivate your own account' });
      }
      admin.isActive = req.body.isActive;
      if (!admin.isActive) admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    }

    await admin.save();
    return res.json({ message: 'Admin updated successfully', admin: publicAdmin(admin) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: 'Email is already in use' });
    return res.status(500).json({ message: 'Error updating admin' });
  }
});

router.delete('/:id', authWriteRateLimit, websiteAdminAuth, websiteOwnerAuth, async (req, res) => {
  if (String(req.admin._id) === req.params.id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'Admin not found' });
    if (isConfiguredOwner(admin)) {
      return res.status(400).json({ message: 'Configured owner accounts cannot be deleted' });
    }
    await admin.deleteOne();
    return res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid admin id' });
  }
});

module.exports = router;
