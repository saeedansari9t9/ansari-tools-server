const router = require("express").Router();
const userAuth = require("../middleware/userAuth");
const UserTool = require("../models/UserTool");

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
  

module.exports = router;
