import APIClient from "./apiClient";

interface GithubLoginResponse {
  url: string;
}

interface GithubCallbackResponse {
  user: User;
  tokens: {
    accessToken: string;
    expiresIn: number;
  };
  githubToken: string;
}

export interface User {
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

class AuthService {
  private loginClient = new APIClient<GithubLoginResponse>(
    "/api/auth/github/login"
  );
  private callbackClient = new APIClient<GithubCallbackResponse>(
    "/api/auth/github/callback"
  );
  private profileClient = new APIClient<{ user: User }>("/api/auth/me");

  getLoginUrl = async () => {
    try {
      return await this.loginClient.get();
    } catch (error) {
      console.error("Error fetching login URL:", error);
      throw new Error(`Failed to fetch login URL. Error: ${error}`);
    }
  };

  handleCallback = async (code: string, state?: string) => {
    try {
      const response = await this.callbackClient.get({
        params: {
          code,
          state,
        },
      });
      return response;
    } catch (error) {
      console.error("Error handling callback:", error);

      if (error instanceof Error) {
        if (error.message.includes("invalid_grant")) {
          throw new Error(
            "GitHub authorization code has expired or is invalid. Please try logging in again."
          );
        } else if (error.message.includes("bad_verification_code")) {
          throw new Error(
            "GitHub returned an invalid verification code. Please try logging in again."
          );
        }
      }

      throw new Error("Failed to authenticate with GitHub. Please try again.");
    }
  };

  getCurrentUser = async (): Promise<User> => {
    try {
      const response = await this.profileClient.get();
      if (response && response.user) {
        return response.user;
      }
      throw new Error("No user data returned from server");
    } catch (error) {
      console.error("Error fetching current user:", error);

      if (error instanceof Error) {
        if (
          error.message.includes("session has expired") ||
          error.message.includes("Unauthorized")
        ) {
          throw new Error("Your session has expired. Please log in again.");
        }
      }

      throw new Error(
        "Failed to fetch your profile information. Please try logging in again."
      );
    }
  };
}

export default new AuthService();
