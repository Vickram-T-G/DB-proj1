const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

const createFirstAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Check if any admin exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists. Skipping setup.");
      process.exit(0);
    }

    // Create first admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const adminUser = new User({
      name: "System Administrator",
      email: "admin@attendance.com",
      password: hashedPassword,
      role: "admin",
      invitationToken: "FIRST_ADMIN_SETUP", // Special token for first admin
    });

    await adminUser.save();

    console.log("✅ First admin user created successfully!");
    console.log("📧 Email: admin@attendance.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the password after first login!");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createFirstAdmin();
