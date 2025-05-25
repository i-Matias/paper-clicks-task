import { useEffect } from "react";
import { useApi } from "./useApi";

interface UseFetchOptions<T> {
  initialFetch?: boolean;
  dependencyArray?: unknown[];
  showErrorNotification?: boolean;
  transformData?: (data: unknown) => T;
}

interface UseFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<unknown>;
}

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

  const refetch = () => {
    return fetchData();
  };

  const data =
    transformData && rawData ? transformData(rawData) : (rawData as T);

  return {
    data: data as T | null,
    loading,
    error,
    refetch,
  };
}
