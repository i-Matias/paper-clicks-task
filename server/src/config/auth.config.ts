import dotenv from "dotenv";

dotenv.config();

export const config = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    callbackUrl: `http://localhost:5001/api/auth/github/callback`,
    scope: "user:email",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "super-secret-key",
    expiresIn: 60 * 60 * 24 * 7,
  },
  server: {
    port: process.env.PORT || 5001,
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  },
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
};

export const validateConfig = () => {
  if (!config.github.clientId) {
    console.error("Missing GITHUB_CLIENT_ID environment variable");
    process.exit(1);
  }
  if (!config.github.clientSecret) {
    console.error("Missing GITHUB_CLIENT_SECRET environment variable");
    process.exit(1);
  }
  if (!config.jwt.secret) {
    console.error("Missing JWT_SECRET environment variable");
    process.exit(1);
  }
};
