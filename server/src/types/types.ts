export interface UserPayload {
  id: string;
  email: string;
}

export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  displayName: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface GithubTokenResponse {
  access_token: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
}

export interface AuthTokens {
  accessToken: string;
  expires: number;
}

export interface AuthResponse {
  user: {
    id: string;
    username: string;
    email: string;
  };
  tokens: {
    accessToken: string;
    expiresIn: number;
  };
}

export interface RepoData {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
}

export interface DailyCommitCount {
  date: string;
  count: number;
}
