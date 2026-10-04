const express = require("express");
const { body, validationResult } = require("express-validator");
const Attendance = require("../models/Attendance");
const Course = require("../models/Course");
const {
  protect,
  authorize,
  isCourseInstructor,
  isEnrolledStudent,
} = require("../middleware/auth");
const mongoose = require("mongoose");
const User = require("../models/User"); // Added User model import
const { sendAttendanceFailureNotification } = require("../utils/email");

const router = express.Router();

// Helper function to migrate existing attendance data to course-specific format
const migrateAttendanceData = async (courseId) => {
  try {
    console.log(`[DEBUG] Migrating attendance data for course: ${courseId}`);

    // Get all attendance records for this course
    const attendanceRecords = await Attendance.find({ course: courseId });

    // Get all enrolled students
    const course = await Course.findById(courseId);
    if (!course) return;

    const enrolledStudents = course.students.filter((s) => s.isActive);

    for (const enrollment of enrolledStudents) {
      const student = await User.findById(enrollment.student);
      if (!student) continue;

      const courseKey = courseId.toString();
      let currentAttendance = student.courseAttendance.get(courseKey);

      if (!currentAttendance) {
        // Initialize course-specific attendance
        currentAttendance = {
          totalClasses: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          attendanceRecords: [],
        };
      }

      // Process all attendance records for this student in this course
      for (const attRecord of attendanceRecords) {
        const studentRecord = attRecord.records.find(
          (r) => r.student.toString() === student._id.toString()
        );

        if (studentRecord) {
          currentAttendance.totalClasses += 1;
          currentAttendance[`${studentRecord.status}Count`] += 1;

          // Add attendance record if not already present
          const existingRecord = currentAttendance.attendanceRecords.find(
            (r) => r.date.getTime() === attRecord.date.getTime()
          );

          if (!existingRecord) {
            currentAttendance.attendanceRecords.push({
              date: attRecord.date,
              status: studentRecord.status,
            });
          }
        }
      }

      // Update the course attendance
      student.courseAttendance.set(courseKey, currentAttendance);
      await student.save();

      console.log(
        `[DEBUG] Migrated attendance for student ${student.name} in course ${course.code}`
      );
    }
  } catch (error) {
    console.error(`[DEBUG] Migration error for course ${courseId}:`, error);
  }
};

