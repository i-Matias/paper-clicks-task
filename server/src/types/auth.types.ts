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
