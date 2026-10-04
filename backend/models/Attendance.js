const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course is required"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
    },
    records: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["present", "absent", "late", "excused"],
          default: "absent",
        },
        markedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        markedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          maxlength: [200, "Notes cannot exceed 200 characters"],
        },
      },
    ],
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    lockedAt: {
      type: Date,
    },
    totalStudents: {
      type: Number,
      default: 0,
    },
    presentCount: {
      type: Number,
      default: 0,
    },
    absentCount: {
      type: Number,
      default: 0,
    },
    lateCount: {
      type: Number,
      default: 0,
    },
    excusedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
attendanceSchema.index({ course: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

// Pre-save middleware to update counts
attendanceSchema.pre("save", function (next) {
  if (this.records && this.records.length > 0) {
    this.totalStudents = this.records.length;
    this.presentCount = this.records.filter(
      (r) => r.status === "present"
    ).length;
    this.absentCount = this.records.filter((r) => r.status === "absent").length;
    this.lateCount = this.records.filter((r) => r.status === "late").length;
    this.excusedCount = this.records.filter(
      (r) => r.status === "excused"
    ).length;
  }
  next();
});

// Static method to get attendance statistics
attendanceSchema.statics.getStats = async function (
  courseId,
  startDate,
  endDate
) {
  const stats = await this.aggregate([
    {
      $match: {
        course: new mongoose.Types.ObjectId(courseId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalClasses: { $sum: 1 },
        totalPresent: { $sum: "$presentCount" },
        totalAbsent: { $sum: "$absentCount" },
        totalLate: { $sum: "$lateCount" },
        totalExcused: { $sum: "$excusedCount" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalClasses: 0,
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalExcused: 0,
    }
  );
};

// Instance method to get student attendance for a specific date
attendanceSchema.methods.getStudentAttendance = function (studentId) {
  const record = this.records.find(
    (r) => r.student.toString() === studentId.toString()
  );
  return record ? record.status : null;
};

module.exports = mongoose.model("Attendance", attendanceSchema);
