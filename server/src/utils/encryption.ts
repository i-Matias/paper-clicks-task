import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// IMPORTANT: Set a 32 byte encryption key in your .env file
// You can generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
let ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "defaultkey123defaultkey123defaultkey12";

// Ensure the key is exactly 32 bytes (256 bits) for AES-256
if (ENCRYPTION_KEY.length !== 32) {
  console.warn(
    "Warning: Encryption key is not exactly 32 bytes. Adjusting to correct length."
  );
  // If longer, truncate; if shorter, pad with a repeating pattern
  if (ENCRYPTION_KEY.length > 32) {
    ENCRYPTION_KEY = ENCRYPTION_KEY.substring(0, 32);
  } else {
    // Pad with repeating pattern
    ENCRYPTION_KEY = ENCRYPTION_KEY.padEnd(32, ENCRYPTION_KEY);
  }
}

const IV_LENGTH = 16; // For AES, this is always 16 bytes

/**
 * Encrypts text using AES-256-CBC with a random initialization vector
 * @param text The text to encrypt
 * @returns The encrypted text with IV prepended, hex encoded
 */
export const encrypt = (text: string): string => {
  // Ensure we're not trying to encrypt undefined or null
  if (text === undefined || text === null) {
    throw new Error("Cannot encrypt undefined or null value");
  }

  // Convert to string if it's not already
  const textToEncrypt = String(text);

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf8").slice(0, 32), // Ensure exactly 32 bytes
    iv
  );
  let encrypted = cipher.update(textToEncrypt);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

/**
 * Decrypts text that was encrypted with the encrypt function
 * @param text The text to decrypt (format: iv:encryptedData in hex)
 * @returns The decrypted text
 */
export const decrypt = (text: string): string => {
  const parts = text.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf8").slice(0, 32), // Ensure exactly 32 bytes
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
