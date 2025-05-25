import { useCallback } from "react";
import "./style.css";
import authService from "../../services/auth.service";
import { useApi } from "../../hooks/useApi";
import useNotificationStore from "../../stores/useNotificationStore";

export default function Login() {
  const { addNotification } = useNotificationStore();

  const {
    loading: isLoading,
    error,
    execute: getLoginUrl,
  } = useApi(authService.getLoginUrl, {
    showErrorNotification: true,
    showSuccessNotification: false,
  });

  const handleLogin = useCallback(async () => {
    try {
      addNotification("info", "Redirecting to GitHub for authentication...");

      const data = await getLoginUrl();

      if (data && data.url) {
        window.location.href = data.url;
      } else {
        addNotification(
          "error",
          "Invalid response from server. Missing GitHub authorization URL."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  }, [getLoginUrl, addNotification]);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">GitHub Repository Analytics</h1>
        <p className="login-subtitle">
          View commit activity for your starred repositories
        </p>

        {error && (
          <div className="login-error">
            <p>{error}</p>
            <p className="error-help">
              Please check your internet connection and try again.
            </p>
          </div>
        )}

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            "Connecting..."
          ) : (
            <>
              <span>Continue with GitHub</span>
            </>
          )}
        </button>

        <div className="login-info">
          <p>
            By logging in, you allow this application to view your GitHub
            profile and starred repositories.
          </p>
        </div>
      </div>
    </div>
  );
}
