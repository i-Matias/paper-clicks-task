import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import { encrypt, decrypt } from "../utils/encryption";

const saveToken = async (
  userId: string,
  accessToken: string,
  expiresIn: number = 8 * 60 * 60
) => {
  return withPrisma(async () => {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

    // Delete any existing tokens for this user
    await prisma.token.deleteMany({
      where: {
        userId,
      },
    });

    return prisma.token.create({
      data: {
        userId,
        accessToken: encrypt(accessToken),
        expiresAt,
      },
    });
  });
};

const getValidToken = async (userId: string): Promise<string> => {
  return withPrisma(async () => {
    const tokenRecord = await prisma.token.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!tokenRecord) {
      throw new Error("No token found for user");
    }

    // Check if token is about to expire (within 5 minutes)
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (tokenRecord.expiresAt < fiveMinutesFromNow) {
      // For GitHub, we'd need to reauthenticate the user
      // GitHub's standard OAuth tokens don't expire unless configured to
      throw new Error("Token expired, user needs to reauthenticate");
    }

    // Return decrypted token
    return decrypt(tokenRecord.accessToken);
  });
};

const hasValidToken = async (userId: string): Promise<boolean> => {
  try {
    await getValidToken(userId);
    return true;
  } catch (error) {
    return false;
  }
};

const deleteUserTokens = async (userId: string): Promise<void> => {
  return withPrisma(async () => {
    await prisma.token.deleteMany({
      where: {
        userId,
      },
    });
  });
};

export default {
  saveToken,
  getValidToken,
  hasValidToken,
  deleteUserTokens,
};
