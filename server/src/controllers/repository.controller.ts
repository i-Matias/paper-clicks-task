import { Request, Response } from "express";
import RepositoryService from "../services/repository.service";
import TokenService from "../services/token.service";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../middleware/error.middleware";

const getStarredRepositories = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const accessToken = await TokenService.getValidToken(userId);

    await RepositoryService.saveStarredRepositories(userId, accessToken);

    const repositories = await RepositoryService.getStarredRepositories(userId);

    RepositoryService.updateCommitCounts(accessToken, userId).catch(
      (syncError) => {
        console.error("Background commit sync error:", syncError);
      }
    );

    res.status(200).json({ repositories });
  }
);

export default {
  getStarredRepositories,
};
