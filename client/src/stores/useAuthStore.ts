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
        return Date.now() < tokenExpiry;
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

export default useAuthStore;
