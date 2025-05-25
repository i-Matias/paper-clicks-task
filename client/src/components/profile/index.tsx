import React from "react";
import "./styles.css";

interface ProfileProps {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

const Profile: React.FC<ProfileProps> = ({
  username,
  email,
  avatarUrl,
  createdAt,
  updatedAt,
}) => {
  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-info">
          <img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            className="profile-avatar"
          />
          <div className="profile-details">
            <h2>{username}</h2>
            <p className="profile-email">{email}</p>
          </div>
        </div>
        <div className="profile-dates">
          <p>
            <span>Joined:</span> {new Date(createdAt).toLocaleDateString()}
          </p>
          <p>
            <span>Last Updated:</span>{" "}
            {new Date(updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
