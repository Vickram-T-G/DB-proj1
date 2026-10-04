const jwt = require("jsonwebtoken");
const admin = require("../config/firebaseAdmin");
const User = require("../models/User");

const loadUserOr401 = (req, user, res, next) => {
  if (!user) {
    return res.status(401).json({ error: "User not found in database" });
  }
  if (!user.isActive) {
    return res.status(401).json({ error: "Account is deactivated" });
  }
  req.user = user;
  return next();
};

// Protect routes - Firebase ID token or legacy JWT
const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res
        .status(401)
        .json({ error: "Not authorized to access this route" });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const user = await User.findOne({ firebaseUid: decodedToken.uid });
      return loadUserOr401(req, user, res, next);
    } catch (firebaseError) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        return loadUserOr401(req, user, res, next);
      } catch (jwtError) {
        console.log(
          "[DEBUG] protect middleware: Token is not valid",
          firebaseError.message,
          jwtError.message
        );
        return res.status(401).json({ error: "Token is not valid" });
      }
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Authorize roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

// Check if user is instructor of a course
const isCourseInstructor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Course = require("../models/Course");

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Allow admins to modify any course, teachers can only modify their own courses
    if (
      req.user.role !== "admin" &&
      course.instructor.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Not authorized to modify this course" });
    }

    req.course = course;
    next();
  } catch (error) {
    console.error("Course instructor check error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Check if user is enrolled in a course
const isEnrolledStudent = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const Course = require("../models/Course");

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const isEnrolled = course.students.some(
      (student) =>
        student.student.toString() === req.user._id.toString() &&
        student.isActive
    );

    if (!isEnrolled) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    req.course = course;
    next();
  } catch (error) {
    console.error("Enrollment check error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  protect,
  auth: protect, // Add this alias for compatibility
  authorize,
  isCourseInstructor,
  isEnrolledStudent,
};
