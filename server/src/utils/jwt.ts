import jwt from "jsonwebtoken";
import { config } from "../config/auth.config";
import { UserPayload } from "../types/types";

export const generateToken = (
  user: UserPayload
): { accessToken: string; expiresIn: number } => {
  const expiresIn = config.jwt.expiresIn;

  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    config.jwt.secret,
    { expiresIn }
  );

  return {
    accessToken,
    expiresIn,
  };
};

export const verifyToken = (token: string): UserPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as UserPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
