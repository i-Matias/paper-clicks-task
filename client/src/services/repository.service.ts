import APIClient from "./apiClient";

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  createdAt: string;
  updatedAt: string | null;
  commitCounts: CommitCount[];
}

interface CommitCount {
  id: string;
  count: number;
  date: string;
}

// Using Record<string, unknown> to satisfy the return type
type SyncResult = Record<string, unknown>;

class RepositoryService {
  private starredReposClient = new APIClient<{ repositories: Repository[] }>(
    "/api/repositories/starred"
  );
  private syncCommitsClient = new APIClient<{
    message: string;
    results: SyncResult[];
  }>("/api/repositories/sync-commits");
  private saveStarredClient = new APIClient<{
    message: string;
    count: number;
  }>("/api/repositories/starred/save");

  getStarredRepositories = async (): Promise<Repository[]> => {
    try {
      const response = await this.starredReposClient.get();
      return response.repositories;
    } catch (error) {
      console.error("Error fetching starred repositories:", error);

      if (error instanceof Error) {
        if (error.message.includes("rate limit exceeded")) {
          throw new Error(
            "GitHub API rate limit exceeded. Please try again later."
          );
        } else if (error.message.includes("reauthorize GitHub access")) {
          throw error;
        } else if (error.message.includes("session has expired")) {
          throw new Error("Your session has expired. Please log in again.");
        }
      }

      throw new Error(
        "Failed to load your starred repositories. Please try again later."
      );
    }
  };

  syncCommitCounts = async (): Promise<{
    message: string;
    results: Record<string, unknown>[];
  }> => {
    try {
      return await this.syncCommitsClient.post();
    } catch (error) {
      console.error("Error syncing commit counts:", error);

      if (error instanceof Error) {
        if (error.message.includes("rate limit exceeded")) {
          throw new Error(
            "GitHub API rate limit exceeded. Please try again later."
          );
        } else if (error.message.includes("reauthorize GitHub access")) {
          throw error;
        } else if (error.message.includes("session has expired")) {
          throw new Error("Your session has expired. Please log in again.");
        }
      }

      throw new Error("Failed to sync commit counts. Please try again later.");
    }
  };

  saveStarredRepositories = async (): Promise<{
    message: string;
    count: number;
  }> => {
    try {
      return await this.saveStarredClient.post();
    } catch (error) {
      console.error("Error saving starred repositories:", error);

      if (error instanceof Error) {
        if (error.message.includes("rate limit exceeded")) {
          throw new Error(
            "GitHub API rate limit exceeded. Please try again later."
          );
        } else if (error.message.includes("reauthorize GitHub access")) {
          throw error;
        } else if (error.message.includes("session has expired")) {
          throw new Error("Your session has expired. Please log in again.");
        }
      }

      throw new Error(
        "Failed to save starred repositories to database. Please try again later."
      );
    }
  };
}

export default new RepositoryService();
