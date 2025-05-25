import APIClient from "../react-query/apiClient";

interface GithubLoginResponse {
  url: string;
}

interface GithubCallbackResponse {
  user: User;
  tokens: {
    accessToken: string;
    expiresIn: number;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
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

  handleCallback = async (code: string) => {
    try {
      const response = await this.callbackClient.get({ params: { code } });
      return response;
    } catch (error) {
      console.error("Error handling callback:", error);
      throw new Error(`Failed to handle callback. Error: ${error}`);
    }
  };

  getCurrentUser = async () => {
    try {
      const response = await this.profileClient.get();
      if (response && response.user) {
        return response.user;
      }
      throw new Error("No user data returned from server");
    } catch (error) {
      console.error("Error fetching current user:", error);
      throw new Error(`Failed to fetch current user. Error: ${error}`);
    }
  };
}

export default new AuthService();
