// pages/chat.js
import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { encapsulateSecret, decapsulateSecret } from "../lib/pqcService";
import { encryptAES, decryptAES } from "../lib/aes";

export default function ChatPage() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState("");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const typingTimeoutRef = useRef(null);

  // 1. Initialize
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      window.location.href = "/";
      return;
    }
    setUsername(storedUsername);

    const setupSocket = async () => {
      await fetch("/api/socket");
      const newSocket = io({ path: "/api/socket.io" });

      newSocket.on("connect", () => {
        newSocket.emit("register_user", storedUsername);
      });

      newSocket.on("receive_message", async (msg) => {
        const decryptedMsg = await processIncomingMessage(msg, storedUsername);
        setMessages((prev) => [...prev, decryptedMsg]);
      });

      setSocket(newSocket);
    };
    setupSocket();
    return () => socket?.disconnect();
  }, []);

  // 2. Load History
  useEffect(() => {
    if (!username || !recipient) return;
    setMessages([]);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/messages?user1=${username}&user2=${recipient}`)
        .then((res) => res.json())
        .then(async (data) => {
          if (Array.isArray(data)) {
            const decryptedHistory = await Promise.all(
              data.map((msg) => processIncomingMessage(msg, username))
            );
            setMessages(decryptedHistory);
          }
        })
        .catch((err) => console.error(err));
    }, 500);
  }, [recipient, username]);

  // --- 🔐 NEW SECURITY LOGIC 🔐 ---

  const processIncomingMessage = async (msg, myUsername) => {
    try {
      // 1. Decide which "Box" to open
      let targetBox = null;

      if (msg.sender === myUsername) {
        // If I sent it, I open the "Sender Box" (encrypted for me)
        targetBox = msg.senderBox;
      } else {
        // If I received it, I open the "Receiver Box" (encrypted for me)
        targetBox = msg.receiverBox;
      }

      if (!targetBox) return { ...msg, displayMessage: "❌ Data Missing" };

      // 2. Decrypt
      const mySk = localStorage.getItem(`pqc_sk_${myUsername}`);
      if (!mySk) return { ...msg, displayMessage: "⚠️ Key Missing" };

      const sharedSecret = await decapsulateSecret(targetBox.kem, mySk);
      if (!sharedSecret) return { ...msg, displayMessage: "❌ Key Mismatch" };
      
      const plaintext = await decryptAES(targetBox.ciphertext, targetBox.iv, sharedSecret);
      return { ...msg, displayMessage: plaintext };

    } catch (e) {
      console.error("Decryption failed", e);
      return { ...msg, displayMessage: "❌ Decryption Error" };
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !recipient) return;

    try {
      // 1. Get RECIPIENT'S Public Key
      const res1 = await fetch(`/api/getPublicKey?username=${recipient}`);
      const data1 = await res1.json();
      if (!data1.publicKey) {
        alert("Recipient not found or has no keys!");
        return;
      }

      // 2. Get MY (SENDER'S) Public Key
      const res2 = await fetch(`/api/getPublicKey?username=${username}`);
      const data2 = await res2.json();
      if (!data2.publicKey) {
        alert("Your public key is missing. Please re-register.");
        return;
      }

      // 3. Encrypt for RECEIVER
      const encReceiver = await encapsulateSecret(data1.publicKey);
      const aesReceiver = await encryptAES(message, encReceiver.sharedSecret);
      const receiverBox = {
        kem: encReceiver.ciphertext,
        iv: aesReceiver.iv,
        ciphertext: aesReceiver.ciphertext
      };

      // 4. Encrypt for SENDER (Yourself)
      const encSender = await encapsulateSecret(data2.publicKey);
      const aesSender = await encryptAES(message, encSender.sharedSecret);
      const senderBox = {
        kem: encSender.ciphertext,
        iv: aesSender.iv,
        ciphertext: aesSender.ciphertext
      };

      // 5. Send both boxes
      const payload = {
        sender: username,
        receiver: recipient,
        receiverBox,
        senderBox,
        timestamp: new Date()
      };

      socket.emit("send_message", payload);
      setMessage("");

    } catch (error) {
      console.error("Encryption Error:", error);
      alert("Failed to encrypt.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem(`pqc_sk_${username}`);
    window.location.href = "/";
  };

  // --- UI ---
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Welcome, {username}</h2>
        <button onClick={handleLogout} style={{background:"red", color:"white", padding:"5px 10px", borderRadius:"5px", border:"none", cursor:"pointer"}}>Logout</button>
      </div>

      <input
        type="text"
        placeholder="Recipient username"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        className="border p-2 w-full mb-4 rounded-lg"
      />

      <div className="border p-4 h-96 overflow-y-auto bg-gray-50 rounded-lg mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`my-2 ${msg.sender === username ? "text-right" : "text-left"}`}>
            <p className={`inline-block p-2 rounded-lg ${msg.sender === username ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
              <strong>{msg.sender}:</strong> {msg.displayMessage}
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="border p-2 flex-grow rounded-lg"
        />
        <button onClick={sendMessage} disabled={!socket} className="bg-green-500 text-white px-4 py-2 rounded-lg">Send</button>
      </div>
    </div>
  );
}