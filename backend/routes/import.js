const express = require("express");
const multer = require("multer");
const XLSX = require("xlsx");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const Course = require("../models/Course");
const { protect, authorize } = require("../middleware/auth");
const Attendance = require("../models/Attendance"); // Added Attendance model import

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/vnd.ms-excel"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"), false);
    }
  },
});

// @route   POST /api/import/excel
// @desc    Import users and attendance data from Excel file
// @access  Private (Admin only)
router.post(
  "/excel",
  protect,
  authorize("admin"),
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Please upload an Excel file" });
      }

      console.log(`[DEBUG] Processing Excel file: ${req.file.originalname}`);
      console.log(`[DEBUG] File size: ${req.file.size} bytes`);

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetNames = workbook.SheetNames;

      console.log(`[DEBUG] Found sheets: ${sheetNames.join(", ")}`);

      const results = {
        users: { created: 0, errors: [] },
        courses: { created: 0, errors: [] },
        courseAttendance: { updated: 0, errors: [] }, // Course-specific attendance only
      };

      // Process Users sheet
      if (sheetNames.includes("Users")) {
        const usersSheet = workbook.Sheets["Users"];
        const usersData = XLSX.utils.sheet_to_json(usersSheet);

        for (let i = 0; i < usersData.length; i++) {
          const row = usersData[i];
          try {
            // Validate required fields
            if (!row.name || !row.password || !row.role) {
              results.users.errors.push(
                `Row ${i + 2}: Missing required fields (name, password, role)`
              );
              continue;
            }

            // Email is required for teachers/admins, optional for students
            if (
              (row.role === "teacher" || row.role === "admin") &&
              !row.email
            ) {
              results.users.errors.push(
                `Row ${i + 2}: Email is required for teachers and admins`
              );
              continue;
            }

            // Check if user already exists (only if email is provided)
            if (row.email) {
              const existingUser = await User.findOne({ email: row.email });
              if (existingUser) {
                results.users.errors.push(`Row ${i + 2}: Email already exists`);
                continue;
              }
            }

            // Check if roll number already exists (for students)
            if (row.role === "student" && row.rollNo) {
              const existingStudent = await User.findOne({
                rollNo: row.rollNo,
              });
              if (existingStudent) {
                results.users.errors.push(
                  `Row ${i + 2}: Roll number already exists`
                );
                continue;
              }
            }

            // Create user
            const userData = {
              name: row.name,
              email: row.email || null, // Allow null for students
              password: row.password,
              role: row.role,
              rollNo: row.role === "student" ? row.rollNo : undefined,
              absentDays:
                row.role === "student" ? parseInt(row.absentDays) || 0 : 0,
            };

            await User.create(userData);
            results.users.created++;
          } catch (error) {
            results.users.errors.push(`Row ${i + 2}: ${error.message}`);
          }
        }
      }

      // Find the courses sheet (case-insensitive)
      let coursesSheetName = sheetNames.find(
        (name) => name.trim().toLowerCase() === "courses"
      );
      // Fallback: if only one sheet and it has the right columns, use it
      if (!coursesSheetName && sheetNames.length === 1) {
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const firstSheetData = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
        });
        const headerRow = (firstSheetData[0] || []).map((h) =>
          (h || "").toString().toLowerCase()
        );
        if (
          headerRow.includes("code") &&
          headerRow.includes("name") &&
          headerRow.includes("description") &&
          headerRow.includes("academicYear".toLowerCase()) &&
          headerRow.includes("semester") &&
          headerRow.includes("totalClasses".toLowerCase())
        ) {
          coursesSheetName = sheetNames[0];
        }
      }

      if (coursesSheetName) {
        const coursesSheet = workbook.Sheets[coursesSheetName];
        const coursesData = XLSX.utils.sheet_to_json(coursesSheet, {
          raw: false, // Keep raw values for better debugging
          defval: "", // Default value for empty cells
        });

        console.log(
          `[DEBUG] Found ${coursesData.length} course records in sheet: ${coursesSheetName}`
        );
        console.log(
          `[DEBUG] Raw course data:`,
          JSON.stringify(coursesData, null, 2)
        );

        for (let i = 0; i < coursesData.length; i++) {
          const row = coursesData[i];
          console.log(
            `[DEBUG] Processing course row ${i + 2}:`,
            JSON.stringify(row, null, 2)
          );

          // Skip empty rows
          if (!row || (!row.code && !row.name && !row.Code && !row.Name)) {
            console.log(`[DEBUG] Skipping empty row ${i + 2}`);
            continue;
          }

          try {
            // Handle case-insensitive column names
            const courseCode = (row.code || row.Code || "")
              .toString()
              .trim()
              .toUpperCase();
            const courseName = (row.name || row.Name || "").toString().trim();
            const description = (row.description || row.Description || "")
              .toString()
              .trim();
            const academicYear = (
              row.academicYear ||
              row.AcademicYear ||
              "2024-2025"
            )
              .toString()
              .trim();
            const semester = (row.semester || row.Semester || "Fall")
              .toString()
              .trim();

            // Parse totalClasses more carefully with case-insensitive column names
            let totalClasses = 0;
            const totalClassesValue =
              row.totalClasses ||
              row.TotalClasses ||
              row.totalclasses ||
              row.Totalclasses;
            if (
              totalClassesValue !== undefined &&
              totalClassesValue !== null &&
              totalClassesValue !== ""
            ) {
              const parsed = parseInt(totalClassesValue);
              if (!isNaN(parsed)) {
                totalClasses = Math.max(0, parsed);
              }
            }

            console.log(`[DEBUG] Parsed course data:`, {
              code: courseCode,
              name: courseName,
              description: description,
              academicYear: academicYear,
              semester: semester,
              totalClasses: totalClasses,
              rawTotalClasses: totalClassesValue,
            });

            // Validate required fields
            if (!courseCode || !courseName) {
              results.courses.errors.push(
                `Row ${i + 2}: Missing required fields (code, name)`
              );
              continue;
            }

            // Validate course code format
            if (courseCode.length < 2) {
              results.courses.errors.push(
                `Row ${
                  i + 2
                }: Invalid course code (must be at least 2 characters)`
              );
              continue;
            }

            // Validate course name
            if (courseName.length < 2) {
              results.courses.errors.push(
                `Row ${
                  i + 2
                }: Invalid course name (must be at least 2 characters)`
              );
              continue;
            }

            // Validate academic year format (basic check)
            if (!academicYear.match(/^\d{4}-\d{4}$/)) {
              results.courses.errors.push(
                `Row ${
                  i + 2
                }: Invalid academic year format (should be YYYY-YYYY)`
              );
              continue;
            }

            // Validate semester (case-insensitive)
            const validSemesters = ["Fall", "Spring", "Summer"];
            const normalizedSemester =
              semester.charAt(0).toUpperCase() +
              semester.slice(1).toLowerCase();
            if (!validSemesters.includes(normalizedSemester)) {
              results.courses.errors.push(
                `Row ${
                  i + 2
                }: Invalid semester (must be Fall, Spring, or Summer)`
              );
              continue;
            }

            // Check if course already exists
            const existingCourse = await Course.findOne({
              code: courseCode,
              academicYear: academicYear,
              semester: normalizedSemester,
            });
            if (existingCourse) {
              results.courses.errors.push(
                `Row ${
                  i + 2
                }: Course with code ${courseCode} already exists for ${academicYear} ${normalizedSemester}`
              );
              continue;
            }

            // Prevent template courses from being created during import
            // if (
            //   courseName === "Digital Design and Verilog Programming" ||
            //   courseName === "Calculus I"
            // ) {
            //   console.log(`[DEBUG] Skipping template course: ${courseName}`);
            //   continue;
            // }

            // Create course
            const courseData = {
              code: courseCode,
              name: courseName,
              description: description,
              instructor: req.user._id, // Set current user as instructor
              academicYear: academicYear,
              semester: normalizedSemester,
              totalClasses: totalClasses,
              students: [], // Will be populated with all active students
            };

            console.log(`[DEBUG] Creating course with data:`, courseData);

            const course = await Course.create(courseData);
            console.log(`[DEBUG] Course created successfully:`, course._id);

            // Enroll all active students in the new course
            const students = await User.find({
              role: "student",
              isActive: true,
            });
            console.log(
              `[DEBUG] Found ${students.length} active students to enroll`
            );

            course.students = students.map((student) => ({
              student: student._id,
              isActive: true,
            }));
            await course.save();
            console.log(
              `[DEBUG] Course saved with ${course.students.length} enrolled students`
            );

            results.courses.created++;
            console.log(`[DEBUG] Course creation completed for row ${i + 2}`);
          } catch (error) {
            console.error(
              `[DEBUG] Error creating course for row ${i + 2}:`,
              error
            );
            results.courses.errors.push(`Row ${i + 2}: ${error.message}`);
          }
        }
      }

      // Process Course Attendance sheet (for course-specific attendance)
      if (sheetNames.includes("CourseAttendance")) {
        const courseAttendanceSheet = workbook.Sheets["CourseAttendance"];
        const courseAttendanceData = XLSX.utils.sheet_to_json(
          courseAttendanceSheet
        );

        console.log(
          `[DEBUG] Processing ${courseAttendanceData.length} course attendance records`
        );

        for (let i = 0; i < courseAttendanceData.length; i++) {
          const row = courseAttendanceData[i];
          try {
            // Validate required fields
            if (
              !row.courseCode ||
              !row.rollNo ||
              row.absentDays === undefined
            ) {
              results.courseAttendance.errors.push(
                `Row ${
                  i + 2
                }: Missing required fields (courseCode, rollNo, absentDays)`
              );
              continue;
            }

            // Find course by code
            const course = await Course.findOne({ code: row.courseCode });
            if (!course) {
              results.courseAttendance.errors.push(
                `Row ${i + 2}: Course with code ${
                  row.courseCode
                } not found. Please create the course first.`
              );
              continue;
            }

            // Find student by roll number
            const student = await User.findOne({
              rollNo: row.rollNo.toString(),
              role: "student",
            });

            if (!student) {
              results.courseAttendance.errors.push(
                `Row ${i + 2}: Student with rollNo ${
                  row.rollNo
                } not found. Please import users first.`
              );
              continue;
            }

            // Check if student is enrolled in the course
            const isEnrolled = course.students.some(
              (s) =>
                s.student.toString() === student._id.toString() && s.isActive
            );

            if (!isEnrolled) {
              results.courseAttendance.errors.push(
                `Row ${i + 2}: Student ${
                  row.rollNo
                } is not enrolled in course ${
                  row.courseCode
                }. Please enroll the student first.`
              );
              continue;
            }

            // Update student's course-specific attendance
            // const courseKey = course._id.toString();
            // const currentAttendance = student.courseAttendance.get(
            //   courseKey
            // ) || {
            //   totalClasses: 0,
            //   presentCount: 0,
            //   absentCount: 0,
            //   lateCount: 0,
            //   excusedCount: 0,
            //   attendanceRecords: [],
            // };

            // // Update absent days count
            // const absentDays = Math.max(0, parseInt(row.absentDays) || 0);
            // currentAttendance.absentCount = absentDays;
            // currentAttendance.totalClasses = Math.max(
            //   currentAttendance.totalClasses,
            //   absentDays
            // );

            // // Update the course attendance
            // student.courseAttendance.set(courseKey, currentAttendance);
            // await student.save();

            // Replace the block above with this new one

            // Update student's course-specific attendance
            const courseKey = course._id.toString();
            const currentAttendance = student.courseAttendance.get(
              courseKey
            ) || {
              totalClasses: 0,
              presentCount: 0,
              absentCount: 0,
              lateCount: 0,
              excusedCount: 0,
              attendanceRecords: [],
            };

            // 1. Get total classes from the COURSE and absent days from the ROW
            const totalClasses = course.totalClasses || 0;
            const absentDays = Math.max(0, parseInt(row.absentDays) || 0);

            // 2. Calculate the present count
            const presentCount = Math.max(0, totalClasses - absentDays);

            // 3. Update the student's attendance record with all the correct values
            currentAttendance.totalClasses = totalClasses; // Sync with the course's official total
            currentAttendance.absentCount = absentDays;
            currentAttendance.presentCount = presentCount; // Set the newly calculated present count

            // 4. Save the updated map back to the student document
            student.courseAttendance.set(courseKey, currentAttendance);
            await student.save();

            //            ----- DEBUG LOGs -----
            console.log(`--- DEBUGGING ATTENDANCE IMPORT ---`);
            console.log(
              `Processing student: ${student.name} for course: ${course.name}`
            );
            console.log(
              `Course's totalClasses from DB: ${course.totalClasses}`
            ); // <-- IMPORTANT
            console.log(`Absent days from Excel: ${row.absentDays}`);

            console.log(
              `[DEBUG] Updated student ${student.name} (${row.rollNo}) course-specific attendance for ${row.courseCode}: absentDays=${absentDays}`
            );

            results.courseAttendance.updated++;
          } catch (error) {
            results.courseAttendance.errors.push(
              `Row ${i + 2}: ${error.message}`
            );
          }
        }
      }

      console.log(`[DEBUG] Import completed. Results:`, results);
      res.status(200).json({
        message: "Import completed",
        results,
      });
    } catch (error) {
      console.error("Excel import error:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  }
);

// @route   GET /api/import/template
// @desc    Download Excel template
// @access  Private (Admin only)
router.get("/template", protect, authorize("admin"), async (req, res) => {
  try {
    // Create template workbook
    const workbook = XLSX.utils.book_new();

    // Users sheet template
    const usersTemplate = [
      {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "student",
        rollNo: "001",
        absentDays: 5,
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password123",
        role: "teacher",
        rollNo: "",
        absentDays: 0,
      },
      {
        name: "Bob Wilson",
        email: "", // Optional for students
        password: "password123",
        role: "student",
        rollNo: "002",
        absentDays: 3,
      },
    ];

    const usersSheet = XLSX.utils.json_to_sheet(usersTemplate);
    XLSX.utils.book_append_sheet(workbook, usersSheet, "Users");

    // Courses sheet template
    const coursesTemplate = [
      {
        code: "CSPC33",
        name: "Digital Design and Verilog Programming",
        description:
          "This course covers the design of digital circuits and Verilog programming concepts.",
        academicYear: "2024-2025",
        semester: "Summer",
        totalClasses: 0,
      },
      {
        code: "MATH101",
        name: "Calculus I",
        description: "Limits, derivatives, and applications.",
        academicYear: "2024-2025",
        semester: "Fall",
        totalClasses: 0,
      },
    ];

    const coursesSheet = XLSX.utils.json_to_sheet(coursesTemplate);
    XLSX.utils.book_append_sheet(workbook, coursesSheet, "Courses");

    // Course Attendance sheet template
    const courseAttendanceTemplate = [
      {
        courseCode: "CS101",
        rollNo: "001",
        absentDays: 5,
      },
      {
        courseCode: "MATH101",
        rollNo: "002",
        absentDays: 3,
      },
    ];

    const courseAttendanceSheet = XLSX.utils.json_to_sheet(
      courseAttendanceTemplate
    );
    XLSX.utils.book_append_sheet(
      workbook,
      courseAttendanceSheet,
      "CourseAttendance"
    );

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=attendance_import_template.xlsx"
    );

    // Send file
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    res.send(buffer);
  } catch (error) {
    console.error("Template generation error:", error);
    res.status(500).json({ error: "Failed to generate template" });
  }
});

module.exports = router;
