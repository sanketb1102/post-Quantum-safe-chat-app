/* pages/api/register.js */
import dbConnect from '../../lib/dbConnect';
import User from '../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  await dbConnect();

  // 1. Get publicKey from the body
  const { username, password, publicKey } = req.body; 

  try {
    // 2. Save it to the database
    const user = await User.create({ 
        username, 
        password, 
        publicKey // <--- Add this line
    });
    
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
}