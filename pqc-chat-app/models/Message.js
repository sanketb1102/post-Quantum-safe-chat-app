/* models/Message.js */
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true },
  receiver: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },

  // 📦 Box 1: Encrypted for the RECEIVER
  receiverBox: {
    iv: String,
    kem: String,
    ciphertext: String
  },

  // 📦 Box 2: Encrypted for the SENDER (You)
  senderBox: {
    iv: String,
    kem: String,
    ciphertext: String
  }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);