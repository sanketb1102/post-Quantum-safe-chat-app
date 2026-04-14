/* lib/aes.js */

// Helper: Hex <-> Bytes
const toHex = (arr) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => {
  if (!hex) return new Uint8Array(0);
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
};

// Import the Shared Secret (Must be Bytes, not Hex)
const importKey = async (secretBytes) => {
  return await window.crypto.subtle.importKey(
    "raw",
    secretBytes,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
};

// Encrypt Text
export const encryptAES = async (text, sharedSecretHex) => {
  // FIX: Convert the incoming Hex String to Bytes first!
  const sharedSecretBytes = fromHex(sharedSecretHex);
  
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); 
  const key = await importKey(sharedSecretBytes);
  const encodedText = new TextEncoder().encode(text);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encodedText
  );

  return {
    iv: toHex(iv),
    ciphertext: toHex(new Uint8Array(encryptedBuffer))
  };
};

// Decrypt Text
export const decryptAES = async (ciphertextHex, ivHex, sharedSecretHex) => {
  try {
    // FIX: Convert all Hex strings to Bytes first!
    const key = await importKey(fromHex(sharedSecretHex));
    const iv = fromHex(ivHex);
    const ciphertext = fromHex(ciphertextHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "⚠️ [Decryption Error]";
  }
};