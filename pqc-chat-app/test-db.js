// test-db.js
import mongoose from "mongoose";

const uri = "mongodb+srv://Sanket123:Sanket123@chatapp.ankbeqn.mongodb.net/chatapp?retryWrites=true&w=majority&appName=ChatApp";

async function testConnection() {
  try {
    console.log("🟡 Connecting to MongoDB...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("✅ MongoDB connected successfully!");
  } catch (error) {
    console.error("❌ MongoDB connection failed:");
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔴 Connection closed.");
  }
}

testConnection();