// @route   POST /api/attendance/:courseId
// @desc    Mark attendance for a course on a specific date
// @access  Private (Course Instructor or Admin)
router.post(
  "/:courseId",
  protect,
  authorize("teacher", "admin"),
  // isCourseInstructor, //LIKELY a cause of a bug
  [
    body("date").isISO8601().withMessage("Date must be a valid ISO date"),
    body("records").isArray().withMessage("Records must be an array"),
    body("records.*.student").isMongoId().withMessage("Invalid student ID"),
    body("records.*.status")
      .isIn(["present", "absent", "late", "excused"])
      .withMessage("Invalid status"),
    body("records.*.notes")
      .optional()
      .isString()
      .withMessage("Notes must be a string"),
    // markedBy is filled by backend, not required in request
  ],
  async (req, res) => {
    try {
      console.log("[DEBUG] POST /api/attendance/:courseId body:", req.body);
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log("[DEBUG] Validation errors:", errors.array());
        return res.status(400).json({
          error: "Validation failed",
          details: errors.array(),
        });
      }

      const { courseId } = req.params;
      const { date, records } = req.body;

      // Validate date format
      const attendanceDate = new Date(date);
      if (isNaN(attendanceDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      // Check if attendance already exists for this date
      let attendance = await Attendance.findOne({
        course: courseId,
        date: attendanceDate,
      });

      if (attendance) {
        return res
          .status(400)
          .json({ error: "Attendance already marked for this date" });
      }

      // Validate that all students are enrolled in the course
      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      const enrolledStudentIds = course.students
        .filter((s) => s.isActive)
        .map((s) => s.student.toString());

      const recordStudentIds = records.map((r) => r.student.toString());
      const invalidStudents = recordStudentIds.filter(
        (id) => !enrolledStudentIds.includes(id)
      );

      if (invalidStudents.length > 0) {
        return res
          .status(400)
          .json({ error: "Some students are not enrolled in this course" });
      }

      // Create attendance records
      const attendanceRecords = records.map((record) => ({
        student: record.student,
        status: record.status,
        markedBy: req.user._id, // Always use the current user
        notes: record.notes || "",
      }));

      attendance = await Attendance.create({
        course: courseId,
        date: attendanceDate,
        records: attendanceRecords,
      });

      // Update each student's course-specific attendance tracking
      for (const record of attendanceRecords) {
        const student = await User.findById(record.student);
        if (student) {
          const courseKey = courseId.toString();
          const currentAttendance = student.courseAttendance.get(courseKey) || {
            totalClasses: 0,
            presentCount: 0,
            absentCount: 0,
            lateCount: 0,
            excusedCount: 0,
            attendanceRecords: [],
          };

          // Update counts
          currentAttendance.totalClasses += 1;
          currentAttendance[`${record.status}Count`] += 1;

          // Add attendance record
          currentAttendance.attendanceRecords.push({
            date: attendanceDate,
            status: record.status,
          });

          // Update the course attendance
          student.courseAttendance.set(courseKey, currentAttendance);
          await student.save();
        }
      }

      // Increment course total classes
      await course.incrementClasses();

      await attendance.populate([
        { path: "course", select: "name code" },
        { path: "records.student", select: "name email rollNo" },
        { path: "records.markedBy", select: "name" },
      ]);
      console.log("[DEBUG] Created attendance:", attendance);
      res.status(201).json(attendance);
    } catch (error) {
      console.error("Mark attendance error:", error);

      // Send failure notification to admins (except on weekends)
      const today = new Date();
      const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday or Saturday
        try {
          const course = await Course.findById(courseId);
          if (course) {
            await sendAttendanceFailureNotification(
              course.name,
              course.code,
              new Date().toISOString().split("T")[0],
              error.message
            );
          }
        } catch (emailError) {
          console.error(
            "Failed to send attendance failure notification:",
            emailError
          );
        }
      }

      res.status(500).json({ error: "Server error" });
    }
  }
);

// // @route   GET /api/attendance/:courseId/stats
// // @desc    Get attendance statistics for a course
// // @access  Private
// router.get("/:courseId/stats", protect, async (req, res) => {
//   console.log("ROUTE /stats courseId:", req.params.courseId);
//   console.log("=== /stats route reached ===", req.method, req.url);
//   try {
//     const { courseId } = req.params;
//     // Validate courseId
//     if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
//       console.log("[DEBUG] Invalid courseId:", courseId);
//       return res.status(400).json({
//         error: "Invalid course ID",
//         totalClasses: 0,
//         studentStats: null,
//       });
//     }
//     // Check if user has access to this course
//     const course = await Course.findById(courseId);
//     if (!course) {
//       console.log("[DEBUG] Course not found:", courseId);
//       return res.status(404).json({
//         error: "Course not found",
//         totalClasses: 0,
//         studentStats: null,
//       });
//     }
//     // Count total classes (attendance records) for this course
//     const totalClasses = course.totalClasses || 0;
//     let studentStats = null;

//     if (req.user.role === "student") {
//       // Get student's course-specific attendance data
//       const user = await User.findById(req.user._id);
//       const courseKey = courseId.toString();
//       let courseAttendance = user.courseAttendance.get(courseKey);

//       // If no course-specific data exists, try to migrate existing data
//       if (!courseAttendance) {
//         console.log(
//           `[DEBUG] No course-specific data found for student ${user.name} in course ${courseId}, attempting migration...`
//         );
//         await migrateAttendanceData(courseId);

//         // Refresh user data after migration
//         await user.refresh();
//         courseAttendance = user.courseAttendance.get(courseKey);
//       }

//       if (courseAttendance) {
//         const {
//           totalClasses,
//           presentCount,
//           absentCount,
//           lateCount,
//           excusedCount,
//         } = courseAttendance;

