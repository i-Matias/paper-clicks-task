import { useEffect, useState } from "react";
import useAuthStore from "../../stores/useAuthStore";
import authService, { type User } from "../../services/auth.service";
import "./style.css";
import Profile from "../../components/profile";
import StarredRepositories from "../../components/starred-repositories";

export default function Home() {
  const { user: storedUser, logout } = useAuthStore();
  const [user, setUser] = useState<User | null>(storedUser);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (storedUser) {
        setUser(storedUser);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const userData = await authService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        setError("Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [storedUser]);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <div className="home-container">Loading user profile...</div>;
  }

  if (error) {
    return (
      <div className="home-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button className="logout-button" onClick={handleLogout}>
          Back to Login
        </button>
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

      {user && (
        <>
          <Profile
            id={user.id}
            username={user.username}
            email={user.email}
            avatarUrl={user.avatarUrl}
            createdAt={user.createdAt}
            updatedAt={user.updatedAt}
          />

          <div className="repositories-section">
            <StarredRepositories onError={(errorMsg) => setError(errorMsg)} />
          </div>
        </>
      )}
    </div>
  );
}
