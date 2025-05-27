import { Request, Response } from "express";
import RepositoryService from "../services/repository.service";
import catchAsync from "../utils/catchAsync";
import { AppError } from "../middleware/error.middleware";

const getStarredRepositories = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const repositories = await RepositoryService.getStarredRepositories(userId);

    res.status(200).json({ repositories });
  }
);

export default {
  getStarredRepositories,
};
