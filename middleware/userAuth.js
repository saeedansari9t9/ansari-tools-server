const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async function userAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user with sessionToken to validate single-session
    const user = await User.findById(decoded.userId).select("role username tokenVersion isLocked sessionToken");
    if (!user) {
      return res.status(401).json({ message: "User not found or deactivated" });
    }

    // Check tokenVersion (invalidates old tokens after password reset)
    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session expired, please log in again" });
    }

    // ✅ Check if account is locked (USER role only — admin is never locked)
    if (user.role !== 'admin' && user.isLocked) {
      return res.status(403).json({
        message: "Your account has been locked. Please contact the administrator.",
        code: "ACCOUNT_LOCKED"
      });
    }

    // ✅ Validate sessionToken — only for USER role (admin has no sessionToken restriction)
    if (user.role !== 'admin' && decoded.sessionToken && user.sessionToken && decoded.sessionToken !== user.sessionToken) {
      return res.status(401).json({
        message: "Your session is no longer valid. Please log in again.",
        code: "SESSION_INVALIDATED"
      });
    }

    req.user = {
      userId: user._id,
      username: user.username,
      role: user.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};