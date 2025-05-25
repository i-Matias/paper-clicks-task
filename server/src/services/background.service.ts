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

    // Get all users who have tokens (so we can access their GitHub data)
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
              createdAt: "desc", // Get the most recent token
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
          // Get valid token for user from our token service
          const accessToken = await TokenService.getValidToken(user.id);

          // First, ensure we have the latest starred repositories for this user
          await RepositoryService.saveStarredRepositories(user.id, accessToken);

          // Then update daily commit counts for this user's repositories for the past 6 months
          await RepositoryService.updateDailyCommitCounts(accessToken, user.id);

          console.log(
            `Successfully updated starred repos and daily commit activity for user: ${user.username}`
          );
        } catch (tokenError: any) {
          // Handle token errors gracefully
          console.error(
            `Token error for user ${user.username}: ${tokenError.message}`
          );
          // You could implement notification logic here to inform users their token has expired
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

// Schedule the background job using cron
const startBackgroundJobs = () => {
  // Run immediately once on startup
  syncAllUsersCommitCounts();

  // Then schedule to run daily at midnight (0 0 * * *)
  nodeCron.schedule("0 0 * * *", () => {
    console.log("Running scheduled commit count sync job");
    syncAllUsersCommitCounts();
  });

  console.log("Cron job for commit count sync scheduled successfully");
};

export default {
  startBackgroundJobs,
  syncAllUsersCommitCounts,
};
