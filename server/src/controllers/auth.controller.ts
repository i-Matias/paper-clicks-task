import { Request, Response } from "express";
import { generateToken } from "../utils/jwt";
import catchAsync from "../utils/catchAsync";
import { config } from "../config/auth.config";
import GithubService from "../services/github.service";
import UserService from "../services/user.service";

const githubCallback = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  const tokenResponse = await GithubService.getAccessToken(code);
  const githubUser = await GithubService.getUserData(
    tokenResponse.access_token
  );
  const user = await UserService.upsertUser(githubUser);

  await UserService.storeUserToken(
    user.id,
    tokenResponse.access_token,
    tokenResponse.expires_in
  );

  const tokens = generateToken({ id: user.id, email: user.email });

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
  });
});

const getLoginUrl = catchAsync(async (_req: Request, res: Response) => {
  const redirectUri = `${config.frontendUrl}/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${
    config.github.clientId
  }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${
    config.github.scope
  }`;

  res.status(200).json({ url: githubAuthUrl });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await UserService.findById(req.user.id);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.status(200).json({ user });
});

export default { githubCallback, getLoginUrl, getMe };
