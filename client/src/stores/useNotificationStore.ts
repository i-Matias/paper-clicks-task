import { create } from "zustand";

export type NotificationType = "success" | "error" | "info" | "warning";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (type: NotificationType, message: string) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (type, message) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { id, type, message };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

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
