// pages/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import { generateKeys } from "../lib/pqcService"; 

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [privateKeyContent, setPrivateKeyContent] = useState(""); // Store uploaded key
  const router = useRouter();

  // Handle File Upload (For Login)
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPrivateKeyContent(event.target.result); // Read file text
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    let body = { username, password };

    // --- REGISTRATION LOGIC ---
    if (isRegister) {
      try {
        console.log("Generating Post-Quantum Keys...");
        const keys = await generateKeys();
        
        // Download Private Key
        const element = document.createElement("a");
        const file = new Blob([keys.sk], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = `${username}_private_key.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        body.publicKey = keys.pk; 
      } catch (err) {
        console.error("Key generation failed:", err);
        setError("Failed to generate secure keys. Make sure pqc.wasm is loaded.");
        return;
      }
    } 
    
    // --- LOGIN LOGIC ---
    else {
      // Security Check: Must upload private key to login
      if (!privateKeyContent) {
        setError("⚠️ You must upload your Private Key file to login securely.");
        return;
      }
      // Save Private Key to Memory (LocalStorage) for the chat session
      localStorage.setItem(`pqc_sk_${username}`, privateKeyContent);
    }

    // --- SEND TO SERVER ---
    const endpoint = isRegister ? "/api/register" : "/api/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok) {
      if (isRegister) {
        alert("Registration Successful! Keep your key safe.");
        setIsRegister(false); 
      } else {
        localStorage.setItem("username", username);
        router.push("/chat");
      }
    } else {
      setError(data.error || "Something went wrong");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="app-title">🔐 ChatterBox PQC</h1>
        <h3>{isRegister ? "Create an account" : "Secure Login"}</h3>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Show File Upload ONLY during Login */}
          {!isRegister && (
            <div style={{marginBottom: "15px", textAlign:"left"}}>
              <label style={{fontSize:"0.9rem", color:"#555"}}>Upload Private Key:</label>
              <input 
                type="file" 
                accept=".txt" 
                onChange={handleFileUpload} 
                required 
                style={{marginTop: "5px"}}
              />
            </div>
          )}
          
          <button type="submit">
            {isRegister ? "Register & Download Key" : "Login"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <p onClick={() => setIsRegister(!isRegister)} className="toggle">
          {isRegister
            ? "Already have an account? Log in"
            : "Don’t have an account? Register"}
        </p>
      </div>

      <style jsx>{`
        .login-container {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea, #764ba2);
          font-family: Inter, sans-serif;
        }
        .login-box {
          width: 360px;
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        input[type="text"], input[type="password"] {
          width: 100%;
          margin-bottom: 15px;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
          font-size: 1rem;
        }
        button {
          width: 100%;
          padding: 12px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border: none;
          color: white;
          font-size: 1rem;
          border-radius: 8px;
          cursor: pointer;
        }
        button:hover {
          transform: scale(1.03);
        }
        .error {
          color: red;
          margin-top: 10px;
        }
        .toggle {
          margin-top: 10px;
          color: #0070f3;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}