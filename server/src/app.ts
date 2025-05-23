import express from "express";
import cors from "cors";
import passport from "passport";
import dotenv from "dotenv";
import authRouter from "./routers/authRouter";
import { configurePassport } from "./config/passport";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // Frontend URL
    credentials: true,
  })
);

// Initialize Passport for GitHub OAuth (without sessions)
configurePassport();
app.use(passport.initialize());

// API Routes
app.use("/api/auth", authRouter);

// Health check route
app.get("/health", (_, res) => {
  res.status(200).json({ status: "ok" });
});

// Handle 404s
app.use((_, res) => {
  res.status(404).json({ error: "Not found" });
});

export default app;
