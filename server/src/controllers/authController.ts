import { Request, Response } from "express";
import { User } from "@prisma/client";
import { authService } from "../services/authService";
import { jwtUtils } from "../utils/jwt";
import axios from "axios";
import catchAsync from "../utils/catchAsnyc";

export const githubCallback = catchAsync(
  async (req: Request, res: Response) => {
    const user = req.user as User;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const token = jwtUtils.generateToken(user);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    res.redirect(`${clientUrl}/auth/callback?token=${token}`);
  }
);
