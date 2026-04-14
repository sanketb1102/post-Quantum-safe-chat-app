# 🔐 Post-Quantum Secure Chat Application

A real-time messaging application secured by **Post-Quantum Cryptography (Kyber512)** and **Hybrid Encryption**. This project demonstrates how to protect web communications against future quantum computer attacks using WebAssembly (WASM) and the `liboqs` library.

## 🚀 Features

* **Quantum-Resistant Key Exchange:** Uses **Kyber512** (NIST-standardized PQC algorithm) to generate shared secrets.
* **Hybrid Encryption:** Combines Kyber512 (for key encapsulation) with **AES-GCM** (for message encryption).
* **Double Encryption Architecture:**
    * Messages are encrypted **twice**: once for the Receiver and once for the Sender.
    * Ensures both parties can read their own chat history without the server ever seeing the plaintext.
* **Zero-Knowledge Server:** The server stores only encrypted blobs (`kem`, `iv`, `ciphertext`). It never sees private keys or messages.
* **Client-Side Key Management:**
    * Keys are generated in the browser.
    * Private keys are downloaded by the user and never sent to the database.
    * Private keys are stored in volatile memory (`localStorage`) and wiped on logout.
* **High Performance:** Uses **WebAssembly (WASM)** for near-native cryptographic performance in the browser.

---

## 🛠️ Tech Stack

* **Frontend:** React (Next.js)
* **Backend:** Node.js, Next.js API Routes
* **Real-time Communication:** Socket.IO
* **Database:** MongoDB
* **Cryptography:**
    * **C / WebAssembly:** `liboqs` (Open Quantum Safe) compiled via Emscripten.
    * **Standard:** Web Crypto API (AES-GCM).

---

## ⚙️ Installation & Setup

### 1. Prerequisites
* Node.js (v16 or higher)
* MongoDB Database URL

### 2. Clone and Install
```bash
git clone <repository-url>
cd my-chat-app
npm install
````

### 3\. Environment Configuration

Create a file named `.env.local` in the root directory:

```bash
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/chatapp
```

### 4\. Compiling the PQC Engine (Optional)

*Note: The `pqc.wasm` and `pqc.js` files are already included in `/public` and `/lib`. You only need to run this if you modify `pqc_wrapper.c`.*

```bash
emcc pqc_wrapper.c \
  ~/liboqs/build/lib/liboqs.a \
  -I ~/liboqs/build/include \
  -o public/pqc.js \
  -O3 -flto -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 \
  -s MODULARIZE=1 -s EXPORT_NAME="createPqcModule" \
  -s EXPORTED_FUNCTIONS="['_malloc', '_free', '_generate_keypair', '_encapsulate', '_decapsulate', '_get_public_key_bytes', '_get_secret_key_bytes', '_get_ciphertext_bytes', '_get_shared_secret_bytes']" \
  -s EXPORTED_RUNTIME_METHODS="['HEAPU8']" -s NO_EXIT_RUNTIME=1 -s ENVIRONMENT=web
```

### 5\. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) in your browser.

-----

## 📖 User Guide

### 1\. Registration (Identity Creation)

1.  Go to the **Register** toggle.
2.  Enter a username and password.
3.  Click **Register**.
4.  **Important:** A file named `username_private_key.txt` will automatically download. **Keep this safe.** This is your identity.

### 2\. Secure Login

1.  Enter your username and password.
2.  Click **Choose File** and upload the `_private_key.txt` you downloaded earlier.
3.  Click **Login**. This loads your identity into the browser's secure memory.

### 3\. Chatting

1.  Enter the username of the person you want to chat with (e.g., `Alice`).
2.  Type a message and click **Send**.
3.  The app fetches Alice's Public Key, encrypts the message using Kyber+AES, and sends it.

### 4\. Logout

Clicking **Logout** immediately wipes the Private Key from the browser storage to prevent side-channel leaks.

-----

## 🛡️ Security Architecture

### The "Double Box" Protocol

Since the server cannot read messages, we must ensure the sender can still see their own sent history. We achieve this by creating two encrypted "boxes" for every message:

1.  **Receiver Box:**
      * The message is encapsulated using the **Receiver's Public Key**.
      * Only the Receiver's Private Key can open this.
2.  **Sender Box:**
      * The message is encapsulated using the **Sender's Public Key**.
      * Only the Sender (you) can open this later to view history.

### The Encryption Flow (Hybrid)

For every single message sent:

1.  **KEM (Kyber512):** Generates a random **Shared Secret** and a **Ciphertext** (Capsule).
2.  **AES-GCM:** Uses the Shared Secret to encrypt the actual text message with a unique IV.
3.  **Transmission:** The `kem`, `iv`, and `ciphertext` are sent to the server.

-----

## 📂 Project Structure

```
├── lib/
│   ├── aes.js          # AES-GCM Encryption/Decryption logic
│   ├── dbConnect.js    # MongoDB Connection
│   ├── pqc.js          # The compiled JS interface for WASM
│   └── pqcService.js   # Wrapper to handle WASM memory & PQC functions
├── models/
│   ├── Message.js      # Schema storing SenderBox and ReceiverBox
│   └── User.js         # Schema storing Public Keys
├── pages/
│   ├── api/            # Backend Routes (Login, Register, Socket)
│   ├── chat.js         # Main Chat UI & Crypto Logic
│   └── index.js        # Login/Register UI
├── public/
│   └── pqc.wasm        # The compiled Kyber512 Binary
└── pqc_wrapper.c       # C code bridging liboqs to JavaScript
```

-----
