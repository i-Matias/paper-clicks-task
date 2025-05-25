import { useEffect, useState } from "react";
import useAuthStore from "../../stores/useAuthStore";
import authService from "../../services/auth.service";
import "./style.css";

interface UserProfile {
  id: string;
  username: string;
  email: string;
}

export default function Home() {
  const { user: storedUser, logout } = useAuthStore();
  const [user, setUser] = useState<UserProfile | null>(storedUser);
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
      <h1>Welcome, {user?.username || "User"}!</h1>
      <p>You are successfully authenticated</p>

      {user && (
        <div className="user-info">
          <h2>Your Profile</h2>
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Username:</strong> {user.username}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      )}

      <button className="logout-button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}
