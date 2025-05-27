import { Request, Response } from "express";
import { generateToken } from "../utils/jwt";
import catchAsync from "../utils/catchAsync";
import { config } from "../config/auth.config";
import GithubService from "../services/github.service";
import UserService from "../services/user.service";
import RepositoryService from "../services/repository.service";
import { generateState, validateState } from "../utils/csrf-protection";

const githubCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || typeof code !== "string") {
    res.status(400).json({ error: "Authorization code is required" });
    return;
  }

  console.log(`Callback received with state: ${state}`);
  console.log(`Session ID: ${req.sessionID}`);
  console.log(`Session oauthState: ${req.session.oauthState}`);

  if (!validateState(req.session.oauthState, state as string)) {
    console.log(
      `State validation failed: received=${state}, stored=${req.session.oauthState}`
    );
    res
      .status(400)
      .json({ error: "Invalid state parameter. Possible CSRF attack." });
    return;
  }

  req.session.oauthState = undefined;

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

  console.log(`Saving starred repositories for user ${user.id} during login`);
  await RepositoryService.saveStarredRepositories(
    user.id,
    tokenResponse.access_token
  );

  const tokens = generateToken({ id: user.id, email: user.email });

  res.status(200).json({
    user: {
      username: user.username,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
    tokens,
  });
});

const getLoginUrl = catchAsync(async (req: Request, res: Response) => {
  const state = generateState();

  if (!req.session) {
    console.error("No session object available");
    res.status(500).json({ error: "Session initialization failed" });
    return;
  }

  req.session.oauthState = state;

  console.log(`Session created with oauthState: ${state}`);
  console.log(`Session ID: ${req.sessionID}`);

  req.session.save((err) => {
    if (err) {
      console.error("Failed to save session:", err);
    }
  });

  const redirectUri = `${config.frontendUrl}/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${
    config.github.clientId
  }&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${
    config.github.scope
  }&state=${state}`;

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
