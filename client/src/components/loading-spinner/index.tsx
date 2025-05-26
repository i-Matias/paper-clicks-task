import React from "react";
import { motion } from "framer-motion";
import "./styles.css";

interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  message?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  message = "Loading...",
  fullScreen = false,
  overlay = false,
}) => {
  const containerClass = `loading-container ${
    fullScreen ? "full-screen" : ""
  } ${overlay ? "overlay" : ""}`;
  return (
    <motion.div
      className={containerClass}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={`loading-spinner ${size}`}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 1.2, ease: "linear" },
          scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
        }}
      ></motion.div>
      {message && (
        <motion.p
          className="loading-message"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {message}
        </motion.p>
      )}
    </motion.div>
  );
};

export default LoadingSpinner;
