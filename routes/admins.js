const express = require("express");
const router = express.Router();

const Admin = require("../models/Admin");
const jwt = require("jsonwebtoken");
const adminAuth = require("../middleware/adminAuth");

// ==============================
// POST /api/admins/login
// ==============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select(
      "+password"
    );

    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (!admin.isActive) {
      return res.status(401).json({ message: "Admin account is deactivated" });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin._id,
        email: admin.email,
        isAdmin: true,
      },
      process.env.JWT_SECRET, // ✅ don't use fallback in production
      { expiresIn: "7d" }
    );

    // ✅ Set shared cookie across subdomains
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: true, // ✅ HTTPS only (Vercel)
      sameSite: "none", // ✅ allow subdomain sharing
      domain: ".ansaritools.com",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // ✅ Must return response
    return res.json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        phone: admin.phone,
        isAdmin: admin.isAdmin,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// ==============================
// GET /api/admins/me (optional helper for SSO)
// ==============================
router.get("/me", adminAuth, (req, res) => {
  return res.json({
    ok: true,
    admin: {
      id: req.admin._id,
      firstName: req.admin.firstName,
      lastName: req.admin.lastName,
      email: req.admin.email,
      isAdmin: req.admin.isAdmin,
    },
  });
});

// ==============================
// GET /api/admins/verify
// ==============================
router.get("/verify", adminAuth, (req, res) => {
  return res.json({
    message: "Token is valid",
    admin: {
      id: req.admin._id,
      firstName: req.admin.firstName,
      lastName: req.admin.lastName,
      email: req.admin.email,
      isAdmin: req.admin.isAdmin,
    },
  });
});

// ==============================
// GET /api/admins/stats/overview  ✅ must be before "/:id"
// ==============================
router.get("/stats/overview", adminAuth, async (req, res) => {
  try {
    const total = await Admin.countDocuments();
    const active = await Admin.countDocuments({ isActive: true });
    const inactive = await Admin.countDocuments({ isActive: false });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent = await Admin.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    return res.json({ total, active, inactive, recent });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching admin statistics",
      error: error.message,
    });
  }
});

// ==============================
// GET /api/admins  (list admins)
// ==============================
router.get("/", adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const admins = await Admin.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Admin.countDocuments(query);

    return res.json({
      admins,
      totalPages: Math.ceil(total / Number(limit)),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching admins", error: error.message });
  }
});

// ==============================
// GET /api/admins/:id
// ==============================
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    return res.json(admin);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching admin", error: error.message });
  }
});

// ==============================
// POST /api/admins  (create admin)
// ==============================
router.post("/", adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, isAdmin = true } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return res.status(400).json({ message: "An admin with this email already exists" });
    }

    const admin = new Admin({
      firstName: firstName?.trim() || "",
      lastName: lastName?.trim() || "",
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      password,
      isAdmin,
    });

    const savedAdmin = await admin.save();
    return res.status(201).json({ message: "Admin created successfully", admin: savedAdmin.toJSON() });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    return res.status(500).json({ message: "Error creating admin", error: error.message });
  }
});

// ==============================
// PUT /api/admins/:id
// ==============================
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, isActive } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    if (email && email.toLowerCase().trim() !== admin.email) {
      const existingAdmin = await Admin.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.params.id },
      });
      if (existingAdmin) {
        return res.status(400).json({ message: "An admin with this email already exists" });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName.trim();
    if (lastName) updateData.lastName = lastName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedAdmin = await Admin.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    return res.json({ message: "Admin updated successfully", admin: updatedAdmin });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ message: "Validation error", errors });
    }
    return res.status(500).json({ message: "Error updating admin", error: error.message });
  }
});

// ==============================
// DELETE /api/admins/:id
// ==============================
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });
    return res.json({ message: "Admin deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting admin", error: error.message });
  }
});

// ==============================
// POST /api/admins/:id/change-password
// ==============================
router.post("/:id/change-password", adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findById(req.params.id).select("+password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const ok = await admin.comparePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: "Current password is incorrect" });

    admin.password = newPassword;
    await admin.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Error changing password", error: error.message });
  }
});

/* ===========================
   🔓 ADMIN LOGOUT ROUTE
=========================== */
router.post("/logout", (req, res) => {
  res.clearCookie("admin_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    domain: ".ansaritools.com",
    path: "/",
  });

  return res.json({ message: "Logged out successfully" });
});

module.exports = router;
