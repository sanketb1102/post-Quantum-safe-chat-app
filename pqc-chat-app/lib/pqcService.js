/* lib/pqcService.js */
import createPqcModule from './pqc.js';

let pqcModule = null;

export const initPqc = async () => {
  if (pqcModule) return pqcModule;
  pqcModule = await createPqcModule({
    locateFile: (path) => {
      if (path.endsWith('.wasm')) return '/pqc.wasm';
      return path;
    },
  });
  return pqcModule;
};

const toHex = (arr) => {
  if(!arr) return "";
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
};

// ✅ THE CRITICAL FIX IS HERE:
const fromHex = (hexString) => {
  // SAFETY CHECK: If hexString is missing/undefined, return empty array.
  // This prevents the "reading 'match'" crash.
  if (!hexString) return new Uint8Array(0);
  
  return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
};

export const generateKeys = async () => {
  const mod = await initPqc();
  const pkSize = mod._get_public_key_bytes();
  const skSize = mod._get_secret_key_bytes();
  const pkPtr = mod._malloc(pkSize);
  const skPtr = mod._malloc(skSize);
  mod._generate_keypair(pkPtr, skPtr);
  const pk = new Uint8Array(mod.HEAPU8.subarray(pkPtr, pkPtr + pkSize));
  const sk = new Uint8Array(mod.HEAPU8.subarray(skPtr, skPtr + skSize));
  const keys = { pk: toHex(pk), sk: toHex(sk) };
  mod._free(pkPtr);
  mod._free(skPtr);
  return keys;
};

export const encapsulateSecret = async (receiverPublicKeyHex) => {
  const mod = await initPqc();
  const receiverPk = fromHex(receiverPublicKeyHex);
  const ctSize = mod._get_ciphertext_bytes();
  const ssSize = mod._get_shared_secret_bytes();
  const pkSize = mod._get_public_key_bytes();
  const ctPtr = mod._malloc(ctSize);
  const ssPtr = mod._malloc(ssSize);
  const pkPtr = mod._malloc(pkSize);
  mod.HEAPU8.set(receiverPk, pkPtr);
  mod._encapsulate(ctPtr, ssPtr, pkPtr);
  const ciphertext = new Uint8Array(mod.HEAPU8.subarray(ctPtr, ctPtr + ctSize));
  const sharedSecret = new Uint8Array(mod.HEAPU8.subarray(ssPtr, ssPtr + ssSize));
  const result = { ciphertext: toHex(ciphertext), sharedSecret: toHex(sharedSecret) };
  mod._free(ctPtr);
  mod._free(ssPtr);
  mod._free(pkPtr);
  return result;
};

export const decapsulateSecret = async (ciphertextHex, mySecretKeyHex) => {
  const mod = await initPqc();
  const ct = fromHex(ciphertextHex);
  const sk = fromHex(mySecretKeyHex);
  
  // Safety check
  if (ct.length === 0 || sk.length === 0) return null;

  const ssSize = mod._get_shared_secret_bytes();
  const ctSize = mod._get_ciphertext_bytes();
  const skSize = mod._get_secret_key_bytes();
  const ssPtr = mod._malloc(ssSize);
  const ctPtr = mod._malloc(ctSize);
  const skPtr = mod._malloc(skSize);
  mod.HEAPU8.set(ct, ctPtr);
  mod.HEAPU8.set(sk, skPtr);
  mod._decapsulate(ssPtr, ctPtr, skPtr);
  const sharedSecret = new Uint8Array(mod.HEAPU8.subarray(ssPtr, ssPtr + ssSize));
  const result = toHex(sharedSecret);
  mod._free(ssPtr);
  mod._free(ctPtr);
  mod._free(skPtr);
  return result;
};