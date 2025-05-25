import { Component, type ErrorInfo, type ReactNode } from "react";
import { toast } from "react-toastify";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Component error caught:", error, errorInfo);

    // Format the message based on environment
    const errorMessage =
      process.env.NODE_ENV === "production"
        ? `An error occurred: ${error.message}`
        : `An error occurred: ${error.message}\n\nCheck console for details`;

    // Use react-toastify directly
    toast.error(errorMessage, {
      autoClose: false,
      onClick: () => console.error("Error details:", error, errorInfo),
    });

    // Optionally send to an error reporting service
    // if (process.env.NODE_ENV === 'production') {
    //   reportErrorToService(error, errorInfo);
    // }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || "An unknown error occurred"}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="error-retry-button"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
