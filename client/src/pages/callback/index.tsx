import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import authService from "../../services/auth.service";
import "./style.css";

export default function Callback() {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setToken, setUser, setGithubToken } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          setError("Authorization code not found.");
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
          navigate("/", { replace: true }); // Ensure redirection to root after successful login
        } else {
          setError("Invalid response from server. Authentication failed.");
        }
      } catch (error) {
        console.error("Authentication error:", error);
        // If it's an AxiosError with a response, try to extract the error message
        if (error && typeof error === "object" && "response" in error) {
          const response = (
            error as { response?: { data?: { error?: string } } }
          ).response;
          if (response?.data?.error) {
            setError(`Authentication failed: ${response.data.error}`);
          } else {
            setError("Authentication failed. Please try again.");
          }
        } else {
          setError("Authentication failed. Please try again.");
        }
      }
    };

    handleCallback();
  }, [navigate, setToken, setUser]);

  if (error) {
    return (
      <div className="callback-error">
        <h2>Authentication Error</h2>
        <p>{error}</p>
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
