const router = require("express").Router();
const userAuth = require("../middleware/userAuth");
const UserTool = require("../models/UserTool");
const Admin = require("../models/Admin"); // optional, not needed
const User = require("../models/User");   // ✅ your users collection model
const adminAuth = require("../middleware/adminAuth"); // ✅ already exists
const Tutorial = require("../models/Tutorial");

// 🔹 current user info
router.get("/me", userAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("name username role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      userId: user._id,
      name: user.name,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
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

// 🔹 ADMIN: get all users (with lock status)
router.get("/", adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load users", error: err.message });
  }
});

// 🔹 ADMIN: unlock a user account (clears lock + clears sessionToken so they can login fresh)
router.post("/:id/unlock", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isLocked = false;
    user.lockReason = null;
    user.sessionToken = null; // Allow fresh login
    await user.save();

    return res.json({ message: `Account for @${user.username} has been unlocked successfully.` });
  } catch (err) {
    console.error("Unlock user error:", err);
    return res.status(500).json({ message: "Failed to unlock user", error: err.message });
  }
});

// 🔹 ADMIN: manually lock a user account
router.post("/:id/lock", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isLocked = true;
    user.lockReason = req.body.reason || "Manually locked by administrator.";
    user.sessionToken = null;
    await user.save();

    return res.json({ message: `Account for @${user.username} has been locked.` });
  } catch (err) {
    console.error("Lock user error:", err);
    return res.status(500).json({ message: "Failed to lock user", error: err.message });
  }
});

// 🔹 ADMIN: manually clear a user's session
router.post("/:id/clear-session", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.sessionToken = null;
    await user.save();

    return res.json({ message: `Session cleared for @${user.username}. They can now login again.` });
  } catch (err) {
    console.error("Clear session error:", err);
    return res.status(500).json({ message: "Failed to clear session", error: err.message });
  }
});


// 🔹 ADMIN: create new user
router.post("/", adminAuth, async (req, res) => {
  try {
    let { name, username, password, role = "user" } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password required" });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanName = (name && name.trim()) ? name.trim() : cleanUsername;

    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const newUser = new User({
      name: cleanName,
      username: cleanUsername,
      password,
      role: 'user'
    });

    const savedUser = await newUser.save();
    return res.status(201).json({ message: "User created successfully", user: savedUser });
  } catch (err) {
    console.error("Create user error:", err);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    return res.status(500).json({ message: "Failed to create user", error: err.message });
  }
});

// 🔹 ADMIN: delete user
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: "Failed to delete user", error: err.message });
  }
});

// 🔹 ADMIN: reset user password
router.post("/:id/reset-password", adminAuth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: "New password required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = password; // pre-save hook will hash this automatically!
    await user.save();

    return res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Failed to reset password", error: err.message });
  }
});

// 🔹 ADMIN: get user login logs (optionally filtered by userId)
router.get("/logs", adminAuth, async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = {};
    if (userId) {
      filter.user = userId;
    }

    const UserLog = require("../models/UserLog");
    const logs = await UserLog.find(filter)
      .populate("user", "name username role")
      .sort({ createdAt: -1 })
      .limit(1000); // Safety limit

    return res.json({ logs });
  } catch (err) {
    console.error("GET /user/logs error:", err);
    return res.status(500).json({ message: "Failed to load login logs", error: err.message });
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

// 🔹 GET tutorial content (Common: admin and user)
router.get("/tutorial", async (req, res) => {
  try {
    let tutorial = await Tutorial.findOne();
    if (!tutorial) {
      // Create default tutorial record if none exists
      tutorial = new Tutorial();
      await tutorial.save();
    }
    return res.json({ tutorial });
  } catch (err) {
    console.error("GET /user/tutorial error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 🔹 UPDATE tutorial content (Admin only)
router.put("/tutorial", adminAuth, async (req, res) => {
  try {
    const { title, description, youtubeUrl, tip, extensionFileUrl } = req.body;
    let tutorial = await Tutorial.findOne();
    if (!tutorial) {
      tutorial = new Tutorial();
    }
    if (title !== undefined) tutorial.title = title;
    if (description !== undefined) tutorial.description = description;
    if (youtubeUrl !== undefined) tutorial.youtubeUrl = youtubeUrl;
    if (tip !== undefined) tutorial.tip = tip;
    if (extensionFileUrl !== undefined) tutorial.extensionFileUrl = extensionFileUrl;

    await tutorial.save();
    return res.json({ message: "Tutorial updated successfully", tutorial });
  } catch (err) {
    console.error("PUT /user/tutorial error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// 🔹 change logged-in user's own password
router.post("/change-password", userAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    // Find the user, including the password field
    const user = await User.findById(req.user.userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    // Update to new password
    user.password = newPassword; // the pre-save hook will hash this automatically!
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    return res.status(500).json({ message: "Failed to change password", error: err.message });
  }
});

// 🔹 update logged-in user's own profile (name, username)
router.put("/update-profile", userAuth, async (req, res) => {
  try {
    const { name, username } = req.body;
    if (!name || !username) {
      return res.status(400).json({ message: "Name and username are required" });
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new username is already taken by another user
    const normUsername = username.toLowerCase().trim();
    if (normUsername !== user.username) {
      const existingUser = await User.findOne({ username: normUsername });
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }
      user.username = normUsername;
    }

    user.name = name.trim();
    await user.save();

    // Generate fresh JWT token
    const jwt = require("jsonwebtoken");
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
        tokenVersion: user.tokenVersion || 0
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Profile updated successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
});

module.exports = router;
