const mongoose = require("mongoose");
require("dotenv").config();

const testConnection = async () => {
  try {
    console.log("Testing MongoDB connection...");
    console.log("Connection string:", process.env.MONGODB_URI);

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully!");

    await mongoose.disconnect();
    console.log("✅ Connection closed successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("\nPossible solutions:");
    console.log(
      "1. Install MongoDB locally: https://docs.mongodb.com/manual/installation/"
    );
    console.log("2. Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas");
    console.log("3. Check if MongoDB service is running");
  }
};

testConnection();
