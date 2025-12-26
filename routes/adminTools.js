const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Tool = require("../models/Tool");
const UserTool = require("../models/UserTool");

const adminAuth = require("../middleware/adminAuth");

// ✅ GET active tools for dropdown (Admin UI)
router.get("/tools", adminAuth, async (req, res) => {
  try {
    const tools = await Tool.find({ active: true })
      .select("name slug image accessUrl active")
      .sort({ name: 1 });

    return res.json({ tools });
  } catch (err) {
    console.error("GET /admin/tools error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET a user's assigned tools (by username) (optional but useful for Admin UI)
router.get("/user-tools/:username", adminAuth, async (req, res) => {
  try {
    const username = (req.params.username || "").toLowerCase().trim();
    if (!username) return res.status(400).json({ message: "Username required" });

    const user = await User.findOne({ username }).select("_id username name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const rows = await UserTool.find({ user: user._id })
      .populate("tool", "name slug image accessUrl")
      .sort({ createdAt: -1 });

    const tools = rows.map((r) => ({
      id: r._id,
      status: r.status,
      expiresAt: r.expiresAt,
      tool: r.tool,
    }));

    return res.json({ user, tools });
  } catch (err) {
    console.error("GET /admin/user-tools/:username error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Assign tool to user (create OR update)
router.post("/assign-tool", adminAuth, async (req, res) => {
  try {
    const { username, toolSlug, expiresAt } = req.body;

    if (!username || !toolSlug || !expiresAt) {
      return res.status(400).json({ message: "username, toolSlug, expiresAt required" });
    }

    const u = username.toLowerCase().trim();
    const slug = toolSlug.toLowerCase().trim();

    // ✅ validate date
    const exp = new Date(expiresAt);
    if (Number.isNaN(exp.getTime())) {
      return res.status(400).json({ message: "Invalid expiresAt date" });
    }

    const user = await User.findOne({ username: u });
    if (!user) return res.status(404).json({ message: "User not found" });

    const tool = await Tool.findOne({ slug });
    if (!tool) return res.status(404).json({ message: "Tool not found" });

    // create/update
    const record = await UserTool.findOneAndUpdate(
      { user: user._id, tool: tool._id },
      { user: user._id, tool: tool._id, expiresAt: exp, status: "active" },
      { new: true, upsert: true }
    );

    return res.json({
      message: "Tool assigned successfully",
      username: user.username,
      tool: tool.name,
      toolSlug: tool.slug,
      expiresAt: record.expiresAt,
      recordId: record._id,
    });
  } catch (err) {
    console.error("POST /admin/assign-tool error:", err);

    // handle duplicate edge cases safely
    if (err.code === 11000) {
      return res.status(409).json({ message: "Already assigned (duplicate)" });
    }

    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ Unassign / remove tool from user (Admin UI)
router.delete("/unassign-tool", adminAuth, async (req, res) => {
  try {
    const { username, toolSlug } = req.body;

    if (!username || !toolSlug) {
      return res.status(400).json({ message: "username and toolSlug required" });
    }

    const u = username.toLowerCase().trim();
    const slug = toolSlug.toLowerCase().trim();

    const user = await User.findOne({ username: u });
    if (!user) return res.status(404).json({ message: "User not found" });

    const tool = await Tool.findOne({ slug });
    if (!tool) return res.status(404).json({ message: "Tool not found" });

    const deleted = await UserTool.findOneAndDelete({
      user: user._id,
      tool: tool._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    return res.json({
      message: "Tool unassigned successfully",
      username: user.username,
      tool: tool.name,
      toolSlug: tool.slug,
    });
  } catch (err) {
    console.error("DELETE /admin/unassign-tool error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ GET users with their assigned tools (for Admin UI table)
router.get("/users-with-tools", adminAuth, async (req, res) => {
  try {
    const users = await User.find({})
      .select("_id username name role createdAt")
      .sort({ createdAt: -1 });

    const now = new Date();

    const rows = await UserTool.find({})
      .populate("tool", "name slug image accessUrl")
      .populate("user", "username name")
      .sort({ createdAt: -1 });

    // group by userId
    const map = new Map();
    rows.forEach((r) => {
      const uid = String(r.user?._id || r.user);
      if (!uid) return;
      if (!map.has(uid)) map.set(uid, []);
      map.get(uid).push({
        id: r._id,
        status: r.status,
        expiresAt: r.expiresAt,
        isExpired: r.expiresAt ? new Date(r.expiresAt) <= now : false,
        tool: r.tool,
      });
    });

    const result = users.map((u) => {
      const assigned = map.get(String(u._id)) || [];
      const activeCount = assigned.filter(
        (a) => a.status === "active" && !a.isExpired
      ).length;

      return {
        _id: u._id,
        username: u.username,
        name: u.name,
        role: u.role,
        tools: assigned,
        summary: {
          total: assigned.length,
          active: activeCount,
          none: assigned.length === 0,
        },
      };
    });

    return res.json({ users: result });
  } catch (err) {
    console.error("GET /admin/users-with-tools error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
