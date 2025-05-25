import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import { validateConfig } from "./config/auth.config";
import { errorHandler } from "./middleware/error.middleware";

dotenv.config();

validateConfig();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(express.json());

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`Incoming request: ${req.method} ${req.path}`);
    console.log(`Origin: ${req.headers.origin}`);
    next();
  }
);

app.use("/api/auth", authRoutes);

app.use(errorHandler);

export default app;
