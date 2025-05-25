#!/usr/bin/env node

/**
 * This script generates a secure encryption key and updates the .env file.
 * Run it with: node generate-encryption-key.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Path to the .env file
const envPath = path.resolve(__dirname, '.env');
const envExamplePath = path.resolve(__dirname, '.env.example');

// Generate a secure random encryption key (32 bytes = 256 bits)
const encryptionKey = crypto.randomBytes(32).toString('hex').substring(0, 32);
console.log('Generated encryption key:', encryptionKey);

try {
  // Load existing env variables
  const envConfig = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
  
  // Update or add ENCRYPTION_KEY
  envConfig.ENCRYPTION_KEY = encryptionKey;
  
  // Write updated env variables back to .env file
  const envContent = Object.entries(envConfig)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, envContent);
  console.log('.env file updated with new encryption key');
  
  // Also update .env.example if it exists (without the actual key)
  if (fs.existsSync(envExamplePath)) {
    const envExampleConfig = dotenv.parse(fs.readFileSync(envExamplePath));
    envExampleConfig.ENCRYPTION_KEY = 'your-32-character-encryption-key';
    
    const envExampleContent = Object.entries(envExampleConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envExamplePath, envExampleContent);
    console.log('.env.example file updated');
  }
} catch (error) {
  console.error('Error updating .env file:', error);
  console.log('Please manually add the following to your .env file:');
  console.log(`ENCRYPTION_KEY=${encryptionKey}`);
}
