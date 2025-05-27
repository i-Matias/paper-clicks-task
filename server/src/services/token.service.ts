import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import { encrypt, decrypt } from "../utils/encryption";
import { AppError } from "../middleware/error.middleware";

const saveToken = async (
  userId: string,
  accessToken: string,
  expiresIn: number = 8 * 60 * 60
) => {
  return withPrisma(async () => {
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

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
    const tokenRecord = await prisma.token.findUnique({
      where: {
        userId,
      },
    });

    if (!tokenRecord) {
      throw new AppError("No token found for user", 401);
    }

    const now = new Date();

    if (tokenRecord.expiresAt < now) {
      throw new AppError("Token has expired", 401);
    }

    return decrypt(tokenRecord.accessToken);
  });
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
  deleteUserTokens,
};
