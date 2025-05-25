import Content from "./navigation/Content";
import { useAutoLogin } from "./hooks/useAutoLogin";
import ToastContainer from "./components/toast-container";
import { ErrorBoundary } from "./components/error";
import LoadingSpinner from "./components/loading-spinner";
import "./App.css";

export default function App() {
  const { isLoading } = useAutoLogin();

  return (
    <>
      <ErrorBoundary>
        {isLoading ? (
          <LoadingSpinner fullScreen message="Loading application..." />
        ) : (
          <Content />
        )}
      </ErrorBoundary>
      <ToastContainer />
    </>
  );
}
