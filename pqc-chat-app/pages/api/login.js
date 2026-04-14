/* pages/api/login.js */
import dbConnect from '../../lib/dbConnect'; // <--- NO curly braces { }
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  await dbConnect();

  const { username, password } = req.body;

  try {
    // 1. Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    // 2. Check Password (In a real app, use bcrypt!)
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // 3. Success
    res.status(200).json({ success: true, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}