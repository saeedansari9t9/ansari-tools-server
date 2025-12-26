// const jwt = require("jsonwebtoken");
// const Admin = require("../models/Admin");

// const adminAuth = async (req, res, next) => {
//   try {
//     // ✅ 1) Cookie se token (SSO)
//     const cookieToken = req.cookies?.admin_token;

//     // ✅ 2) Header se token (fallback / Postman)
//     const headerToken = req.header("Authorization")?.replace("Bearer ", "");

//     const token = cookieToken || headerToken;

//     if (!token) {
//       return res.status(401).json({ message: "No token, authorization denied" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     // Check if admin exists and is active
//     const admin = await Admin.findById(decoded.adminId);
//     if (!admin || !admin.isActive) {
//       return res.status(401).json({ message: "Admin not found or deactivated" });
//     }

//     req.admin = admin;
//     next();
//   } catch (error) {
//     console.error("Admin auth error:", error);
//     return res.status(401).json({ message: "Token is not valid" });
//   }
// };

// module.exports = adminAuth;











//Temporary admin auth middleware

// ⚠️ TEMPORARY ADMIN AUTH (FOR TESTING ONLY)
// Allows access if:
// 1) Real admin logged in via admin panel (admin_token cookie)
// OR
// 2) User logged in via dashboard AND user.role === "admin"
//
// ❗ REMOVE user-role logic before production launch

const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    // ===============================
    // 1️⃣ ADMIN PANEL LOGIN (COOKIE)
    // ===============================
    const cookieToken = req.cookies?.admin_token;
    if (cookieToken) {
      const decoded = jwt.verify(cookieToken, process.env.JWT_SECRET);

      const admin = await Admin.findById(decoded.adminId);
      if (admin && admin.isActive) {
        req.admin = admin;
        return next(); // ✅ real admin
      }
    }

    // ==========================================
    // 2️⃣ DASHBOARD USER LOGIN (TEMPORARY ADMIN)
    // ==========================================
    const headerToken = req.header("Authorization")?.replace("Bearer ", "");
    if (headerToken) {
      const decoded = jwt.verify(headerToken, process.env.JWT_SECRET);

      // 🔒 IMPORTANT: role DB se verify
      const user = await User.findById(decoded.userId).select("role username");
      if (user && user.role === "admin") {
        req.admin = {
          _id: user._id,
          username: user.username,
          role: "admin",
          source: "user-role-temp", // 🔴 TEMP FLAG
        };
        return next(); // ✅ temporary admin
      }
    }

    return res.status(403).json({ message: "Admin access required" });
  } catch (error) {
    console.error("Admin auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = adminAuth;
