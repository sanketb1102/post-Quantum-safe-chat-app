/* pages/api/messages.js */
import dbConnect from '../../lib/dbConnect'; // ⚠️ NO curly braces!
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { user1, user2 } = req.query;
  if (!user1 || !user2) return res.status(400).json({ error: "Missing users" });

  try {
    await dbConnect();

    // Fetch chat history
    const messages = await Message.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }).sort({ timestamp: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Messages API Error:", error);
    res.status(500).json({ error: error.message });
  }
}