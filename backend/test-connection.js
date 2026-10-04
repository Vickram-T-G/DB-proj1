const mongoose = require("mongoose");
require("dotenv").config();

console.log("Testing MongoDB Atlas connection...");
console.log("Connection string:", process.env.MONGODB_URI);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ SUCCESS: Connected to MongoDB Atlas!");
    console.log("Your connection is working properly.");
    process.exit(0);
  })
  .catch((error) => {
    console.log("❌ ERROR: Could not connect to MongoDB Atlas");
    console.log("Error details:", error.message);
    console.log("\nPossible solutions:");
    console.log("1. Check if your IP is whitelisted in Atlas");
    console.log("2. Verify your password is correct");
    console.log("3. Make sure your cluster is running");
    process.exit(1);
  });
