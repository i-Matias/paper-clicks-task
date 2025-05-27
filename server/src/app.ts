import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import session from "express-session";
import authRoutes from "./routes/auth.routes";
import repositoryRoutes from "./routes/repository.routes";
import { validateConfig, config } from "./config/auth.config";
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

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(
  session({
    secret: config.session.secret,
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax", 
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.log(`Incoming request: ${req.method} ${req.path}`);
    console.log(`Origin: ${req.headers.origin}`);
    next();
  }
);

app.use("/api/auth", authRoutes);
app.use("/api/repositories", repositoryRoutes);

app.use(errorHandler);

export default app;
