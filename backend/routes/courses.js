const express = require("express");
const { body, validationResult } = require("express-validator");
const Course = require("../models/Course");
const User = require("../models/User");
const {
  protect,
  authorize,
  isCourseInstructor,
} = require("../middleware/auth");

const router = express.Router();

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private (Teachers & Admins)
router.post(
  "/",
  protect,
  authorize("teacher", "admin"),
  [
    body("name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Course name must be between 2 and 100 characters"),
    body("code")
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage("Course code must be between 2 and 20 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description cannot exceed 1000 characters"),
    body("academicYear").notEmpty().withMessage("Academic year is required"),
    body("semester").notEmpty().withMessage("Semester is required"),
    body("schedule.days")
      .optional()
      .isArray()
      .withMessage("Schedule days must be an array"),
    body("schedule.startTime")
      .optional()
      .isString()
      .withMessage("Start time must be a string"),
    body("schedule.endTime")
      .optional()
      .isString()
      .withMessage("End time must be a string"),
    body("schedule.room")
      .optional()
      .isString()
      .withMessage("Room must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, code, description, academicYear, semester, schedule } =
        req.body;

      // Check if course code already exists
      const courseExists = await Course.findOne({
        code,
        academicYear,
        semester,
      });
      if (courseExists) {
        return res.status(400).json({
          error:
            "Course with this code already exists for this academic year and semester",
        });
      }

      // Create course
      const course = await Course.create({
        name,
        code: code.toUpperCase(),
        description,
        instructor: req.user._id,
        academicYear,
        semester,
        schedule,
      });

      // Enroll all active students
      const students = await User.find({ role: "student", isActive: true });
      course.students = students.map((student) => ({
        student: student._id,
        isActive: true,
      }));
      await course.save();

      // Populate instructor details
      await course.populate("instructor", "name email");

      res.status(201).json(course);
    } catch (error) {
      console.error("Create course error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/courses
// @desc    Get all courses (filtered by user role)
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    let courses;

    if (req.user.role === "student") {
      // Get courses where student is enrolled
      courses = await Course.find({
        "students.student": req.user._id,
        "students.isActive": true,
        isActive: true,
      }).populate("instructor", "name email");
    } else if (req.user.role === "teacher") {
      // Get courses where user is instructor
      courses = await Course.find({
        instructor: req.user._id,
        isActive: true,
      }).populate("instructor", "name email");
    } else {
      // Admin can see all courses
      courses = await Course.find({ isActive: true }).populate(
        "instructor",
        "name email"
      );
    }

    // Use course's totalClasses field instead of counting attendance records
    const coursesWithClasses = courses.map((course) => {
      return {
        ...course.toObject(),
        totalClasses: course.totalClasses || 0,
      };
    });
    res.json(coursesWithClasses);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/courses/:id
// @desc    Get course by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("instructor", "name email")
      .populate("students.student", "name email rollNo");

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Debug log for student access
    console.log(
      "[DEBUG] User:",
      req.user._id,
      "Role:",
      req.user.role,
      "Course:",
      req.params.id
    );
    if (req.user.role === "student") {
      const enrolledIds = course.students
        .filter((s) => s.student && s.student._id) // Filter out null students
        .map((s) => s.student._id.toString());
      console.log("[DEBUG] Enrolled student IDs:", enrolledIds);
      const isEnrolled = course.students.some(
        (student) =>
          student.student &&
          student.student._id &&
          student.student._id.toString() === req.user._id.toString() &&
          student.isActive
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }
    } else if (req.user.role === "teacher") {
      if (course.instructor._id.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this course" });
      }
    }
    // Use course's totalClasses field instead of counting attendance records
    const courseWithClasses = {
      ...course.toObject(),
      totalClasses: course.totalClasses || 0,
    };

    res.json(courseWithClasses);
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/courses/:id
// @desc    Update course
// @access  Private (Course Instructor or Admin)
router.put(
  "/:id",
  protect,
  authorize("teacher", "admin"),
  isCourseInstructor,
  [
    body("name")
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Course name must be between 2 and 100 characters"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description cannot exceed 500 characters"),
    body("schedule.days")
      .optional()
      .isArray()
      .withMessage("Schedule days must be an array"),
    body("schedule.startTime")
      .optional()
      .isString()
      .withMessage("Start time must be a string"),
    body("schedule.endTime")
      .optional()
      .isString()
      .withMessage("End time must be a string"),
    body("schedule.room")
      .optional()
      .isString()
      .withMessage("Room must be a string"),
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage("isActive must be a boolean"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, schedule, isActive } = req.body;

      // Update course
      const course = await Course.findByIdAndUpdate(
        req.params.id,
        { name, description, schedule, isActive },
        { new: true, runValidators: true }
      ).populate("instructor", "name email");

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      res.json(course);
    } catch (error) {
      console.error("Update course error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/courses/:id/enroll
// @desc    Enroll students in a course
// @access  Private (Course Instructor or Admin)
router.post(
  "/:id/enroll",
  protect,
  authorize("teacher", "admin"),
  isCourseInstructor,
  [
    body("rollNos").isArray().withMessage("Roll numbers must be an array"),
    body("rollNos.*").isString().withMessage("Invalid roll number format"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { rollNos } = req.body;
      const course = await Course.findById(req.params.id);

      // Verify all students exist and are students
      const students = await User.find({
        rollNo: { $in: rollNos },
        role: "student",
        isActive: true,
      });

      if (students.length !== rollNos.length) {
        return res
          .status(400)
          .json({ error: "Some roll numbers not found or invalid" });
      }

      // Add students to course
      for (const student of students) {
        const alreadyEnrolled = course.students.some(
          (s) => s.student.toString() === student._id.toString()
        );

        if (!alreadyEnrolled) {
          course.students.push({
            student: student._id,
            enrolledAt: new Date(),
            isActive: true,
          });
        }
      }

      await course.save();
      await course.populate("students.student", "name email");

      res.json(course);
    } catch (error) {
      console.error("Enroll students error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/courses/:id/enroll/:rollNo
// @desc    Remove student from course
// @access  Private (Course instructor only)
router.delete(
  "/:id/enroll/:rollNo",
  protect,
  isCourseInstructor,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Find student by roll number
      const student = await User.findOne({
        rollNo: req.params.rollNo,
        role: "student",
      });

      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Remove student from course
      course.students = course.students.filter(
        (s) => s.student.toString() !== student._id.toString()
      );

      await course.save();

      res.json({ message: "Student removed from course" });
    } catch (error) {
      console.error("Remove student error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   GET /api/courses/:id/students
// @desc    Get all students enrolled in a course
// @access  Private (Course Instructor or Admin)
router.get(
  "/:id/students",
  protect,
  authorize("teacher", "admin"),
  isCourseInstructor,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id).populate(
        "students.student",
        "name email rollNo"
      );

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const activeStudents = course.students.filter((s) => s.isActive);
      res.json(activeStudents);
    } catch (error) {
      console.error("Get course students error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// // @route   PUT /api/courses/:id/total-classes
// // @desc    Update course total classes count
// // @access  Private (Course Instructor or Admin)
// router.put(
//   "/:id/total-classes",
//   protect,
//   authorize("teacher", "admin"),
//   isCourseInstructor,
//   [
//     body("totalClasses")
//       .isInt({ min: 0 })
//       .withMessage("Total classes must be a non-negative integer"),
//   ],
//   async (req, res) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const { id } = req.params;
//       const { totalClasses } = req.body;

//       const course = await Course.findById(id);
//       if (!course) {
//         return res.status(404).json({ error: "Course not found" });
//       }

//       await course.setTotalClasses(totalClasses);

//       res.json({
//         message: "Course total classes updated successfully",
//         course: {
//           _id: course._id,
//           name: course.name,
//           code: course.code,
//           totalClasses: course.totalClasses,
//         },
//       });
//     } catch (error) {
//       console.error("Update course total classes error:", error);
//       res.status(500).json({ error: "Server error" });
//     }
//   }
// );

router.put(
  "/:id/total-classes",
  protect,
  authorize("teacher", "admin"),
  isCourseInstructor,
  [
    body("totalClasses")
      .isInt({ min: 0 })
      .withMessage("Total classes must be a non-negative integer"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { totalClasses } = req.body; // This is the new total (e.g., 17)

      const course = await Course.findById(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // 1. Update the course's total classes
      await course.setTotalClasses(totalClasses);

      // --- NEW EFFICIENT RECALCULATION ---
      const enrolledStudentIds = course.students
        .filter((s) => s.isActive)
        .map((s) => s.student);

      if (enrolledStudentIds.length > 0) {
        const courseKey = id.toString();

        // 2. Use a single updateMany command to update all students at once
        await User.updateMany(
          // Filter: Find all enrolled students who have an attendance record for this course
          {
            _id: { $in: enrolledStudentIds },
            [`courseAttendance.${courseKey}`]: { $exists: true },
          },
          // Update Pipeline: Perform calculations directly in the database
          [
            {
              $set: {
                // Set the totalClasses field in the student's record to the new value
                [`courseAttendance.${courseKey}.totalClasses`]: totalClasses,

                // Calculate and set the new presentCount
                [`courseAttendance.${courseKey}.presentCount`]: {
                  // Use $max to ensure the result is not negative (like Math.max)
                  $max: [
                    0,
                    {
                      // Use $subtract to calculate: newTotalClasses - existing_absentCount
                      $subtract: [
                        totalClasses,
                        `$courseAttendance.${courseKey}.absentCount`, // '$' references the field's existing value
                      ],
                    },
                  ],
                },
              },
            },
          ]
        );
      }
      // --- END OF EFFICIENT RECALCULATION ---

      // 3. Send the final success response
      res.json({
        message:
          "Course total classes updated and student attendance recalculated successfully",
        course: {
          _id: course._id,
          name: course.name,
          code: course.code,
          totalClasses: course.totalClasses,
        },
      });
    } catch (error) {
      console.error("Update course total classes error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   DELETE /api/courses/:id
// @desc    Delete a course (Admin only)
// @access  Private (Admin)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }
    // Remove all attendance records for this course
    await require("../models/Attendance").deleteMany({ course: course._id });
    await course.deleteOne();
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
