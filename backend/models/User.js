const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: function () {
        return this.role === "teacher" || this.role === "admin";
      },
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: false, // Deprecated, handled by Firebase
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
    },
    rollNo: {
      type: String,
      required: function () {
        return this.role === "student";
      },
      unique: true,
      sparse: true,
      trim: true,
    },
    // Course-specific attendance tracking
    courseAttendance: {
      type: Map,
      of: {
        totalClasses: { type: Number, default: 0 },
        presentCount: { type: Number, default: 0 },
        absentCount: { type: Number, default: 0 },
        lateCount: { type: Number, default: 0 },
        excusedCount: { type: Number, default: 0 },
        attendanceRecords: [
          {
            date: { type: Date, required: true },
            status: {
              type: String,
              enum: ["present", "absent", "late", "excused"],
              required: true,
            },
          },
        ],
      },
      default: new Map(),
    },
    // Keep general absentDays for backward compatibility during transition
    absentDays: {
      type: Number,
      default: 0,
      min: [0, "Absent days cannot be negative"],
    },
    // New field for secure admin registration
    invitationToken: {
      type: String,
      required: function () {
        return this.role === "admin" || this.role === "teacher";
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    profilePicture: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Remove sensitive data when converting to JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.invitationToken;
  return user;
};

module.exports = mongoose.model("User", userSchema);
