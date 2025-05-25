import { useEffect } from "react";
import { toast, ToastContainer as ReactToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useNotificationStore from "../../stores/useNotificationStore";

const ToastContainer = () => {
  const { notifications, removeNotification } = useNotificationStore();

  useEffect(() => {
    notifications.forEach((notification) => {
      const { id, type, message } = notification;

      const toastOptions = {
        position: "top-right" as const,
        autoClose: type === "error" ? false : 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        onClose: () => removeNotification(id),
      } as const;

      switch (type) {
        case "success":
          toast.success(message, toastOptions);
          break;
        case "error":
          toast.error(message, toastOptions);
          break;
        case "info":
          toast.info(message, toastOptions);
          break;
        case "warning":
          toast.warning(message, toastOptions);
          break;
      }

      removeNotification(id);
    });
  }, [notifications, removeNotification]);

  return (
    <ReactToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default ToastContainer;
