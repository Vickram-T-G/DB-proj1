const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { MongoMemoryServer } = require("mongodb-memory-server");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5174",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/users", require("./routes/users"));
app.use("/api/email", require("./routes/email"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 5000;

// Start server with MongoDB Memory Server
const startServer = async () => {
  try {
    console.log("🚀 Starting server with MongoDB Memory Server...");

    // Start MongoDB Memory Server
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    console.log("📦 MongoDB Memory Server started");
    console.log("🔗 Connection string:", mongoUri);

    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB Memory Server");

    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
      console.log(`🔗 API Health check: http://localhost:${PORT}/api/health`);
    });

    // Create first admin user
    const bcrypt = require("bcryptjs");
    const User = require("./models/User");

    const existingAdmin = await User.findOne({ role: "admin" });
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("admin123", salt);

      const adminUser = new User({
        name: "System Administrator",
        email: "admin@attendance.com",
        password: hashedPassword,
        role: "admin",
        invitationToken: "FIRST_ADMIN_SETUP",
      });

      await adminUser.save();
      console.log("✅ First admin user created!");
      console.log("📧 Email: admin@attendance.com");
      console.log("🔑 Password: admin123");
    }
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
