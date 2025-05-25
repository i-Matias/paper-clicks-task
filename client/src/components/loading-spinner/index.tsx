import React from "react";
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
    <div className={containerClass}>
      <div className={`loading-spinner ${size}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
