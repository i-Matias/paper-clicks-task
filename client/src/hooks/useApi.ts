import { useState, useCallback } from "react";
import useNotificationStore from "../stores/useNotificationStore";

/**
 * Configuration options for useApi hook
 * @template T The expected response data type
 */
interface UseApiOptions<T> {
  /** Whether to show a success notification after successful API call */
  showSuccessNotification?: boolean;
  /** Whether to show an error notification on failed API call */
  showErrorNotification?: boolean;
  /** Custom success message for notifications */
  successMessage?: string;
  /** Callback function to run after successful API call */
  onSuccess?: (data: T) => void;
}

/**
 * Result object returned by useApi hook
 * @template T The expected response data type
 * @template P The parameters type for the API call function
 */
interface UseApiResult<T, P> {
  /** The data returned from the API call */
  data: T | null;
  /** Whether an API call is in progress */
  loading: boolean;
  /** Error message if API call failed */
  error: string | null;
  /** Function to execute the API call */
  execute: (params: P) => Promise<T>;
  /** Function to reset the hook state */
  reset: () => void;
}

/**
 * A hook for handling API calls with integrated loading, error states and notifications
 * @template T The expected response data type
 * @template P The parameters type for the API call function
 * @param apiCall The API function to call
 * @param options Configuration options
 * @returns Object containing data, loading state, error state, execute function, and reset function
 */
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
