import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import authService from "../../services/auth.service";
import "./style.css";
import useNotificationStore from "../../stores/useNotificationStore";

export default function Callback() {
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setToken, setUser, setGithubToken } = useAuthStore();
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          setAuthError("Authorization code not found.");
          addNotification("error", "Authorization code not found.");
          return;
        }

        const data = await authService.handleCallback(code);

        if (data.tokens && data.tokens.accessToken) {
          setToken(data.tokens.accessToken, data.tokens.expiresIn);

          if (data.githubToken) {
            setGithubToken(data.githubToken);
          }

          if (data.user) {
            setUser(data.user);
          }

          addNotification("success", "Successfully logged in!");
          navigate("/", { replace: true }); // Ensure redirection to root
        } else {
          setAuthError("Invalid response from server. Authentication failed.");
          addNotification(
            "error",
            "Invalid response from server. Authentication failed."
          );
        }
      } catch (error) {
        console.error("Authentication error:", error);

        // Extract the error message
        let errorMessage = "Authentication failed. Please try again.";
        if (error && typeof error === "object" && "response" in error) {
          const response = (
            error as { response?: { data?: { error?: string } } }
          ).response;
          if (response?.data?.error) {
            errorMessage = `Authentication failed: ${response.data.error}`;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        setAuthError(errorMessage);
        addNotification("error", errorMessage);
      }
    };

    handleCallback();
  }, [navigate, setToken, setUser, setGithubToken, addNotification]);

  if (authError) {
    return (
      <div className="callback-error">
        <h2>Authentication Error</h2>
        <p>{authError}</p>
        <button className="back-button" onClick={() => navigate("/login")}>
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="callback-loading">
      <div className="loading-animation"></div>
      <h2>Authenticating...</h2>
      <p>
        Please wait while we complete the authentication process with GitHub.
      </p>
    </div>
  );
}
