/* pages/api/getPublicKey.js */
import dbConnect from '../../lib/dbConnect'; // <--- NO CURLY BRACES
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    await dbConnect();

    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    if (!user.publicKey) {
      return res.status(404).json({ error: "User has no keys" });
    }

    // Success
    return res.status(200).json({ publicKey: user.publicKey });

  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}