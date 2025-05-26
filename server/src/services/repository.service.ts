import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import GithubService from "./github.service";
import axios from "axios";

interface RepoData {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
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

interface DailyCommitCount {
  date: string;
  count: number;
}

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
            const dateKey = commitDate.toISOString().split("T")[0]; // YYYY-MM-DD format

            // Increment count for this date
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
    console.error(`Error fetching commits by date for ${repoFullName}:`, error);
    return [];
  }
};

const fetchCommitCount = async (
  accessToken: string,
  repoFullName: string
): Promise<number> => {
  try {
    const commitsUrl = `https://api.github.com/repos/${repoFullName}/commits`;

    // Make first request with per_page=1 to get headers
    const response = await axios(commitsUrl, {
      headers: {
        Authorization: `token ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      params: {
        per_page: 1,
      },
      validateStatus: (status: number) => {
        return (status >= 200 && status < 300) || status === 404;
      },
    });

    if (!response || response.status === 404) {
      console.log(`Repository ${repoFullName} not found or inaccessible`);
      return 0;
    }

    const linkHeader = response.headers?.link;

    if (linkHeader) {
      const match = linkHeader.match(/page=(\d+)>; rel="last"/);
      if (match && match[1]) {
        const totalPages = parseInt(match[1], 10);
        console.log(
          `Repository ${repoFullName} has approximately ${totalPages} commits (from pagination)`
        );
        return totalPages;
      }
    }

    try {
      const moreCommitsResponse = await axios(commitsUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
        params: {
          per_page: 100,
        },
        validateStatus: (status: number) => {
          return (status >= 200 && status < 300) || status === 404;
        },
      });

      if (!moreCommitsResponse.data) {
        return 0;
      }

      if (Array.isArray(moreCommitsResponse.data)) {
        if (moreCommitsResponse.data.length === 100) {
          const moreLinksHeader = moreCommitsResponse.headers?.link;

          if (moreLinksHeader) {
            const match = moreLinksHeader.match(/page=(\d+)>; rel="last"/);
            if (match && match[1]) {
              const lastPage = parseInt(match[1], 10);
              console.log(
                `Repository ${repoFullName} has approximately ${
                  lastPage * 100
                } commits (from pagination)`
              );
              return lastPage * 100;
            }
          }

          console.log(`Repository ${repoFullName} has at least 100 commits`);
          return 100;
        }

        console.log(
          `Repository ${repoFullName} has ${moreCommitsResponse.data.length} commits`
        );
        return moreCommitsResponse.data.length;
      }
    } catch (innerError) {
      console.error(
        `Error fetching more commits for ${repoFullName}:`,
        innerError
      );
    }

    if (Array.isArray(response.data)) {
      const count = response.data.length > 0 ? 1 : 0;
      console.log(
        `Repository ${repoFullName} has at least ${count} commit (fallback)`
      );
      return count;
    }

    return 0;
  } catch (error) {
    console.error(`Error fetching commit count for ${repoFullName}:`, error);
    return 0;
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

const updateCommitCounts = async (accessToken: string, userId?: string) => {
  console.log(
    "Using updateDailyCommitCounts instead of the old updateCommitCounts"
  );
  return updateDailyCommitCounts(accessToken, userId);
};

const getStarredRepositoriesDirectly = async (
  userId: string,
  accessToken: string
) => {
  try {
    const starredRepos = await GithubService.getStarredRepositories(
      accessToken
    );

    const commitCountsMap = new Map();

    const existingRepos = await prisma.starredRepository.findMany({
      where: { userId },
      include: {
        commitCounts: {
          orderBy: {
            date: "desc",
          },
        },
      },
    });

    const repoMap = new Map();
    existingRepos.forEach((repo) => {
      repoMap.set(repo.repoId, repo);
    });

    const enrichedRepos = starredRepos.map((ghRepo) => {
      const repoId = ghRepo.id.toString();
      const existingRepo = repoMap.get(repoId);

      return {
        id: existingRepo?.id || `temp-${repoId}`,
        repoId: repoId,
        name: ghRepo.name,
        fullName: ghRepo.full_name,
        description: ghRepo.description || null,
        url: ghRepo.html_url,
        userId,
        createdAt: existingRepo?.createdAt || new Date(),
        updatedAt: new Date(),
        commitCounts: existingRepo?.commitCounts || [],
      };
    });

    return enrichedRepos;
  } catch (error) {
    console.error("Error fetching starred repositories directly:", error);
    throw error;
  }
};

export default {
  saveStarredRepositories,
  getStarredRepositories,
  updateCommitCounts,
  fetchCommitCount,
  updateDailyCommitCounts,
  fetchCommitsByDate,
  getStarredRepositoriesDirectly,
};
