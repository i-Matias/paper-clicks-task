import prisma from "../lib/prisma";
import { withPrisma } from "../lib/db-utils";
import GithubService from "./github.service";
import { AppError } from "../middleware/error.middleware";
import { DailyCommitCount, RepoData } from "../types/types";

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

    const startDate = since ? new Date(since) : null;

    console.log(
      `Fetching commits for ${repoFullName} from ${
        startDate ? startDate.toISOString() : "repository creation"
      } to ${endDate.toISOString()}`
    );

    const params: Record<string, string> = {
      per_page: "100",
      until: endDate.toISOString(),
    };

    if (startDate) {
      params.since = startDate.toISOString();
    }

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
    const whereClause = userId ? { where: { userId } } : undefined;
    const repositories = await prisma.starredRepository.findMany(whereClause);

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

    const today = new Date();
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    let totalCommitsTracked = 0;

    for (const repo of repositories) {
      try {
        console.log(`Fetching daily commit activity for ${repo.fullName}`);

        let startDate: string | undefined;

        const latestCommit = await prisma.commitCount.findFirst({
          where: {
            repositoryId: repo.id,
          },
          orderBy: {
            date: "desc",
          },
        });

        if (latestCommit) {
          const latestCommitDate = new Date(latestCommit.date);
          latestCommitDate.setDate(latestCommitDate.getDate() + 1);
          startDate = latestCommitDate.toISOString();
          console.log(
            `Found existing commit data for ${repo.name}, starting from ${startDate}`
          );
        } else {
          console.log(
            `No existing commit data for ${repo.name}, fetching from repository creation`
          );
        }

        const dailyCommits = await fetchCommitsByDate(
          accessToken,
          repo.fullName,
          startDate,
          today.toISOString()
        );

        if (dailyCommits.length === 0) {
          const message = latestCommit
            ? `No new commits found since ${
                new Date(latestCommit.date).toISOString().split("T")[0]
              } for ${repo.name}`
            : `No commits found for ${repo.name}`;
          console.log(message);
          results.push({
            repository: repo.name,
            commitsTracked: 0,
            message: latestCommit ? "No new commits found" : "No commits found",
          });
          continue;
        }

        console.log(
          `Found commit activity on ${dailyCommits.length} different days for ${repo.name}`
        );
        let repoCommitsAdded = 0;

        for (const dailyCommit of dailyCommits) {
          const commitDate = new Date(dailyCommit.date);

          const existingCount = await prisma.commitCount.findFirst({
            where: {
              repositoryId: repo.id,
              date: {
                equals: commitDate,
              },
            },
          });

          if (existingCount) {
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
};
