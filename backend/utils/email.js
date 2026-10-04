const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // Debug log for email config
  console.log("[DEBUG] Email config:", {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    user: process.env.EMAIL_USER,
    from: process.env.EMAIL_FROM,
  });
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log("Email not configured, skipping email send");
      return { success: false, error: "Email not configured" };
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
};

// Send attendance reminder email
const sendAttendanceReminder = async (adminEmail, courseName, date) => {
  const subject = `Attendance Reminder - ${courseName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Attendance Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder that attendance for <strong>${courseName}</strong> has not been updated for <strong>${date}</strong>.</p>
      <p>Please log in to the attendance system and update the attendance records.</p>
      <p>Thank you!</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated reminder from the Attendance Management System.
      </p>
    </div>
  `;

  return await sendEmail({
    to: adminEmail,
    subject,
    html,
  });
};

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName, role) => {
  const subject = `Welcome to Attendance System - ${userName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome to the Attendance System!</h2>
      <p>Hello ${userName},</p>
      <p>Welcome to the Attendance Management System! Your account has been created successfully.</p>
      <p><strong>Role:</strong> ${role}</p>
      <p>You can now log in to the system and start managing attendance.</p>
      <p>If you have any questions, please contact your administrator.</p>
      <p>Thank you!</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated email from the Attendance Management System.
      </p>
    </div>
  `;

  return await sendEmail({
    to: userEmail,
    subject,
    html,
  });
};

// Send attendance failure notification to admins
const sendAttendanceFailureNotification = async (
  courseName,
  courseCode,
  date,
  error
) => {
  try {
    // Get all admin users
    const User = require("../models/User");
    const admins = await User.find({ role: "admin", isActive: true });

    if (admins.length === 0) {
      console.log("No admin users found for attendance failure notification");
      return;
    }

    const adminEmails = admins.map((admin) => admin.email).filter(Boolean);

    if (adminEmails.length === 0) {
      console.log("No admin emails found for attendance failure notification");
      return;
    }

    const subject = `Attendance Failure Alert - ${courseCode}`;
    const html = `
      <h2>Attendance Failure Alert</h2>
      <p><strong>Course:</strong> ${courseName} (${courseCode})</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Error:</strong> ${error}</p>
      <p>Please check the attendance system and take necessary action.</p>
    `;

    await sendEmail({
      to: adminEmails.join(", "),
      subject,
      html,
    });

    console.log(
      `Attendance failure notification sent to ${adminEmails.length} admins`
    );
  } catch (error) {
    console.error("Failed to send attendance failure notification:", error);
  }
};

module.exports = {
  sendEmail,
  sendAttendanceReminder,
  sendWelcomeEmail,
  sendAttendanceFailureNotification,
};
