import { Request, Response } from "express";
import { generateToken } from "../utils/jwt";
import catchAsync from "../utils/catchAsnyc";
import { config } from "../config/auth.config";
import GithubService from "../services/github.service";
import UserService from "../services/user.service";

const githubCallback = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  try {
    const accessToken = await GithubService.getAccessToken(code);

    const githubUser = await GithubService.getUserData(accessToken);

    const user = await UserService.upsertUser(githubUser);

    await UserService.storeUserToken(user.id, accessToken);

    const tokens = generateToken({
      id: user.id,
      email: user.email,
    });

    // Trigger repository sync in the background for this user
    // We don't want to block the login process, so we don't await this
    import("../services/repository.service")
      .then(({ default: RepositoryService }) => {
        // First save starred repos (handles adds/removals)
        RepositoryService.saveStarredRepositories(user.id, accessToken)
          .then(() => {
            // Then sync commit counts
            return RepositoryService.updateCommitCounts(accessToken, user.id);
          })
          .catch((error) => {
            console.error(`Error syncing data for user ${user.id}:`, error);
          });
      })
      .catch((error) => {
        console.error("Error importing repository service:", error);
      });

    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      tokens,
      githubToken: accessToken,
    });
  } catch (error: any) {
    console.error("Error in GitHub callback:", error);
    res.status(500).json({
      error: "Authentication failed",
      details: error.message || "Unknown error during authentication",
    });
  }
});

const getLoginUrl = catchAsync(async (_req: Request, res: Response) => {
  const redirectUri = `${config.frontendUrl}/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${
    config.github.clientId
  }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${
    config.github.scope
  }`;

  res.status(200).json({
    url: githubAuthUrl,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: "User ID not found in token" });
    return;
  }

  const user = await UserService.findById(userId);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

export default {
  githubCallback,
  getLoginUrl,
  getMe,
};
