import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../services/auth.service";

/**
 * Authentication store state and methods
 */
interface AuthState {
  /** Whether the user is authenticated */
  isAuthenticated: boolean;
  /** JWT access token for API requests */
  token: string | null;
  /** Timestamp when the token expires (in milliseconds) */
  tokenExpiry: number | null;
  /** GitHub OAuth token for GitHub API requests */
  githubToken: string | null;
  /** Current authenticated user information */
  user: User | null;

  /**
   * Set the authentication token and update authentication state
   * @param token JWT access token
   * @param expiresIn Token expiry in seconds
   */
  setToken: (token: string, expiresIn?: number) => void;

  /**
   * Store the GitHub OAuth token
   * @param token GitHub OAuth token
   */
  setGithubToken: (token: string) => void;

  /**
   * Set the current user information
   * @param user User information
   */
  setUser: (user: User) => void;

  /**
   * Clear all authentication data and log out
   */
  logout: () => void;

  /**
   * Check if the current token is still valid
   * @returns Whether the token is valid
   */
  isTokenValid: () => boolean;
}

/**
 * Authentication store with persistence
 * Stores authentication tokens, user data, and provides authentication methods
 */
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null,
      tokenExpiry: null,
      githubToken: null,
      user: null,

      setToken: (token, expiresIn = 604800) => {
        const tokenExpiry = Date.now() + expiresIn * 1000;
        set({
          token,
          tokenExpiry,
          isAuthenticated: Boolean(token),
        });
      },

      setGithubToken: (githubToken) => set({ githubToken }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          token: null,
          tokenExpiry: null,
          githubToken: null,
          user: null,
          isAuthenticated: false,
        }),

      isTokenValid: () => {
        const { token, tokenExpiry } = get();
        if (!token || !tokenExpiry) return false;
        return Date.now() < tokenExpiry;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
