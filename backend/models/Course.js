const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
      maxlength: [100, "Course name cannot exceed 100 characters"],
    },
    code: {
      type: String,
      required: [true, "Course code is required"],
      trim: true,
      uppercase: true,
      maxlength: [20, "Course code cannot exceed 20 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Instructor is required"],
    },
    students: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    totalClasses: {
      type: Number,
      default: 0,
      min: [0, "Total classes cannot be negative"],
    },
    schedule: {
      days: [
        {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
      ],
      startTime: String,
      endTime: String,
      room: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    academicYear: {
      type: String,
      required: [true, "Academic year is required"],
    },
    semester: {
      type: String,
      required: [true, "Semester is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Add to courseSchema
courseSchema.virtual("attendancePercentage").get(function () {
  if (!this.totalClasses || this.totalClasses === 0) return 0;
  return (this.presentCount / this.totalClasses) * 100;
});

// Index for efficient queries
courseSchema.index({ code: 1, academicYear: 1, semester: 1 }, { unique: true });
courseSchema.index({ instructor: 1 });

// Virtual for student count
courseSchema.virtual("studentCount").get(function () {
  return Array.isArray(this.students)
    ? this.students.filter((student) => student.isActive).length
    : 0;
});

// Method to increment total classes
courseSchema.methods.incrementClasses = function () {
  this.totalClasses += 1;
  return this.save();
};

// Method to set total classes
courseSchema.methods.setTotalClasses = function (count) {
  this.totalClasses = Math.max(0, count);
  return this.save();
};

// Ensure virtuals are serialized
courseSchema.set("toJSON", { virtuals: true });
courseSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
