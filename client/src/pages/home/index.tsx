import { useCallback, useMemo } from "react";
import Profile from "../../components/profile";
import StarredRepositories from "../../components/starred-repositories";
import { useFetch } from "../../hooks/useFetch";
import authService, { type User } from "../../services/auth.service";
import useAuthStore from "../../stores/useAuthStore";
import useNotificationStore from "../../stores/useNotificationStore";
import "./style.css";

export default function Home() {
  const { user: storedUser, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();

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

  if (loading) {
    return <div className="home-container">Loading user profile...</div>;
  }

  if (!user) {
    return (
      <div className="home-container">
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
    <div className="home-container">
      <div className="header-container">
        <h1>User Profile</h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <Profile
        id={user.id}
        username={user.username}
        email={user.email}
        avatarUrl={user.avatarUrl}
        createdAt={user.createdAt}
        updatedAt={user.updatedAt || user.createdAt}
      />

      <StarredRepositories />
    </div>
  );
}
