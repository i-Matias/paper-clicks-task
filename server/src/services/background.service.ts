import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import RepositoryService from "./repository.service";
import TokenService from "./token.service";
import * as nodeCron from "node-cron";
import { AppError } from "../middleware/error.middleware";

const syncAllUsersCommitCounts = async () => {
  try {
    console.log(
      "Starting background commit count sync for all starred repositories (from repository creation or last sync until today)"
    );

    const users = await withPrisma(async () => {
      return prisma.user.findMany({
        include: {
          token: true,
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

          console.log(
            `Updating starred repositories for user: ${user.username} during scheduled job`
          );
          await RepositoryService.saveStarredRepositories(user.id, accessToken);

          console.log(`Updating commit counts for user: ${user.username}`);
          await RepositoryService.updateDailyCommitCounts(accessToken, user.id);

          console.log(
            `Successfully updated starred repos and daily commit activity for user: ${user.username}`
          );
        } catch (tokenError: any) {
          console.error(
            `Token error for user ${user.username}: ${tokenError.message}`
          );

          if (
            tokenError.message.includes("reauthenticate") ||
            tokenError.message.includes("expired")
          ) {
            console.log(
              `Marking user ${user.username} for re-authentication notification`
            );
          }
        }

        console.log(`Completed processing for user: ${user.username}`);
      } catch (error) {
        console.error(`Error processing user ${user.username}:`, error);
        throw new AppError(
          `Failed to process user ${user.username} during background sync`,
          500
        );
      }
    }

    console.log("Completed background commit count sync");
  } catch (error) {
    console.error("Background commit count sync failed:", error);
    throw new AppError("Failed to sync commit counts for all users", 500);
  }
};

const startBackgroundJobs = () => {
  nodeCron.schedule("*/5 * * * *", () => {
    // each 5 min just for testing
    console.log("Running scheduled commit count sync job");
    syncAllUsersCommitCounts();
  });
  console.log("Cron job for commit count sync scheduled successfully");
};

export default {
  startBackgroundJobs,
};
