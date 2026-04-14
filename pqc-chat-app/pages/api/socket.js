/* pages/api/socket.js */
import { Server } from 'socket.io';
import dbConnect from '../../lib/dbConnect'; // No curly braces
import Message from '../../models/Message';

export default async function handler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  await dbConnect();

  const io = new Server(res.socket.server, {
    path: '/api/socket.io',
    addTrailingSlash: false,
  });
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    socket.on('register_user', (username) => {
      socket.join(username);
    });

    socket.on('send_message', async (data) => {
      try {
        // Save BOTH encrypted copies to the database
        const newMsg = await Message.create({
          sender: data.sender,
          receiver: data.receiver,
          timestamp: new Date(),
          receiverBox: data.receiverBox, // For them
          senderBox: data.senderBox      // For you
        });

        // Send to Receiver
        io.to(data.receiver).emit('receive_message', data);
        
        // Also emit back to Sender (so it updates properly on other tabs)
        io.to(data.sender).emit('receive_message', data);

      } catch (err) {
        console.error("❌ Error saving message:", err);
      }
    });
  });

  res.end();
}