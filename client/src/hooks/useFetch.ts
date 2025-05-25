import { useEffect } from "react";
import { useApi } from "./useApi";

/**
 * Configuration options for useFetch hook
 * @template T The expected response data type
 */
interface UseFetchOptions<T> {
  /** Whether to fetch data immediately when component mounts */
  initialFetch?: boolean;
  /** Dependencies array to trigger refetch when values change */
  dependencyArray?: unknown[];
  /** Whether to show error notifications */
  showErrorNotification?: boolean;
  /** Function to transform the response data */
  transformData?: (data: unknown) => T;
}

/**
 * Result object returned by useFetch hook
 * @template T The expected response data type
 */
interface UseFetchResult<T> {
  /** The data returned from the API call */
  data: T | null;
  /** Whether a fetch is in progress */
  loading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Function to manually trigger refetch */
  refetch: () => Promise<unknown>;
}

/**
 * A hook for data fetching with automatic loading, error handling, and refetch capability
 * @template T The expected response data type
 * @param fetchFn Function that returns a promise with the data
 * @param options Configuration options
 * @returns Object containing data, loading state, error state, and refetch function
 */
export function useFetch<T>(
  fetchFn: () => Promise<unknown>,
  options: UseFetchOptions<T> = {}
): UseFetchResult<T> {
  const {
    initialFetch = true,
    dependencyArray = [],
    showErrorNotification = true,
    transformData,
  } = options;

  const {
    data: rawData,
    loading,
    error,
    execute: fetchData,
  } = useApi<unknown>(fetchFn, { showErrorNotification });

  useEffect(() => {
    let isMounted = true;

    if (initialFetch) {
      const fetchAndSetIfMounted = async () => {
        if (isMounted) {
          fetchData();
        }
      };

      fetchAndSetIfMounted();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencyArray);

  // Cast the refetch function to match the expected return type
  const refetch = () => {
    return fetchData();
  };

  // Apply transformation if provided, otherwise treat raw data as T
  const data =
    transformData && rawData ? transformData(rawData) : (rawData as T);

  return {
    data: data as T | null,
    loading,
    error,
    refetch,
  };
}
