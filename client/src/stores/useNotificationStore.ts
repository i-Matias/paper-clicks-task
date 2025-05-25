import { create } from "zustand";

/**
 * Types of notifications supported by the application
 */
export type NotificationType = "success" | "error" | "info" | "warning";

/**
 * Structure of a notification
 */
export interface Notification {
  /** Unique identifier for the notification */
  id: string;
  /** Type of notification that determines style and behavior */
  type: NotificationType;
  /** Message content to display */
  message: string;
}

/**
 * Notification store state and methods
 */
interface NotificationState {
  /** Current list of notifications */
  notifications: Notification[];

  /**
   * Add a new notification
   * @param type Type of notification
   * @param message Notification message
   * @returns ID of the created notification
   */
  addNotification: (type: NotificationType, message: string) => string;

  /**
   * Remove a specific notification by ID
   * @param id Notification ID to remove
   */
  removeNotification: (id: string) => void;

  /**
   * Clear all notifications
   */
  clearNotifications: () => void;
}

/**
 * Notification store to manage application-wide notifications
 * Provides methods for adding, removing, and clearing notifications
 */
const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (type, message) => {
    // Generate a random ID for the notification
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { id, type, message };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-dismiss after 5 seconds for non-error notifications
    if (type !== "error") {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter(
            (notification) => notification.id !== id
          ),
        }));
      }, 5000);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },
}));

export default useNotificationStore;