//         // Calculate attendance percentage
//         const safeDenominator = totalClasses || 1;
//         const attendancePercentage =
//           safeDenominator > 0
//             ? ((presentCount + lateCount) / safeDenominator) * 100
//             : 0;

//         // Leaves left: max number of classes that can be missed and still stay >= 75%
//         let leavesLeft = 0;
//         for (let extra = 0; extra < 1000; extra++) {
//           const percent =
//             ((presentCount + lateCount) / (safeDenominator + extra)) * 100;
//           if (percent < 75) break;
//           leavesLeft = extra;
//         }

//         // Classes required to reach 75% if below 75%
//         let classesTo75 = 0;
//         if (attendancePercentage < 75) {
//           let needed = 0;
//           while (true) {
//             const percent =
//               ((presentCount + lateCount + needed) /
//                 (safeDenominator + needed)) *
//               100;
//             if (percent >= 75) break;
//             needed++;
//             if (needed > 1000) break;
//           }
//           classesTo75 = needed;
//         }

//         // Warnings
//         let warning = null;
//         if (attendancePercentage < 75) {
//           warning = "Your attendance is below 75%!";
//         } else if (attendancePercentage < 80) {
//           warning = "Your attendance is below 80%. Be careful!";
//         }

//         studentStats = {
//           totalClasses,
//           presentCount,
//           absentCount,
//           lateCount,
//           excusedCount,
//           attendancePercentage,
//           leavesLeft,
//           classesTo75,
//           warning,
//         };
//       } else {
//         // No course-specific data yet, use legacy data
//         const attendanceRecords = await Attendance.find({ course: courseId });
//         const studentRecords = attendanceRecords.flatMap((att) =>
//           att.records.filter(
//             (r) => r.student.toString() === req.user._id.toString()
//           )
//         );

//         const presentCount = studentRecords.filter(
//           (r) => r.status === "present"
//         ).length;
//         const absentCount = studentRecords.filter(
//           (r) => r.status === "absent"
//         ).length;
//         const lateCount = studentRecords.filter(
//           (r) => r.status === "late"
//         ).length;
//         const excusedCount = studentRecords.filter(
//           (r) => r.status === "excused"
//         ).length;
//         const totalStudentClasses = studentRecords.length;

//         // Include absentDays from user model for imported data
//         const totalAbsentDays = absentCount + (user.absentDays || 0);

//         // Custom attendance calculation: denominator is totalStudentClasses + 1
//         const safeDenominator = totalStudentClasses;
//         const attendancePercentage =
//           safeDenominator > 0
//             ? ((presentCount + lateCount) / safeDenominator) * 100
//             : 0;

//         studentStats = {
//           totalClasses: totalStudentClasses,
//           presentCount,
//           absentCount: totalAbsentDays,
//           lateCount,
//           excusedCount,
//           attendancePercentage,
//           leavesLeft: 0,
//           classesTo75: 0,
//           warning:
//             attendancePercentage < 75 ? "Your attendance is below 75%!" : null,
//           importedAbsentDays: user.absentDays || 0,
//         };
//       }
//     } else if (req.user.role === "teacher" || req.user.role === "admin") {
//       // Check if teacher is instructor or user is admin
//       if (
//         req.user.role === "teacher" &&
//         course.instructor.toString() !== req.user._id.toString()
//       ) {
//         return res.status(403).json({
//           error: "Not authorized to view this course",
//           totalClasses,
//           studentStats: null,
//         });
//       }

//       // Get all students enrolled in the course with their attendance data
//       const enrolledStudents = course.students.filter((s) => s.isActive);
//       const studentStats = [];

//       for (const enrollment of enrolledStudents) {
//         const student = await User.findById(enrollment.student);
//         if (!student) continue;

//         // Get attendance records for this student
//         const studentAttendance = await Attendance.find({
//           course: courseId,
//           "records.student": student._id,
//         });

//         const studentRecords = studentAttendance.flatMap((att) =>
//           att.records.filter(
//             (r) => r.student.toString() === student._id.toString()
//           )
//         );

