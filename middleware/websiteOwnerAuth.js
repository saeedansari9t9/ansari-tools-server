module.exports = function websiteOwnerAuth(req, res, next) {
  const ownerEmails = (process.env.ADMIN_OWNER_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (ownerEmails.length === 0) {
    return res.status(503).json({
      message: 'Admin management is disabled until ADMIN_OWNER_EMAILS is configured',
    });
  }

  if (!ownerEmails.includes(req.admin.email.toLowerCase())) {
    return res.status(403).json({ message: 'Owner access required' });
  }

  return next();
};
