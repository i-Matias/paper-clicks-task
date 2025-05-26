import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import RepositoryService from "./repository.service";
import TokenService from "./token.service";
import * as nodeCron from "node-cron";

const syncAllUsersCommitCounts = async () => {
  try {
    console.log(
      "Starting background commit count sync for all starred repositories (looking back 6 months)"
    );

    const users = await withPrisma(async () => {
      return prisma.user.findMany({
        where: {
          tokens: {
            some: {}, // Only users who have tokens
          },
        },
        include: {
          tokens: {
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
          starredRepositories: true,
        },
      });
    });

    console.log(`Found ${users.length} users with GitHub tokens`);

    for (const user of users) {
      try {
        console.log(
          `Processing user: ${user.username} with ${user.starredRepositories.length} repositories`
        );

        try {
          const accessToken = await TokenService.getValidToken(user.id);

          await RepositoryService.saveStarredRepositories(user.id, accessToken);

          await RepositoryService.updateDailyCommitCounts(accessToken, user.id);

          console.log(
            `Successfully updated starred repos and daily commit activity for user: ${user.username}`
          );
        } catch (tokenError: any) {
          console.error(
            `Token error for user ${user.username}: ${tokenError.message}`
          );
        }

        console.log(`Completed processing for user: ${user.username}`);
      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
      }
    }

    console.log("Completed background commit count sync");
  } catch (error) {
    console.error("Background commit count sync failed:", error);
  }
};

const startBackgroundJobs = () => {
  nodeCron.schedule("0 0 * * *", () => {
    console.log("Running scheduled commit count sync job");
    syncAllUsersCommitCounts();
  });
  console.log("Cron job for commit count sync scheduled successfully");
};

export default {
  startBackgroundJobs,
};
