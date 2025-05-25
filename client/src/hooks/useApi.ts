import { useState, useCallback } from "react";
import useNotificationStore from "../stores/useNotificationStore";

interface UseApiOptions<T> {
  showSuccessNotification?: boolean;
  showErrorNotification?: boolean;
  successMessage?: string;
  onSuccess?: (data: T) => void;
}

interface UseApiResult<T, P> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (params: P) => Promise<T>;
  reset: () => void;
}

export function useApi<T, P = void>(
  apiCall: (params: P) => Promise<T>,
  options: UseApiOptions<T> = {}
): UseApiResult<T, P> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addNotification } = useNotificationStore();

  const {
    showSuccessNotification = false,
    showErrorNotification = true,
    successMessage = "Operation completed successfully",
    onSuccess,
  } = options;

  const execute = useCallback(
    async (params: P): Promise<T> => {
      try {
        setLoading(true);
        setError(null);

        const result = await apiCall(params);

        setData(result);

        if (showSuccessNotification) {
          addNotification("success", successMessage);
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";

        setError(errorMessage);

        if (showErrorNotification) {
          addNotification("error", errorMessage);
        }

        return Promise.reject(err);
      } finally {
        setLoading(false);
      }
    },
    [
      apiCall,
      addNotification,
      showSuccessNotification,
      showErrorNotification,
      successMessage,
      onSuccess,
    ]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
}
