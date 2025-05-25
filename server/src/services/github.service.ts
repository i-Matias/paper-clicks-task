import axios from "axios";
import { config } from "../config/auth.config";
import { GitHubUser } from "../types/auth.types";
import TokenService from "./token.service";
import rateLimiter from "../utils/rate-limiter";

const getAccessToken = async (code: string): Promise<string> => {
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

    return response.data.access_token;
  } catch (error) {
    console.error("Error getting GitHub access token:", error);
    throw new Error("Failed to get access token from GitHub");
  }
};

/**
 * Gets an access token and stores it for a user
 * @param code The GitHub OAuth code
 * @param userId The user ID to associate with the token
 * @returns The access token
 */
const getAndStoreAccessToken = async (
  code: string,
  userId: string
): Promise<string> => {
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

    console.log(
      "GitHub OAuth response data:",
      JSON.stringify(response.data, null, 2)
    );

    const accessToken = response.data.access_token;

    if (!accessToken) {
      console.error("No access_token in GitHub response:", response.data);
      throw new Error("GitHub did not provide an access token");
    }

    // GitHub's standard OAuth tokens don't expire by default
    // If you're using GitHub Apps or have configured expiration, adjust the expiresIn value
    const expiresIn = 8 * 60 * 60; // Default to 8 hours

    try {
      // Store the token
      await TokenService.saveToken(userId, accessToken, expiresIn);
    } catch (error: any) {
      console.error("Error storing GitHub access token:", error);

      // Check if this is an encryption error
      if (
        error.message &&
        (error.message.includes("crypto") ||
          error.message.includes("encryption") ||
          error.message.includes("key"))
      ) {
        throw new Error(
          `Failed to securely store access token: ${error.message}`
        );
      }

      throw new Error("Failed to store GitHub access token");
    }

    return accessToken;
  } catch (error) {
    console.error("Error getting and storing GitHub access token:", error);
    throw new Error("Failed to get and store access token from GitHub");
  }
};

const getUserData = async (accessToken: string): Promise<GitHubUser> => {
  try {
    const { githubApiRequest } = require("../utils/github-api");

    const userResponse = await githubApiRequest("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    let email = userResponse.email;
    if (!email) {
      const emailsResponse = await githubApiRequest(
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
      name: userResponse.name || userResponse.login,
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
    const perPage = 100; // GitHub's max per page is 100

    // Fetch all pages of starred repositories
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

      // If no results or not an array, break the loop
      if (!response || !Array.isArray(response) || response.length === 0) {
        hasMorePages = false;
        break;
      }

      // Add the repositories from this page to our collection
      allRepositories = [...allRepositories, ...response];

      // If we got fewer repositories than the maximum per page, we've reached the last page
      if (response.length < perPage) {
        hasMorePages = false;
      } else {
        // Otherwise, go to the next page
        page++;
      }
    }

    console.log("Total Starred Repositories Count:", allRepositories.length);

    return allRepositories;
  } catch (error) {
    console.error("Error fetching starred repositories:", error);
    throw new Error(
      `Failed to fetch starred repositories from GitHub: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export default {
  getAccessToken,
  getAndStoreAccessToken,
  getUserData,
  getStarredRepositories,
};
