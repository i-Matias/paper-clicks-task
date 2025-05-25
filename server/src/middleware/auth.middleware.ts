import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1]; // Extract token from 'Bearer <token>'

    if (!token) {
      res.status(401).json({ error: "Invalid token format" });
      return;
    }

    const userPayload = verifyToken(token);

    if (!userPayload) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }

    // Attach user to request object for use in protected routes
    req.user = {
      id: userPayload.id,
      email: userPayload.email,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};
