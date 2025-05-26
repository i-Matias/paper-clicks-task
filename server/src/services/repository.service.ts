import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import GithubService from "./github.service";
import axios from "axios";
import { AppError } from "../middleware/error.middleware";

interface RepoData {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
}
interface DailyCommitCount {
  date: string;
  count: number;
}

const saveStarredRepositories = async (userId: string, accessToken: string) => {
  return withPrisma(async () => {
    const starredRepos = await GithubService.getStarredRepositories(
      accessToken
    );

    const currentStarredRepoIds = new Set(
      starredRepos.map((repo) => repo.id.toString())
    );

    const existingRepos = await prisma.starredRepository.findMany({
      where: { userId },
      select: { id: true, repoId: true },
    });

    const reposToRemove = existingRepos.filter(
      (repo) => !currentStarredRepoIds.has(repo.repoId)
    );

    if (reposToRemove.length > 0) {
      console.log(
        `Removing ${reposToRemove.length} un-starred repositories for user ${userId}`
      );
      await prisma.starredRepository.deleteMany({
        where: {
          id: {
            in: reposToRemove.map((repo) => repo.id),
          },
        },
      });
    }

    const savedRepos = [];

    for (const repo of starredRepos) {
      const repoData: RepoData = repo;

      const savedRepo = await prisma.starredRepository.upsert({
        where: {
          repoId: repoData.id.toString(),
        },
        update: {
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description || null,
          url: repoData.html_url,
          updatedAt: new Date(),
        },
        create: {
          repoId: repoData.id.toString(),
          name: repoData.name,
          fullName: repoData.full_name,
          description: repoData.description || null,
          url: repoData.html_url,
          userId: userId,
        },
      });

      savedRepos.push(savedRepo);
    }

    return savedRepos;
  });
};

const getStarredRepositories = async (userId: string) => {
  return withPrisma(async () => {
    return prisma.starredRepository.findMany({
      where: {
        userId: userId,
      },
      include: {
        commitCounts: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });
  });
};

const fetchCommitsByDate = async (
  accessToken: string,
  repoFullName: string,
  since?: string,
  until?: string
): Promise<DailyCommitCount[]> => {
  try {
    const axios = require("axios");

    const commitsUrl = `https://api.github.com/repos/${repoFullName}/commits`;

    const endDate = until ? new Date(until) : new Date();
    const startDate = since
      ? new Date(since)
      : new Date(endDate.getTime() - 180 * 24 * 60 * 60 * 1000);

    console.log(
      `Fetching commits for ${repoFullName} from ${startDate.toISOString()} to ${endDate.toISOString()}`
    );

    const params: Record<string, string> = {
      per_page: "100",
      since: startDate.toISOString(),
      until: endDate.toISOString(),
    };

    const dailyCommits = new Map<string, number>();
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      try {
        const response = await axios(commitsUrl, {
          headers: {
            Authorization: `token ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
          params: {
            ...params,
            page: page.toString(),
          },
          validateStatus: (status: number) => {
            return (status >= 200 && status < 300) || status === 404;
          },
        });

        if (
          !response ||
          response.status === 404 ||
          !Array.isArray(response.data) ||
          response.data.length === 0
        ) {
          hasMorePages = false;
          break;
        }

        for (const commit of response.data) {
          if (commit?.commit?.author?.date) {
            const commitDate = new Date(commit.commit.author.date);
            const dateKey = commitDate.toISOString().split("T")[0];

            const currentCount = dailyCommits.get(dateKey) || 0;
            dailyCommits.set(dateKey, currentCount + 1);
          }
        }

        const linkHeader = response.headers?.link;
        if (
          !linkHeader ||
          !linkHeader.includes('rel="next"') ||
          response.data.length < 100
        ) {
          hasMorePages = false;
        } else {
          page++;
        }
      } catch (pageError) {
        console.error(
          `Error fetching page ${page} of commits for ${repoFullName}:`,
          pageError
        );
        hasMorePages = false;
      }
    }

    const result: DailyCommitCount[] = Array.from(dailyCommits.entries()).map(
      ([date, count]) => ({ date, count })
    );

    console.log(
      `Found commits on ${result.length} different days for ${repoFullName}`
    );
    return result;
  } catch (error) {
    throw new AppError(
      `Error fetching commits for ${repoFullName}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      500
    );
  }
};

const updateDailyCommitCounts = async (
  accessToken: string,
  userId?: string
) => {
  return withPrisma(async () => {
    const query = userId ? { where: { userId } } : undefined;
    const repositories = await prisma.starredRepository.findMany(query);

    if (repositories.length === 0) {
      console.log(
        `No repositories found ${userId ? `for user ${userId}` : ""}`
      );
      return [];
    }

    console.log(
      `Updating daily commit counts for ${repositories.length} repositories${
        userId ? ` for user ${userId}` : ""
      }`
    );

    // Get the date 6 months ago to limit how far we look back
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let totalCommitsTracked = 0;

    for (const repo of repositories) {
      try {
        console.log(`Fetching daily commit activity for ${repo.fullName}`);

        const dailyCommits = await fetchCommitsByDate(
          accessToken,
          repo.fullName,
          sixMonthsAgo.toISOString(),
          today.toISOString()
        );

        if (dailyCommits.length === 0) {
          console.log(`No commits found in the last 6 months for ${repo.name}`);
          results.push({
            repository: repo.name,
            commitsTracked: 0,
            message: "No recent commits found",
          });
          continue;
        }

        console.log(
          `Found commit activity on ${dailyCommits.length} different days for ${repo.name}`
        );
        let repoCommitsAdded = 0;

        // Process each day's commits
        for (const dailyCommit of dailyCommits) {
          const commitDate = new Date(dailyCommit.date);

          // Check if we already have a commit count for this date
          const existingCount = await prisma.commitCount.findFirst({
            where: {
              repositoryId: repo.id,
              date: {
                // Match the exact date
                equals: commitDate,
              },
            },
          });

          if (existingCount) {
            // Update existing count if it exists and if the count is different
            if (existingCount.count !== dailyCommit.count) {
              await prisma.commitCount.update({
                where: { id: existingCount.id },
                data: {
                  count: dailyCommit.count,
                },
              });
              console.log(
                `Updated commit count for ${repo.name} on ${dailyCommit.date}: ${dailyCommit.count}`
              );
              repoCommitsAdded += dailyCommit.count;
            }
          } else {
            // Create new count if none exists for this date
            await prisma.commitCount.create({
              data: {
                count: dailyCommit.count,
                date: commitDate,
                repositoryId: repo.id,
              },
            });
            console.log(
              `Recorded ${dailyCommit.count} commits for ${repo.name} on ${dailyCommit.date}`
            );
            repoCommitsAdded += dailyCommit.count;
          }
        }

        results.push({
          repository: repo.name,
          commitsTracked: repoCommitsAdded,
          daysWithActivity: dailyCommits.length,
        });

        totalCommitsTracked += repoCommitsAdded;
        successCount++;
      } catch (error) {
        console.error(`Failed to update commit count for ${repo.name}:`, error);
        errorCount++;

        // Don't break the entire process for one failed repository
        results.push({
          repository: repo.name,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    console.log(
      `Daily commit tracking completed: ${successCount} repositories successful, ${errorCount} failed, ${totalCommitsTracked} total commits tracked`
    );
    return results;
  });
};

export default {
  saveStarredRepositories,
  getStarredRepositories,
  updateDailyCommitCounts,
  fetchCommitsByDate,
};
