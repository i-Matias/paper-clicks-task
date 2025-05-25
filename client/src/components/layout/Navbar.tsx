import { useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import useAuthStore from "../../stores/useAuthStore";
import useNotificationStore from "../../stores/useNotificationStore";
import "./Navbar.css";

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const location = useLocation();

  const handleLogout = useCallback(() => {
    addNotification("info", "You have been logged out");
    logout();
  }, [addNotification, logout]);

  if (location.pathname === "/login" || location.pathname === "/callback") {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="navbar-logo">
            GitHub Analytics
          </Link>
        </div>

        {isAuthenticated && user && (
          <div className="navbar-items">
            <Link to="/profile" className="navbar-user">
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt="User avatar"
                  className="navbar-avatar"
                />
              )}
              <span className="navbar-username">{user.username}</span>
            </Link>
            <button className="navbar-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
