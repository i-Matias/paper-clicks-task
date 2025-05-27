import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

let ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "defaultkey123defaultkey123defaultkey12";

if (ENCRYPTION_KEY.length !== 32) {
  console.warn(
    "Warning: Encryption key is not exactly 32 bytes. Adjusting to correct length."
  );
  if (ENCRYPTION_KEY.length > 32) {
    ENCRYPTION_KEY = ENCRYPTION_KEY.substring(0, 32);
  } else {
    ENCRYPTION_KEY = ENCRYPTION_KEY.padEnd(32, ENCRYPTION_KEY);
  }
}

const IV_LENGTH = 16;

export const encrypt = (text: string): string => {
  if (text === undefined || text === null) {
    throw new Error("Cannot encrypt undefined or null value");
  }

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

export const decrypt = (text: string): string => {
  const parts = text.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf8").slice(0, 32),
    iv
  );
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