//         const presentCount = studentRecords.filter(
//           (r) => r.status === "present"
//         ).length;
//         const absentCount = studentRecords.filter(
//           (r) => r.status === "absent"
//         ).length;
//         const lateCount = studentRecords.filter(
//           (r) => r.status === "late"
//         ).length;
//         const excusedCount = studentRecords.filter(
//           (r) => r.status === "excused"
//         ).length;

//         // Include absentDays from user model
//         const totalAbsentDays = absentCount + (student.absentDays || 0);
//         const totalClasses = studentRecords.length;
//         const attendancePercentage =
//           totalClasses > 0
//             ? ((presentCount + lateCount) / totalClasses) * 100
//             : 0;

//         studentStats.push({
//           studentId: student._id,
//           name: student.name,
//           rollNo: student.rollNo,
//           presentCount,
//           absentCount: totalAbsentDays,
//           lateCount,
//           excusedCount,
//           totalClasses,
//           attendancePercentage,
//           importedAbsentDays: student.absentDays || 0,
//         });
//       }

//       return res.json({
//         totalClasses,
//         studentStats,
//         courseStats: {
//           totalStudents: enrolledStudents.length,
//           averageAttendance:
//             studentStats.length > 0
//               ? studentStats.reduce(
//                   (sum, s) => sum + s.attendancePercentage,
//                   0
//                 ) / studentStats.length
//               : 0,
//         },
//       });
//     }

//     res.json({
//       totalClasses,
//       studentStats,
//     });
//   } catch (error) {
//     console.error("Get attendance stats error:", error);
//     res.status(500).json({ error: "Server error" });
//   }
// });

