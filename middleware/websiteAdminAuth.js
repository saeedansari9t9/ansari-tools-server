const Admin = require('../models/Admin');
const { verifyAdminToken } = require('../utils/security');

module.exports = async function websiteAdminAuth(req, res, next) {
  const token = req.cookies?.admin_token;
  if (!token) {
    return res.status(401).json({ message: 'Admin authentication required' });
  }

  try {
    const decoded = verifyAdminToken(token);
    if (decoded.type !== 'admin' || !decoded.adminId) {
      return res.status(401).json({ message: 'Invalid admin session' });
    }

    const admin = await Admin.findById(decoded.adminId).select('+tokenVersion');
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: 'Admin account is unavailable' });
    }
    if (decoded.tokenVersion !== (admin.tokenVersion || 0)) {
      return res.status(401).json({ message: 'Admin session has expired' });
    }

    req.admin = admin;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin session' });
  }
};
