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

    const user = await User.findById(decoded.userId).select("role username tokenVersion");
    if (!user) {
      return res.status(401).json({ message: "User not found or deactivated" });
    }

    if (decoded.tokenVersion === undefined || decoded.tokenVersion !== (user.tokenVersion || 0)) {
      return res.status(401).json({ message: "Session expired, please log in again" });
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
 