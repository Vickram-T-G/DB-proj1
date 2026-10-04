const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
    ],
    credentials: true,
  })
);
app.use(express.json());

// Simple in-memory user storage
const users = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@attendance.com",
    password: "admin123",
    role: "admin",
    rollNo: null,
  },
];

// Simple login endpoint
app.post("/api/auth/login", (req, res) => {
  const { email, rollNo, password } = req.body;

  const user = users.find(
    (u) =>
      (email === "admin@attendance.com" || rollNo === "admin") &&
      u.password === password
  );

  if (user) {
    res.json({
      message: "Login successful",
      token: "fake-jwt-token",
      user: { ...user, password: undefined },
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Simple registration endpoint
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role, rollNo } = req.body;

  // Simple validation
  if (role === "student" && rollNo) {
    // Check if roll number already exists
    const existingUser = users.find((u) => u.rollNo === rollNo);
    if (existingUser) {
      return res.status(400).json({ error: "Roll number already exists" });
    }
  }

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password,
    role,
    rollNo,
  };

  users.push(newUser);

  res.status(201).json({
    message: "User registered successfully",
    token: "fake-jwt-token",
    user: { ...newUser, password: undefined },
  });
});

app.get("/api/auth/me", (req, res) => {
  // Mock user data
  res.json(users[0]);
});

// Mock courses routes
app.get("/api/courses", (req, res) => {
  res.json([]);
});

app.post("/api/courses", (req, res) => {
  res.json({ message: "Course created successfully" });
});

// Mock attendance routes
app.get("/api/attendance/:courseId", (req, res) => {
  res.json([]);
});

// Mock users routes
app.get("/api/users", (req, res) => {
  res.json(users);
});

// Mock invitations routes
app.get("/api/auth/invitations", (req, res) => {
  res.json([]);
});

app.post("/api/auth/invite", (req, res) => {
  res.json({ message: "Invitation created successfully" });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Mock server is running",
    note: "This is a mock server for testing. Install MongoDB for full functionality.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Mock server running on port ${PORT}`);
  console.log(`📱 Frontend should connect to: http://localhost:${PORT}`);
  console.log(`🔗 API Health check: http://localhost:${PORT}/api/health`);
  console.log(`\n📋 Test Credentials:`);
  console.log(`📧 Email: admin@attendance.com`);
  console.log(`🔑 Password: admin123`);
  console.log(
    `\n⚠️  This is a mock server. Install MongoDB for full functionality.`
  );
});
