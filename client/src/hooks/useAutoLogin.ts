import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import authService from "../services/auth.service";
import useNotificationStore from "../stores/useNotificationStore";

/**
 * Result object returned by useAutoLogin hook
 */
interface UseAutoLoginResult {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether authentication check is in progress */
  isLoading: boolean;
  /** Function to manually trigger authentication check */
  checkAuth: () => Promise<void>;
}

/**
 * This hook handles automatic authentication verification on app load
 * It attempts to fetch the user profile if a token exists and redirects
 * to login page if authentication fails
 * @returns Object containing authentication state, loading state, and checkAuth function
 */
export const useAutoLogin = (): UseAutoLoginResult => {
  const { token, user, setUser, logout, isTokenValid } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotificationStore();

  // Determine if we're on a public page that doesn't require authentication
  const isPublicPage = useMemo(() => {
    return (
      location.pathname.includes("/login") ||
      location.pathname.includes("/callback")
    );
  }, [location.pathname]);

  // Helper function to handle authentication failures
  const handleAuthFailure = useCallback(
    (message: string, notificationType: "warning" | "info" = "warning") => {
      logout();
      addNotification(notificationType, message);
      navigate("/login");
    },
    [logout, addNotification, navigate]
  );

  // Function to check authentication status and fetch user data if needed
  const checkAuth = useCallback(async () => {
    // Skip authentication check if we're on a public page
    if (isPublicPage) return;

    // First check if token is still valid
    if (token && isTokenValid()) {
      // If we have a valid token but no user, try to fetch user data
      if (!user) {
        try {
          setIsLoading(true);
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
          } else {
            // If we can't get user data, token might be invalid
            handleAuthFailure("Your session has expired. Please log in again.");
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
          // Token is likely expired or invalid
          handleAuthFailure("Authentication failed. Please log in again.");
        } finally {
          setIsLoading(false);
        }
      }
    } else if (token && !isTokenValid()) {
      // Token has expired
      console.log("Token has expired, logging out");
      handleAuthFailure(
        "Your session has expired. Please log in again.",
        "info"
      );
    }
  }, [token, user, setUser, isTokenValid, isPublicPage, handleAuthFailure]);

  // Check authentication on component mount or when dependencies change
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated: !!token && !!user && isTokenValid(),
    isLoading,
    checkAuth, // Expose this function so components can trigger re-auth if needed
  };
};
