const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const adminAuth = async (req, res, next) => {
  try {
    // ✅ 1) Cookie se token (SSO)
    const cookieToken = req.cookies?.admin_token;

    // ✅ 2) Header se token (fallback / Postman)
    const headerToken = req.header("Authorization")?.replace("Bearer ", "");

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || !admin.isActive) {
      return res.status(401).json({ message: "Admin not found or deactivated" });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = adminAuth;
