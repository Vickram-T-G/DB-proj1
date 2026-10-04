const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const AdminInvitation = require("../models/AdminInvitation");
const { auth } = require("../middleware/auth");
const { sendEmail } = require("../utils/email");

const router = express.Router();

// Register user
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      rollNo,
      invitationToken,
      firebaseUid,
    } = req.body;

    console.log("[DEBUG] Registration attempt:", {
      name,
      email,
      role,
      rollNo,
      invitationToken,
      firebaseUid,
    });

    // Password is required for JWT signup; Firebase signup uses firebaseUid instead
    if (!name) {
      console.log("[DEBUG] Missing name");
      return res.status(400).json({ error: "Name is required" });
    }
    if (!firebaseUid && !password) {
      console.log("[DEBUG] Missing password and firebaseUid");
      return res
        .status(400)
        .json({ error: "Password is required" });
    }

    const userQuery = {
      $or: [
        email ? { email: email.toLowerCase() } : null,
        rollNo ? { rollNo } : null,
        firebaseUid ? { firebaseUid } : null,
      ].filter(Boolean),
    };
    if (userQuery.$or.length === 0) {
      return res.status(400).json({ error: "Email or roll number is required" });
    }
    console.log("[DEBUG] User lookup query:", userQuery);
    const existingUser = await User.findOne(userQuery);
    console.log("[DEBUG] Existing user:", existingUser);

    if (existingUser) {
      const emailMatch =
        existingUser.email && existingUser.email === email?.toLowerCase();
      const rollMatch = rollNo && existingUser.rollNo === rollNo;
      const uidMatch =
        firebaseUid && existingUser.firebaseUid === firebaseUid;

      if (uidMatch) {
        const userResponse = existingUser.toObject();
        delete userResponse.password;
        delete userResponse.invitationToken;
        const token = jwt.sign(
          { userId: existingUser._id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        return res.status(200).json({
          message: "User already registered",
          token,
          ...userResponse,
        });
      }

      if (emailMatch && firebaseUid && !existingUser.firebaseUid) {
        existingUser.firebaseUid = firebaseUid;
        await existingUser.save();
        const userResponse = existingUser.toObject();
        delete userResponse.password;
        delete userResponse.invitationToken;
        const token = jwt.sign(
          { userId: existingUser._id },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
        );
        return res.status(200).json({
          message: "User linked to Firebase",
          token,
          ...userResponse,
        });
      }

      if (emailMatch || rollMatch) {
        return res.status(400).json({
          error: "User with this email or roll number already exists",
        });
      }
    }

    // Handle role-specific validation
    if (role === "student") {
      if (!rollNo) {
        console.log("[DEBUG] Missing rollNo for student");
        return res
          .status(400)
          .json({ error: "Roll number is required for students" });
      }
      // Students can register freely (no invitation needed)
    } else if (role === "teacher" || role === "admin") {
      // Teachers and admins require invitation token
      if (!invitationToken) {
        console.log("[DEBUG] Missing invitation token for teacher/admin");
        return res.status(400).json({
          error: "Invitation token is required for teacher/admin registration",
        });
      }

      if (!email) {
        console.log("[DEBUG] Missing email for teacher/admin");
        return res
          .status(400)
          .json({ error: "Email is required for teachers and admins" });
      }

      // Verify invitation token
      const invitation = await AdminInvitation.findOne({
        token: invitationToken,
        email: email.toLowerCase(),
        isUsed: false,
        expiresAt: { $gt: new Date() },
      });
      console.log("[DEBUG] Invitation found:", invitation);

      if (!invitation) {
        return res
          .status(400)
          .json({ error: "Invalid or expired invitation token" });
      }

      if (invitation.role !== role) {
        return res.status(400).json({
          error: `Invitation is for ${invitation.role} role, not ${role}`,
        });
      }
    } else {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Hash password only when provided (legacy JWT accounts)
    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Create user
    const userData = {
      name,
      role,
      invitationToken: role === "student" ? undefined : invitationToken,
    };

    if (hashedPassword) userData.password = hashedPassword;
    if (firebaseUid) userData.firebaseUid = firebaseUid;
    if (email) userData.email = email.toLowerCase();
    if (rollNo) userData.rollNo = rollNo;

    let user;
    try {
      user = new User(userData);
      await user.save();
      console.log("[DEBUG] User created:", user);
      // Auto-enroll new students in all courses
      if (role === "student") {
        const Course = require("../models/Course");
        const allCourses = await Course.find({});
        for (const course of allCourses) {
          const alreadyEnrolled = course.students.some(
            (s) => s.student.toString() === user._id.toString()
          );
          if (!alreadyEnrolled) {
            course.students.push({ student: user._id, isActive: true });
            await course.save();
            console.log(
              `[DEBUG] Enrolled student ${user._id} in course ${course._id}`
            );
          }
        }
      }
    } catch (err) {
      console.error("[DEBUG] User creation error:", err);
      return res
        .status(500)
        .json({ error: "User creation failed", details: err.message });
    }

    // Mark invitation as used if applicable
    if (invitationToken) {
      const updateResult = await AdminInvitation.findOneAndUpdate(
        { token: invitationToken },
        { isUsed: true }
      );
      console.log("[DEBUG] Invitation marked as used:", updateResult);
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.invitationToken;

    res.status(201).json({
      message: "User registered successfully",
      token,
      ...userResponse,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, rollNo, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (!email && !rollNo) {
      return res
        .status(400)
        .json({ error: "Email or Roll number is required" });
    }

    // Find user by email or rollNo
    const user = await User.findOne({
      $or: [{ email: email?.toLowerCase() }, { rollNo: rollNo }].filter(
        Boolean
      ),
    }).select("+password");

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.invitationToken;

    res.json({
      message: "Login successful",
      token,
      ...userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get current user
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.invitationToken;

    res.json(userResponse);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Create admin invitation (admin only)
router.post("/invite", auth, async (req, res) => {
  try {
    const { email, role = "admin" } = req.body;

    // Check if current user is admin
    const currentUser = await User.findById(req.user._id);
    if (currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can create invitations" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!["admin", "teacher"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    // Check if invitation already exists
    const existingInvitation = await AdminInvitation.findOne({
      email: email.toLowerCase(),
      isUsed: false,
    });

    if (existingInvitation) {
      return res
        .status(400)
        .json({ error: "Invitation already exists for this email" });
    }

    // Generate invitation token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation
    const invitation = new AdminInvitation({
      email: email.toLowerCase(),
      token,
      invitedBy: req.user._id,
      expiresAt,
      role,
    });

    await invitation.save();

    // Send invitation email
    const invitationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5174"
    }/register?token=${token}&role=${role}`;

    try {
      await sendEmail({
        to: email,
        subject: `Invitation to join as ${role}`,
        html: `
          <h2>You've been invited!</h2>
          <p>You have been invited to join the attendance system as a <b>${role}</b>.</p>
          <p><b>Invitation Token:</b> <code>${token}</code></p>
          <p>Click the link below to register:</p>
          <a href="${invitationUrl}" style="background: #58a6ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Accept Invitation
          </a>
          <p>Or use this link: <br><code>${invitationUrl}</code></p>
          <p>This invitation expires in 7 days.</p>
          <p>If you didn't expect this invitation, please ignore this email.</p>
        `,
      });
      console.log(
        `[DEBUG] Invitation email sent to ${email} with token: ${token}`
      );
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Continue anyway, admin can share the token manually
    }

    res.json({
      message: "Invitation created successfully",
      token,
      expiresAt,
    });
  } catch (error) {
    console.error("Create invitation error:", error);
    res.status(500).json({ error: "Failed to create invitation" });
  }
});

// Get invitations (admin only)
router.get("/invitations", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (currentUser.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admins can view invitations" });
    }

    const invitations = await AdminInvitation.find()
      .populate("invitedBy", "name email")
      .sort({ createdAt: -1 });

    res.json(invitations);
  } catch (error) {
    console.error("Get invitations error:", error);
    res.status(500).json({ error: "Failed to get invitations" });
  }
});

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, rollNo } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (email) updates.email = email.toLowerCase();
    if (rollNo) updates.rollNo = rollNo;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.invitationToken;

    res.json(userResponse);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      return res
        .status(400)
        .json({ error: `A user with this ${field} already exists.` });
    }
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// Change password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;
