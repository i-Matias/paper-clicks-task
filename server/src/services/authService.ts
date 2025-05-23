import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";

const prisma = new PrismaClient();

export interface UserProfile {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
}

export const authService = {
  /**
   * Get a user by ID
   */
  async getUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  },

  /**
   * Get a user by GitHub ID
   */
  async getUserByGithubId(githubId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { githubId },
    });
  },

  /**
   * Create a user profile object with safe properties to return to client
   */
  createUserProfile(user: User): UserProfile {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };
  },

  /**
   * Update user with fresh data from GitHub
   */
  async updateUser(
    id: string,
    data: Partial<Omit<User, "id" | "createdAt" | "updatedAt">>
  ): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  },
};
