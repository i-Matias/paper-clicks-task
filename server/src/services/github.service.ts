import axios from "axios";
import { config } from "../config/auth.config";
import { GitHubUser } from "../types/auth.types";
import { AppError } from "../middleware/error.middleware";
import { githubApiRequest } from "../utils/github-api";

interface GithubTokenResponse {
  access_token: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

const getAccessToken = async (code: string): Promise<GithubTokenResponse> => {
  try {
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: config.github.clientId,
        client_secret: config.github.clientSecret,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.data.access_token) {
      throw new AppError("Failed to retrieve access token from GitHub", 400);
    }

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
      scope: response.data.scope,
      token_type: response.data.token_type,
    };
  } catch (error) {
    console.error("Error getting GitHub access token:", error);
    throw new Error("Failed to get access token from GitHub");
  }
};

const getUserData = async (accessToken: string): Promise<GitHubUser> => {
  try {
    const userResponse: any = await githubApiRequest(
      "https://api.github.com/user",
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );

    let email = userResponse.email;
    if (!email) {
      const emailsResponse: any = await githubApiRequest(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );
      // Get the primary email
      const primaryEmail = emailsResponse.find((item: any) => item.primary);
      if (primaryEmail) {
        email = primaryEmail.email;
      } else if (emailsResponse.length > 0) {
        email = emailsResponse[0].email;
      }
    }

    return {
      id: userResponse.id,
      login: userResponse.login,
      avatar_url: userResponse.avatar_url,
      displayName: userResponse.name,
      name: userResponse.login,
      email: email,
      created_at: userResponse.created_at,
      updated_at: userResponse.updated_at,
    };
  } catch (error) {
    console.error("Error fetching GitHub user data:", error);
    throw new Error("Failed to fetch user data from GitHub");
  }
};

const getStarredRepositories = async (accessToken: string): Promise<any[]> => {
  try {
    const { githubApiRequest } = require("../utils/github-api");

    // Initialize an array to hold all repositories
    let allRepositories: any[] = [];
    let page = 1;
    let hasMorePages = true;
    const perPage = 100;

    while (hasMorePages) {
      const response = await githubApiRequest(
        "https://api.github.com/user/starred",
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
          params: {
            per_page: perPage,
            page: page,
          },
        }
      );

      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMorePages = false;
        break;
      }

      allRepositories = [...allRepositories, ...response];

      if (response.length < perPage) {
        hasMorePages = false;
      } else {
        page++;
      }
    }

    console.log("Total Starred Repositories Count:", allRepositories.length);

    return allRepositories;
  } catch (error) {
    throw new AppError("Failed to fetch starred repositories from GitHub", 500);
  }
};

export default {
  getAccessToken,
  getUserData,
  getStarredRepositories,
};
