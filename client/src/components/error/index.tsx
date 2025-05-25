import React from "react";
import "./style.css";

interface ErrorMessageProps {
  message: string;
  type?: "error" | "warning" | "info";
  onDismiss?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  type = "error",
  onDismiss,
}) => {
  return (
    <div className={`error-message ${type}`}>
      <div className="error-content">
        <span className="error-icon">
          {type === "error" && "❌"}
          {type === "warning" && "⚠️"}
          {type === "info" && "ℹ️"}
        </span>
        <span className="error-text">{message}</span>
      </div>
      {onDismiss && (
        <button className="dismiss-button" onClick={onDismiss}>
          Dismiss
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
