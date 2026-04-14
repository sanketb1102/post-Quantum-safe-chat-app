// reset_db.js
const mongoose = require('mongoose');

// Your actual connection string
const MONGODB_URI = "mongodb+srv://Sanket123:Sanket123@chatapp.ankbeqn.mongodb.net/chatapp?retryWrites=true&w=majority&appName=ChatApp"; 

async function clearDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("🔥 Connected to DB. Deleting all messages...");
    
    // Delete all messages to fix the "Decryption Failed" errors
    await mongoose.connection.db.collection('messages').deleteMany({});
    
    // Optional: Delete users too so you can start fresh with new keys
    // await mongoose.connection.db.collection('users').deleteMany({}); 

    console.log("✅ All messages deleted! You have a fresh start.");
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

clearDB();