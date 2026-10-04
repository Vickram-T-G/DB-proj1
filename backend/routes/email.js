const express = require("express");
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");
const Course = require("../models/Course");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// @route   POST /api/email/attendance-reminder
// @desc    Send attendance reminder to teachers
// @access  Private (Admin)
router.post(
  "/attendance-reminder",
  protect,
  authorize("admin"),
  [
    body("courseId").isMongoId().withMessage("Invalid course ID"),
    body("date").isISO8601().withMessage("Date must be a valid ISO date"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, date } = req.body;

      // Check if attendance already exists for this date
      const existingAttendance = await Attendance.findOne({
        course: courseId,
        date: new Date(date),
      });

      if (existingAttendance) {
        return res
          .status(400)
          .json({ error: "Attendance already marked for this date" });
      }

      // Get course and instructor details
      const course = await Course.findById(courseId).populate(
        "instructor",
        "name email"
      );
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if instructor has email notifications enabled
      if (!course.instructor.emailNotifications) {
        return res
          .status(400)
          .json({ error: "Instructor has email notifications disabled" });
      }

      const transporter = createTransporter();
      const formattedDate = new Date(date).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: course.instructor.email,
        subject: `Attendance Reminder - ${course.name} (${course.code})`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Attendance Reminder</h2>
          <p>Dear ${course.instructor.name},</p>
          <p>This is a reminder to mark attendance for your course:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0;">Course Details</h3>
            <p><strong>Course:</strong> ${course.name}</p>
            <p><strong>Code:</strong> ${course.code}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Enrolled Students:</strong> ${
              course.students.filter((s) => s.isActive).length
            }</p>
          </div>
          <p>Please log in to the attendance system and mark attendance for today's class.</p>
          <p>Best regards,<br>Attendance Management System</p>
        </div>
      `,
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: "Attendance reminder sent successfully" });
    } catch (error) {
      console.error("Send attendance reminder error:", error);
      res.status(500).json({ error: "Failed to send email reminder" });
    }
  }
);

// @route   POST /api/email/bulk-reminder
// @desc    Send attendance reminders for multiple courses
// @access  Private (Admin)
router.post(
  "/bulk-reminder",
  protect,
  authorize("admin"),
  [body("date").isISO8601().withMessage("Date must be a valid ISO date")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { date } = req.body;
      const targetDate = new Date(date);

      // Get all active courses
      const courses = await Course.find({ isActive: true }).populate(
        "instructor",
        "name email"
      );

      const results = [];
      const transporter = createTransporter();

      for (const course of courses) {
        try {
          // Check if attendance already exists for this date
          const existingAttendance = await Attendance.findOne({
            course: course._id,
            date: targetDate,
          });

          if (existingAttendance) {
            results.push({
              course: course.name,
              status: "skipped",
              reason: "Attendance already marked",
            });
            continue;
          }

          // Check if instructor has email notifications enabled
          if (!course.instructor.emailNotifications) {
            results.push({
              course: course.name,
              status: "skipped",
              reason: "Email notifications disabled",
            });
            continue;
          }

          const formattedDate = targetDate.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: course.instructor.email,
            subject: `Attendance Reminder - ${course.name} (${course.code})`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Attendance Reminder</h2>
              <p>Dear ${course.instructor.name},</p>
              <p>This is a reminder to mark attendance for your course:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Course Details</h3>
                <p><strong>Course:</strong> ${course.name}</p>
                <p><strong>Code:</strong> ${course.code}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Enrolled Students:</strong> ${
                  course.students.filter((s) => s.isActive).length
                }</p>
              </div>
              <p>Please log in to the attendance system and mark attendance for today's class.</p>
              <p>Best regards,<br>Attendance Management System</p>
            </div>
          `,
          };

          await transporter.sendMail(mailOptions);

          results.push({
            course: course.name,
            status: "sent",
            instructor: course.instructor.email,
          });
        } catch (error) {
          results.push({
            course: course.name,
            status: "failed",
            error: error.message,
          });
        }
      }

      const summary = {
        total: results.length,
        sent: results.filter((r) => r.status === "sent").length,
        skipped: results.filter((r) => r.status === "skipped").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
      };

      res.json(summary);
    } catch (error) {
      console.error("Bulk reminder error:", error);
      res.status(500).json({ error: "Failed to send bulk reminders" });
    }
  }
);

// @route   POST /api/email/student-notification
// @desc    Send attendance notification to students
// @access  Private (Course Instructor or Admin)
router.post(
  "/student-notification",
  protect,
  authorize("teacher", "admin"),
  [
    body("courseId").isMongoId().withMessage("Invalid course ID"),
    body("date").isISO8601().withMessage("Date must be a valid ISO date"),
    body("message")
      .optional()
      .isString()
      .withMessage("Message must be a string"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { courseId, date, message } = req.body;

      // Get course and enrolled students
      const course = await Course.findById(courseId)
        .populate("instructor", "name email")
        .populate("students.student", "name email emailNotifications");

      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      // Check if user is course instructor
      if (
        req.user.role === "teacher" &&
        course.instructor._id.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          error: "Not authorized to send notifications for this course",
        });
      }

      const activeStudents = course.students
        .filter((s) => s.isActive && s.student.emailNotifications)
        .map((s) => s.student);

      if (activeStudents.length === 0) {
        return res
          .status(400)
          .json({ error: "No students with email notifications enabled" });
      }

      const transporter = createTransporter();
      const formattedDate = new Date(date).toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const results = [];

      for (const student of activeStudents) {
        try {
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: student.email,
            subject: `Attendance Update - ${course.name} (${course.code})`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Attendance Update</h2>
              <p>Dear ${student.name},</p>
              <p>Your attendance has been marked for:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0;">Course Details</h3>
                <p><strong>Course:</strong> ${course.name}</p>
                <p><strong>Code:</strong> ${course.code}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Instructor:</strong> ${course.instructor.name}</p>
              </div>
              ${
                message
                  ? `<p><strong>Message from instructor:</strong> ${message}</p>`
                  : ""
              }
              <p>You can view your attendance records by logging into the attendance system.</p>
              <p>Best regards,<br>Attendance Management System</p>
            </div>
          `,
          };

          await transporter.sendMail(mailOptions);

          results.push({
            student: student.name,
            email: student.email,
            status: "sent",
          });
        } catch (error) {
          results.push({
            student: student.name,
            email: student.email,
            status: "failed",
            error: error.message,
          });
        }
      }

      const summary = {
        total: results.length,
        sent: results.filter((r) => r.status === "sent").length,
        failed: results.filter((r) => r.status === "failed").length,
        results,
      };

      res.json(summary);
    } catch (error) {
      console.error("Student notification error:", error);
      res.status(500).json({ error: "Failed to send student notifications" });
    }
  }
);

// @route   POST /api/email/test
// @desc    Send test email
// @access  Private (Admin)
router.post(
  "/test",
  protect,
  authorize("admin"),
  [body("email").isEmail().withMessage("Please provide a valid email")],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email } = req.body;

      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Test Email - Attendance Management System",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email from the Attendance Management System.</p>
          <p>If you received this email, the email configuration is working correctly.</p>
          <p>Best regards,<br>Attendance Management System</p>
        </div>
      `,
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email error:", error);
      res.status(500).json({ error: "Failed to send test email" });
    }
  }
);

module.exports = router;
