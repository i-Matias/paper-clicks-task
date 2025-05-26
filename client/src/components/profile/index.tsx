import React from "react";
import { motion } from "framer-motion";
import "./styles.css";

export interface ProfileProps {
  username: string;
  name: string;
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
  name,
  email,
  avatarUrl,
  createdAt,
  updatedAt,
}) => {
  const formattedJoinDate = formatDate(createdAt);
  const formattedUpdateDate = formatDate(updatedAt);

  return (
    <motion.div
      className="profile-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
        y: -5,
      }}
    >
      <motion.div
        className="profile-header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="profile-info">
          <motion.img
            src={avatarUrl}
            alt={`${username}'s avatar`}
            className="profile-avatar"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: 0.3,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
            }}
            whileHover={{ scale: 1.05, rotate: 5 }}
          />
          <motion.div
            className="profile-details"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {username} ({name}){" "}
            </motion.h2>
            <motion.p
              className="profile-email"
              title={email}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {email}
            </motion.p>
          </motion.div>
        </div>
        <motion.div
          className="profile-dates"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <span>Joined:</span> {formattedJoinDate}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <span>Last Updated:</span> {formattedUpdateDate}
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Profile;