// @route   GET /api/attendance/:courseId/stats
// @desc    Get attendance statistics for a course
// @access  Private
router.get("/:courseId/stats", protect, async (req, res) => {
  try {
    const { courseId } = req.params;

    // 1. Fetch the Course to get the AUTHORITATIVE totalClasses
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // This route is primarily for the student dashboard.
    // If the user is not a student, we can return empty stats
    // or you can build out teacher/admin logic here if needed.
    if (req.user.role !== "student") {
      return res.json({
        totalClasses: course.totalClasses,
        studentStats: null, // No specific student stats for non-students on this endpoint
      });
    }

    // 2. Fetch the logged-in student's data
    const user = await User.findById(req.user._id);
    const courseKey = courseId.toString();
    const studentCourseData = user.courseAttendance.get(courseKey);

    // If the student has no attendance record at all for this course
    if (!studentCourseData) {
      return res.json({
        studentStats: {
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          excusedCount: 0,
          totalClasses: course.totalClasses, // Use the master total
          attendancePercentage: 0,
          warning: "No attendance has been marked for you in this course yet.",
        },
      });
    }

    // 3. Calculate percentage using the COURSE's totalClasses (THE FIX!)
    const attendancePercentage =
      course.totalClasses > 0
        ? ((studentCourseData.presentCount || 0) / course.totalClasses) * 100
        : 0; // Avoid division by zero

    // 4. Create a warning message if attendance is low
    let warning = null;
    if (course.totalClasses > 0 && attendancePercentage < 75) {
      warning = "Attendance is below 75%!";
    }

    // 5. Build the final, correct stats object
    const studentStats = {
      presentCount: studentCourseData.presentCount || 0,
      absentCount: studentCourseData.absentCount || 0,
      lateCount: studentCourseData.lateCount || 0,
      excusedCount: studentCourseData.excusedCount || 0,
      totalClasses: course.totalClasses, // <-- The authoritative value from the Course
      attendancePercentage,
      warning,
    };

    res.json({ studentStats });
  } catch (error) {
    console.error("Get attendance stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/attendance/:courseId/:date
// @desc    Get attendance for a specific date
// @access  Private
router.get("/:courseId/:date", protect, async (req, res) => {
  try {
    const { courseId, date } = req.params;

    // Validate date parameter
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (req.user.role === "student") {
      const isEnrolled = course.students.some(
        (s) => s.student.toString() === req.user._id.toString() && s.isActive
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }
    } else if (req.user.role === "teacher") {
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this course" });
      }
    }

    const attendance = await Attendance.findOne({
      course: courseId,
      date: {
        $gte: new Date(new Date(parsedDate).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(parsedDate).setHours(24, 0, 0, 0)),
      },
    }).populate([
      { path: "records.student", select: "name email rollNo" },
      { path: "records.markedBy", select: "name" },
    ]);

    if (!attendance) {
      return res
        .status(404)
        .json({ error: "Attendance not found for this date" });
    }

    res.json(attendance);
  } catch (error) {
    console.error("Get attendance by date error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   GET /api/attendance/:courseId
// @desc    Get attendance records for a course
// @access  Private
router.get("/:courseId", protect, async (req, res) => {
  console.log("ROUTE /:courseId courseId:", req.params.courseId);
  try {
    const { courseId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    if (req.user.role === "student") {
      const isEnrolled = course.students.some(
        (s) => s.student.toString() === req.user._id.toString() && s.isActive
      );
      if (!isEnrolled) {
        return res.status(403).json({ error: "Not enrolled in this course" });
      }
    } else if (req.user.role === "teacher") {
      if (course.instructor.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ error: "Not authorized to view this course" });
      }
    }

    // Build query
    const query = { course: courseId };
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get attendance records with pagination
    const skip = (page - 1) * limit;
    const attendance = await Attendance.find(query)
      .populate("records.student", "name email rollNo")
      .populate("records.markedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// @route   PUT /api/attendance/:courseId/:date
// @desc    Update attendance for a specific date
// @access  Private (Course Instructor or Admin)
router.put(
  "/:courseId/:date",
  protect,
  authorize("teacher", "admin"),
  isCourseInstructor,
  [
    body("records").isArray().withMessage("Records must be an array"),
    body("records.*.student").isMongoId().withMessage("Invalid student ID"),
    body("records.*.status")
      .isIn(["present", "absent", "late", "excused"])
      .withMessage("Invalid status"),
    body("records.*.notes")
      .optional()
      .isString()
      .withMessage("Notes must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, date } = req.params;
      const { records } = req.body;

      // Validate date parameter
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      let attendance = await Attendance.findOne({
        course: courseId,
        date: {
          $gte: new Date(new Date(parsedDate).setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(parsedDate).setHours(24, 0, 0, 0)),
        },
      });

      if (!attendance) {
        return res
          .status(404)
          .json({ error: "Attendance not found for this date" });
      }

      if (attendance.isLocked) {
        return res
          .status(400)
          .json({ error: "Attendance is locked and cannot be modified" });
      }

      // Update records
      attendance.records = records.map((record) => ({
        student: record.student,
        status: record.status,
        markedBy: req.user._id,
        markedAt: new Date(),
        notes: record.notes || "",
      }));

      await attendance.save();
      await attendance.populate([
        { path: "records.student", select: "name email rollNo" },
        { path: "records.markedBy", select: "name" },
      ]);

      res.json(attendance);
    } catch (error) {
      console.error("Update attendance error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// @route   POST /api/attendance/:courseId/:date/lock
// @desc    Lock attendance for a specific date
// @access  Private (Course Instructor or Admin)
router.post(
  "/:courseId/:date/lock",
  protect,
  authorize("teacher", "admin"),
  isCourseInstructor,
  async (req, res) => {
    try {
      const { courseId, date } = req.params;

      // Validate date parameter
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: "Invalid date format" });
      }

      const attendance = await Attendance.findOne({
        course: courseId,
        date: parsedDate,
      });

      if (!attendance) {
        return res
          .status(404)
          .json({ error: "Attendance not found for this date" });
      }

      attendance.isLocked = true;
      attendance.lockedBy = req.user._id;
      attendance.lockedAt = new Date();

      await attendance.save();

      res.json({ message: "Attendance locked successfully" });
    } catch (error) {
      console.error("Lock attendance error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

module.exports = router;
