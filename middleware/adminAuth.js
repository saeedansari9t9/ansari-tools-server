const Admin = require('../models/Admin');
const User = require('../models/User');
const { verifyAdminToken, verifyUserToken } = require('../utils/security');

// Dashboard administration accepts either a real website-admin cookie or a
// dashboard User whose current database role is "admin". Website-admin routes
// use websiteAdminAuth instead and never accept a dashboard bearer token.
module.exports = async function adminAuth(req, res, next) {
  try {
    const cookieToken = req.cookies?.admin_token;
    if (cookieToken) {
      try {
        const decoded = verifyAdminToken(cookieToken);
        const admin = await Admin.findById(decoded.adminId).select('+tokenVersion');
        if (
          decoded.type === 'admin' &&
          admin &&
          admin.isActive &&
          decoded.tokenVersion === (admin.tokenVersion || 0)
        ) {
          req.admin = admin;
          return next();
        }
      } catch (_) {
        // A stale website cookie must not block a valid dashboard bearer token.
      }
    }

    const authorization = req.get('authorization') || '';
    if (!authorization.startsWith('Bearer ')) {
      return res.status(403).json({ message: 'Dashboard admin access required' });
    }

    const decoded = verifyUserToken(authorization.slice(7));
    if (decoded.type !== 'user' || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid dashboard session' });
    }

    const user = await User.findById(decoded.userId).select('role username tokenVersion isLocked');
    if (
      !user ||
      user.isLocked ||
      user.role !== 'admin' ||
      decoded.tokenVersion !== (user.tokenVersion || 0)
    ) {
      return res.status(403).json({ message: 'Dashboard admin access required' });
    }

    req.admin = {
      _id: user._id,
      username: user.username,
      role: 'admin',
      source: 'dashboard-user',
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
};
