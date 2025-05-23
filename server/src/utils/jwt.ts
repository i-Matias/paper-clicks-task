import jwt from "jsonwebtoken";
import { User } from "@prisma/client";

// Define the payload structure
interface JwtPayload {
  userId: string;
  githubId: string;
  username: string;
}

export const jwtUtils = {
  /**
   * Generate a JWT token for a user
   */
  generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user.id,
      githubId: user.githubId,
      username: user.username,
    };

    return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
      expiresIn: "7d",
    });
  },

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      ) as JwtPayload;
    } catch (error) {
      console.error("JWT verification failed:", error);
      return null;
    }
  },
};
