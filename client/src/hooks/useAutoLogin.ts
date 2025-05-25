import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import authService from "../services/auth.service";

/**
 * This hook helps with automatic authentication check on app load
 * It attempts to fetch the user profile if a token exists
 */
export const useAutoLogin = () => {
  const { token, user, setUser, logout, isTokenValid } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      // First check if token is still valid
      if (token && isTokenValid()) {
        // If we have a valid token but no user, try to fetch user data
        if (!user) {
          try {
            const userData = await authService.getCurrentUser();
            if (userData) {
              setUser(userData);
            } else {
              // If we can't get user data, token might be invalid
              logout();
            }
          } catch (error) {
            console.error("Auto-login failed:", error);
            // Token is likely expired or invalid - logout
            logout();
            if (!window.location.pathname.includes("/login")) {
              navigate("/login");
            }
          }
        }
      } else if (token && !isTokenValid()) {
        // Token has expired
        console.log("Token has expired, logging out");
        logout();
        if (!window.location.pathname.includes("/login")) {
          navigate("/login");
        }
      }
    };

    checkAuth();
  }, [token, user, setUser, logout, navigate, isTokenValid]);

  return { isAuthenticated: !!token && !!user && isTokenValid() };
};
