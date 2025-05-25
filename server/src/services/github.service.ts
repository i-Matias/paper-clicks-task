import axios from "axios";
import { config } from "../config/auth.config";
import { GitHubUser } from "../types/auth.types";

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

const getUserData = async (accessToken: string): Promise<GitHubUser> => {
  try {
    const userResponse = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    let email = userResponse.data.email;
    if (!email) {
      const emailsResponse = await axios.get(
        "https://api.github.com/user/emails",
        {
          headers: {
            Authorization: `token ${accessToken}`,
          },
        }
      );
      // Get the primary email
      const primaryEmail = emailsResponse.data.find(
        (item: any) => item.primary
      );
      if (primaryEmail) {
        email = primaryEmail.email;
      } else if (emailsResponse.data.length > 0) {
        email = emailsResponse.data[0].email;
      }
    }

    return {
      id: userResponse.data.id,
      login: userResponse.data.login,
      avatar_url: userResponse.data.avatar_url,
      displayName: userResponse.data.name,
      name: userResponse.data.name || userResponse.data.login,
      email: email,
      created_at: userResponse.data.created_at,
      updated_at: userResponse.data.updated_at,
    };
  } catch (error) {
    console.error("Error fetching GitHub user data:", error);
    throw new Error("Failed to fetch user data from GitHub");
  }
};

const getStarredRepositories = async (accessToken: string): Promise<any[]> => {
  try {
    const response = await axios.get("https://api.github.com/user/starred", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    console.log("Starred Repositories Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching starred repositories:", error);
    throw new Error("Failed to fetch starred repositories from GitHub");
  }
};

export default {
  getAccessToken,
  getUserData,
  getStarredRepositories,
};
