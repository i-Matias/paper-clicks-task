import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../services/auth.service";

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  tokenExpiry: number | null;
  user: User | null;
  setToken: (token: string, expiresIn?: number) => void;
  setUser: (user: User) => void;
  logout: () => void;
  isTokenValid: () => boolean;
}

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

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          token: null,
          tokenExpiry: null,
          user: null,
          isAuthenticated: false,
        }),

      isTokenValid: () => {
        const { token, tokenExpiry } = get();
        if (!token || !tokenExpiry) return false;

        const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
        const isValid = Date.now() < tokenExpiry - bufferTime;

        if (
          Date.now() < tokenExpiry &&
          Date.now() >= tokenExpiry - bufferTime
        ) {
          console.warn("Auth token is about to expire soon");
        }

        return isValid;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
