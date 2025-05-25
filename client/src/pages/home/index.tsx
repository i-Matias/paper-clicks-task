import { useCallback, useMemo } from "react";
import Profile from "../../components/profile";
import StarredRepositories from "../../components/starred-repositories";
import { useFetch } from "../../hooks/useFetch";
import authService, { type User } from "../../services/auth.service";
import useAuthStore from "../../stores/useAuthStore";
import useNotificationStore from "../../stores/useNotificationStore";
import "./style.css";

/**
 * Main home page component that displays user profile and repositories
 */
export default function Home() {
  const { user: storedUser, logout } = useAuthStore();
  const { addNotification } = useNotificationStore();

  // Only fetch user data if it's not already in the store
  const shouldFetch = !storedUser;

  // Fetch user profile if not already stored
  const { data: fetchedUser, loading } = useFetch<User>(
    authService.getCurrentUser,
    {
      initialFetch: shouldFetch,
      showErrorNotification: true,
    }
  );

  // Use stored user data if available, otherwise use fetched data
  const user = useMemo(
    () => storedUser || fetchedUser,
    [storedUser, fetchedUser]
  );

  // Handle user logout
  const handleLogout = useCallback(() => {
    addNotification("info", "You have been logged out");
    logout();
    // The PrivateRoute component will redirect to login page
  }, [addNotification, logout]);

  if (loading) {
    return <div className="home-container">Loading user profile...</div>;
  }

  // Show empty state if no user data
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
        updatedAt={user.updatedAt || user.createdAt} // Fallback if updatedAt is missing
      />

      <StarredRepositories />
    </div>
  );
}
