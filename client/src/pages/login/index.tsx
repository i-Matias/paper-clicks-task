import { useCallback } from "react";
import "./style.css";
import authService from "../../services/auth.service";
import { useApi } from "../../hooks/useApi";
import useNotificationStore from "../../stores/useNotificationStore";
import { motion } from "framer-motion";

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
    <motion.div
      className="login-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.8,
          type: "spring",
          stiffness: 100,
          damping: 15,
        }}
      >
        <motion.h1
          className="login-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          GitHub Repository Analytics
        </motion.h1>
        <motion.p
          className="login-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          View commit activity for your starred repositories
        </motion.p>

        {error && (
          <motion.div
            className="login-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            transition={{ duration: 0.3 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {error}
            </motion.p>
            <motion.p
              className="error-help"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Please check your internet connection and try again.
            </motion.p>
          </motion.div>
        )}

        <motion.button
          className="login-button"
          onClick={handleLogin}
          disabled={isLoading}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isLoading ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Connecting...
            </motion.span>
          ) : (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              Continue with GitHub
            </motion.span>
          )}
        </motion.button>

        <motion.div
          className="login-info"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <p>
            By logging in, you allow this application to view your GitHub
            profile and starred repositories.
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
