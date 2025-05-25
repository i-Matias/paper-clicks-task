import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import authService from "../services/auth.service";
import useNotificationStore from "../stores/useNotificationStore";

interface UseAutoLoginResult {
  isAuthenticated: boolean;
  isLoading: boolean;
  checkAuth: () => Promise<void>;
}

export const useAutoLogin = (): UseAutoLoginResult => {
  const { token, user, setUser, logout, isTokenValid } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotificationStore();

  const isPublicPage = useMemo(() => {
    return (
      location.pathname.includes("/login") ||
      location.pathname.includes("/callback")
    );
  }, [location.pathname]);

  const handleAuthFailure = useCallback(
    (message: string, notificationType: "warning" | "info" = "warning") => {
      logout();
      addNotification(notificationType, message);
      navigate("/login");
    },
    [logout, addNotification, navigate]
  );

  const checkAuth = useCallback(async () => {
    if (isPublicPage) return;

    if (token && isTokenValid()) {
      if (!user) {
        try {
          setIsLoading(true);
          const userData = await authService.getCurrentUser();
          if (userData) {
            setUser(userData);
          } else {
            handleAuthFailure("Your session has expired. Please log in again.");
          }
        } catch (error) {
          console.error("Auto-login failed:", error);
          handleAuthFailure("Authentication failed. Please log in again.");
        } finally {
          setIsLoading(false);
        }
      }
    } else if (token && !isTokenValid()) {
      console.log("Token has expired, logging out");
      handleAuthFailure(
        "Your session has expired. Please log in again.",
        "info"
      );
    }
  }, [token, user, setUser, isTokenValid, isPublicPage, handleAuthFailure]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    isAuthenticated: !!token && !!user && isTokenValid(),
    isLoading,
    checkAuth,
  };
};
