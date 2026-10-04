const express = require("express");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;

    // Build query
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/users/students
// @desc    Get all students (for enrollment)
// @access  Private (Teachers & Admins)
router.get(
  "/students",
  protect,
  authorize("teacher", "admin"),
  async (req, res) => {
    try {
      const { search } = req.query;

      const query = { role: "student", isActive: true };
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { rollNo: { $regex: search, $options: "i" } },
        ];
      }

      const students = await User.find(query)
        .select("name email rollNo")
        .sort({ name: 1 })
        .limit(50);

      res.json(students);
    } catch (error) {
      console.error("Get students error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/users/report
// @desc    Download all users as CSV
// @access  Private (Admin)
const { Parser } = require("json2csv");
router.get("/report", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password -invitationToken -__v");
    const fields = [
      "_id",
      "name",
      "email",
      "role",
      "rollNo",
      "isActive",
      "lastLogin",
      "createdAt",
      "updatedAt",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(users.map((u) => u.toObject()));
    res.header("Content-Type", "text/csv");
    res.attachment("users_report.csv");
    res.send(csv);
  } catch (error) {
    console.error("CSV export error:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or self)
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user can access this profile
    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== req.params.id
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this profile" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user (Admin only)
// @access  Private (Admin)
router.put(
  "/:id",
  protect,
  authorize("admin"),
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("role")
      .optional()
      .isIn(["student", "teacher", "admin"])
      .withMessage("Invalid role"),
    body("rollNo")
      .optional()
      .isString()
      .withMessage("Roll number must be a string"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
    body("emailNotifications")
      .optional()
      .isBoolean()
      .withMessage("Email notifications must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, role, rollNo, isActive, emailNotifications } =
        req.body;

      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if email is already taken by another user
      if (email && email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      // Check if roll number is already taken by another user
      if (rollNo && rollNo !== user.rollNo) {
        const rollNoExists = await User.findOne({ rollNo });
        if (rollNoExists) {
          return res.status(400).json({ error: "Roll number already exists" });
        }
      }

      // Update fields
      if (name) user.name = name;
      if (email) user.email = email;
      if (role) user.role = role;
      if (rollNo !== undefined) user.rollNo = rollNo;
      if (isActive !== undefined) user.isActive = isActive;
      if (emailNotifications !== undefined)
        user.emailNotifications = emailNotifications;

      const updatedUser = await user.save();
      const userResponse = updatedUser.toJSON();

      res.json(userResponse);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private (Admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   POST /api/users/bulk-create
// @desc    Bulk create users (Admin only)
// @access  Private (Admin)
router.post(
  "/bulk-create",
  protect,
  authorize("admin"),
  [
    body("users").isArray().withMessage("Users must be an array"),
    body("users.*.name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Name must be between 2 and 50 characters"),
    body("users.*.email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please provide a valid email"),
    body("users.*.password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("users.*.role")
      .isIn(["student", "teacher"])
      .withMessage("Role must be student or teacher"),
    body("users.*.rollNo")
      .optional()
      .isString()
      .withMessage("Roll number must be a string"),
  ],
  async (req, res) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res.status(400).json({ errors: validationErrors.array() });
      }

      const { users } = req.body;
      const createdUsers = [];
      const bulkErrors = [];

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];

        try {
          // Check if user already exists
          const userExists = await User.findOne({ email: userData.email });
          if (userExists) {
            bulkErrors.push(`User ${i + 1}: Email already exists`);
            continue;
          }

          // Check if roll number already exists (for students)
          if (userData.role === "student" && userData.rollNo) {
            const studentExists = await User.findOne({
              rollNo: userData.rollNo,
            });
            if (studentExists) {
              bulkErrors.push(`User ${i + 1}: Roll number already exists`);
              continue;
            }
          }

          // Create user
          const user = await User.create({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            rollNo: userData.role === "student" ? userData.rollNo : undefined,
          });

          createdUsers.push(user.toJSON());
        } catch (error) {
          bulkErrors.push(`User ${i + 1}: ${error.message}`);
        }
      }

      res.status(201).json({
        created: createdUsers.length,
        users: createdUsers,
        errors: bulkErrors.length > 0 ? bulkErrors : undefined,
      });
    } catch (error) {
      console.error("Bulk create users error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
