import { Request, Response } from "express";
import RepositoryService from "../services/repository.service";
import TokenService from "../services/token.service";
import catchAsync from "../utils/catchAsnyc";

const getStarredRepositories = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "User ID not found in token" });
      return;
    }

    try {
      const accessToken = await TokenService.getValidToken(userId);

      // First, fetch from GitHub and save to DB (this will handle removing unstarred repos)
      await RepositoryService.saveStarredRepositories(userId, accessToken);

      // Then, get the updated list from DB
      const repositories = await RepositoryService.getStarredRepositories(
        userId
      );

      // Also trigger a background sync of commit data
      RepositoryService.updateCommitCounts(accessToken, userId).catch(
        (syncError) => {
          console.error("Background commit sync error:", syncError);
        }
      );

      res.status(200).json({
        repositories,
      });
    } catch (error: any) {
      if (
        error.message.includes("Token expired") ||
        error.message.includes("No token found")
      ) {
        res.status(401).json({
          error: "GitHub token expired or not found",
          reauthorize: true,
          authUrl: `/api/auth/github/login`,
        });
      } else {
        throw error;
      }
    }
  }
);

const syncCommitCounts = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "User ID not found in token" });
    return;
  }

  try {
    const accessToken = await TokenService.getValidToken(userId);

    const results = await RepositoryService.updateCommitCounts(accessToken);

    res.status(200).json({
      message: "Commit counts updated successfully",
      results,
    });
  } catch (error: any) {
    if (
      error.message.includes("Token expired") ||
      error.message.includes("No token found")
    ) {
      res.status(401).json({
        error: "GitHub token expired or not found",
        reauthorize: true,
        authUrl: `/api/auth/github/login`,
      });
    } else {
      throw error;
    }
  }
});

const saveStarredRepositoriesToDB = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: "User ID not found in token" });
      return;
    }

    try {
      const accessToken = await TokenService.getValidToken(userId);

      // Save repositories to database
      const savedRepositories = await RepositoryService.saveStarredRepositories(
        userId,
        accessToken
      );

      res.status(200).json({
        message: "Starred repositories saved successfully",
        count: savedRepositories.length,
      });
    } catch (error: any) {
      if (
        error.message.includes("Token expired") ||
        error.message.includes("No token found")
      ) {
        res.status(401).json({
          error: "GitHub token expired or not found",
          reauthorize: true,
          authUrl: `/api/auth/github/login`,
        });
      } else {
        throw error;
      }
    }
  }
);

export default {
  getStarredRepositories,
  syncCommitCounts,
  saveStarredRepositoriesToDB,
};
