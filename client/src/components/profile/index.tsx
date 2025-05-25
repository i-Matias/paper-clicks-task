import React from "react";
import "./styles.css";

export interface ProfileProps {
  id: string;
  username: string;
  email: string;
  avatarUrl: string;
  createdAt: string;
  updatedAt: string;
}

const formatDate = (dateStr: string): string => {
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    console.error("Invalid date format:", error);
    return "Unknown date";
  }
};

const Profile: React.FC<ProfileProps> = ({
  username,
  email,
  avatarUrl,
  createdAt,
  updatedAt,
}) => {
  const formattedJoinDate = formatDate(createdAt);
  const formattedUpdateDate = formatDate(updatedAt);

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
            <p className="profile-email" title={email}>
              {email}
            </p>
          </div>
        </div>
        <div className="profile-dates">
          <p>
            <span>Joined:</span> {formattedJoinDate}
          </p>
          <p>
            <span>Last Updated:</span> {formattedUpdateDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
