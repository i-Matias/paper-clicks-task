import { useCallback, useMemo } from "react";
import Profile from "../../components/profile";
import { useFetch } from "../../hooks/useFetch";
import authService, { type User } from "../../services/auth.service";
import useAuthStore from "../../stores/useAuthStore";
import useNotificationStore from "../../stores/useNotificationStore";
import LoadingSpinner from "../../components/loading-spinner";
import { useNavigate } from "react-router-dom";
import "./style.css";

export default function UserProfilePage() {
  const { user: storedUser, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();

  const shouldFetch = !storedUser;

  const { data: fetchedUser, loading } = useFetch<User>(
    authService.getCurrentUser,
    {
      initialFetch: shouldFetch,
      showErrorNotification: true,
    }
  );

  const user = useMemo(
    () => storedUser || fetchedUser,
    [storedUser, fetchedUser]
  );

  const handleLogout = useCallback(() => {
    addNotification("info", "You have been logged out");
    logout();
  }, [addNotification, logout]);

  const handleBackToAnalytics = () => {
    navigate("/");
  };

  if (loading) {
    return <LoadingSpinner message="Loading user profile..." />;
  }

  if (!user) {
    return (
      <div className="profile-page-container">
        <div className="error-container">
          <h2>Unable to load user profile</h2>
          <p>Please try logging in again.</p>
          <button className="logout-button" onClick={handleLogout}>
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <h2>User Profile</h2>
        <button className="back-button" onClick={handleBackToAnalytics}>
          Back to Analytics
        </button>
      </div>

      <div className="profile-card-container">
        <Profile
          username={user.username}
          name={user.name}
          email={user.email}
          avatarUrl={user.avatarUrl}
          createdAt={user.createdAt}
          updatedAt={user.updatedAt || user.createdAt}
        />
      </div>
    </div>
  );
}
