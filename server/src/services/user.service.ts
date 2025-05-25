import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import { GitHubUser } from "../types/auth.types";

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

export default {
  upsertUser,
  findById,
  findByGithubId,
};
