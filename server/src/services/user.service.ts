import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import { GitHubUser } from "../types/auth.types";
import TokenService from "./token.service";

const upsertUser = async (githubUser: GitHubUser) => {
  return withPrisma(async () => {
    return prisma.user.upsert({
      where: {
        githubId: githubUser.id.toString(),
      },
      update: {
        username: githubUser.login,
        email: githubUser.email,
        updatedAt: new Date(),
        avatarUrl: githubUser.avatar_url,
        createdAt: githubUser.created_at,
      },
      create: {
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        createdAt: githubUser.created_at,
      },
    });
  });
};

const findById = async (id: string) => {
  return withPrisma(async () => {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  });
};

const findByGithubId = async (githubId: string) => {
  return withPrisma(async () => {
    return prisma.user.findUnique({
      where: {
        githubId,
      },
    });
  });
};

/**
 * Stores a GitHub access token for a user
 * @param userId The user's ID
 * @param accessToken The GitHub access token
 */
const storeUserToken = async (userId: string, accessToken: string) => {
  if (!accessToken) {
    throw new Error("Access token is required");
  }

  // GitHub's standard OAuth tokens don't expire by default
  // Setting a default expiration of 8 hours
  const expiresIn = 8 * 60 * 60;

  return TokenService.saveToken(userId, accessToken, expiresIn);
};

export default {
  upsertUser,
  findById,
  findByGithubId,
  storeUserToken,
};
