import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import { GitHubUser } from "../types/types";
import TokenService from "./token.service";
import { AppError } from "../middleware/error.middleware";

const upsertUser = async (githubUser: GitHubUser) => {
  return withPrisma(async () => {
    return prisma.user.upsert({
      where: {
        githubId: githubUser.id.toString(),
      },
      update: {
        username: githubUser.login,
        name: githubUser.displayName,
        email: githubUser.email,
        updatedAt: new Date(),
        avatarUrl: githubUser.avatar_url,
        createdAt: githubUser.created_at,
      },
      create: {
        githubId: githubUser.id.toString(),
        username: githubUser.login,
        name: githubUser.displayName,
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

const storeUserToken = async (
  userId: string,
  accessToken: string,
  expiresIn: number = 8 * 60 * 60
) => {
  if (!accessToken) {
    throw new AppError("Access token is required", 401);
  }

  return TokenService.saveToken(userId, accessToken, expiresIn);
};

export default {
  upsertUser,
  findById,
  findByGithubId,
  storeUserToken,
};
