import { Request, Response, NextFunction } from "express";
import { jwtUtils } from "../utils/jwt";
import { authService } from "../services/authService";

export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwtUtils.verifyToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Get user from database
    const user = await authService.getUserById(payload.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Attach user object to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error("JWT authentication error:", error);
    res.status(401).json({
      success: false,
      message: "Authentication failed",
    });
  }
};
