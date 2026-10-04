const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

async function testAPI() {
  try {
    console.log("Testing API endpoints...\n");

    // Test health endpoint
    console.log("1. Testing health endpoint...");
    const health = await axios.get(`${API_BASE}/health`);
    console.log("✅ Health:", health.data);

    // Test admin login
    console.log("\n2. Testing admin login...");
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: "admin@attendance.com",
      password: "admin123",
    });
    console.log("✅ Admin login successful:", loginResponse.data);

    // Test student registration
    console.log("\n3. Testing student registration...");
    const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
      name: "Test Student",
      email: "test@example.com",
      password: "password123",
      role: "student",
      rollNo: "106124135",
    });
    console.log("✅ Student registration successful:", registerResponse.data);

    console.log("\n🎉 All API tests passed!");
    console.log("\n📋 Test Credentials:");
    console.log("Admin - Email: admin@attendance.com, Password: admin123");
    console.log("Student - Email: student@test.com, Password: password123");
  } catch (error) {
    console.error("❌ API test failed:", error.response?.data || error.message);
  }
}

testAPI();
