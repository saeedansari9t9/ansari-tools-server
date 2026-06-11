const router = require("express").Router();
const userAuth = require("../middleware/userAuth");
const UserTool = require("../models/UserTool");
const Admin = require("../models/Admin"); // optional, not needed
const User = require("../models/User");   // ✅ your users collection model
const adminAuth = require("../middleware/adminAuth"); // ✅ already exists

// 🔹 current user info
router.get("/me", userAuth, async (req, res) => {
  res.json({
    userId: req.user.userId,
    username: req.user.username
  });
});

// 🔹 user's active tools
router.get("/my-tools", userAuth, async (req, res) => {
    const now = new Date();
  
    const rows = await UserTool.find({
      user: req.user.userId,
      status: "active",
      expiresAt: { $gt: now },
    }).populate("tool");
  
    const tools = rows.map((r) => ({
      id: r._id,
      name: r.tool.name,
      slug: r.tool.slug,
      image: r.tool.image,
      accessUrl: r.tool.accessUrl,
      expiresAt: r.expiresAt,
    }));
  
    res.json({ tools });
  });
  
// 🔹 ADMIN: get all users
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password") // agar password field hai
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load users", error: err.message });
  }
});

// 🔹 GET active tool cookies for subscribed user
router.get("/tools/:slug/cookies", userAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const now = new Date();

    // 1. Find the tool
    const tool = await require("../models/Tool").findOne({ slug: slug.toLowerCase().trim() });
    if (!tool) {
      return res.status(404).json({ message: "Tool not found" });
    }

    // 2. Check if user is assigned this tool and subscription is active
    const subscription = await UserTool.findOne({
      user: req.user.userId,
      tool: tool._id,
      status: "active",
      expiresAt: { $gt: now }
    });

    if (!subscription) {
      return res.status(403).json({ message: "You do not have an active subscription for this tool" });
    }

    // 3. Return the parsed cookies list
    let parsedCookies = [];
    if (tool.cookies) {
      try {
        parsedCookies = JSON.parse(tool.cookies);
      } catch (parseErr) {
        console.error("Error parsing tool cookies JSON:", parseErr);
        // Fallback: If it's a simple string, return it as string or wrap it
      }
    }

    return res.json({ cookies: parsedCookies });
  } catch (err) {
    console.error("GET /user/tools/:slug/cookies error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
