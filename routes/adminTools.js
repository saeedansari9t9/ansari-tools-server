const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Tool = require("../models/Tool");
const UserTool = require("../models/UserTool");

const adminAuth = require("../middleware/adminAuth");
const Tutorial = require("../models/Tutorial");

// ✅ GET tools (Admin UI)
router.get("/tools", adminAuth, async (req, res) => {
  try {
    // If specific query, return only active tools, otherwise return all
    const filter = req.query.activeOnly === "true" ? { active: true } : {};
    const tools = await Tool.find(filter)
      .select("name slug image accessUrl active description cookies")
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

// ✅ CREATE tool
router.post("/tools", adminAuth, async (req, res) => {
  try {
    const { name, description, slug, image, accessUrl, cookies, active } = req.body;
    if (!name) return res.status(400).json({ message: "Tool name is required" });

    const toolSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const tool = new Tool({
      name,
      description: description || "",
      slug: toolSlug,
      image: image || "",
      accessUrl: accessUrl || "",
      cookies: cookies || "",
      active: active !== undefined ? active : true,
    });

    await tool.save();
    return res.status(201).json({ message: "Tool created successfully", tool });
  } catch (err) {
    console.error("POST /admin/tools error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Tool with this slug or name already exists" });
    }
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ UPDATE tool
router.put("/tools/:id", adminAuth, async (req, res) => {
  try {
    const { name, description, slug, image, accessUrl, cookies, active } = req.body;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (slug !== undefined) updateData.slug = slug;
    if (image !== undefined) updateData.image = image;
    if (accessUrl !== undefined) updateData.accessUrl = accessUrl;
    if (cookies !== undefined) updateData.cookies = cookies;
    if (active !== undefined) updateData.active = active;

    const tool = await Tool.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    if (!tool) return res.status(404).json({ message: "Tool not found" });

    return res.json({ message: "Tool updated successfully", tool });
  } catch (err) {
    console.error("PUT /admin/tools/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE tool
router.delete("/tools/:id", adminAuth, async (req, res) => {
  try {
    const tool = await Tool.findByIdAndDelete(req.params.id);
    if (!tool) return res.status(404).json({ message: "Tool not found" });
    return res.json({ message: "Tool deleted successfully" });
  } catch (err) {
    console.error("DELETE /admin/tools/:id error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage engine configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `extension-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage: storage,
});

// ✅ POST upload extension file
router.post("/upload-extension", adminAuth, (req, res) => {
  upload.single("extensionFile")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please select a file to upload" });
    }

    try {
      // Find the tutorial configuration (singleton)
      let tutorial = await Tutorial.findOne();
      if (!tutorial) {
        tutorial = new Tutorial();
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      tutorial.extensionFileUrl = fileUrl;
      await tutorial.save();

      return res.json({
        message: "Extension file uploaded successfully!",
        fileUrl,
      });
    } catch (dbErr) {
      console.error("Database update error:", dbErr);
      return res.status(500).json({ message: "File uploaded but failed to update database." });
    }
  });
});

module.exports = router;
