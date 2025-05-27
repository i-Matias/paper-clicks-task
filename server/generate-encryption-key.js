const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");

const envPath = path.resolve(__dirname, ".env");

const encryptionKey = crypto.randomBytes(32).toString("hex").substring(0, 32);
console.log("Generated encryption key:", encryptionKey);

try {
  const envConfig = fs.existsSync(envPath)
    ? dotenv.parse(fs.readFileSync(envPath))
    : {};

  envConfig.ENCRYPTION_KEY = encryptionKey;

  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(envPath, envContent);
  console.log(".env file updated with new encryption key");
} catch (error) {
  console.error("Error updating .env file:", error);
}
