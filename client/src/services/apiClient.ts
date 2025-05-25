import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import useAuthStore from "../stores/useAuthStore";

/**
 * Base URL for API requests
 * In a production environment, this would be read from environment variables
 */
const API_BASE_URL = "http://localhost:5001";

/**
 * Axios instance with base configuration
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add auth token and headers to requests
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    // Only set the Authorization header for endpoints that aren't public auth endpoints
    const { token } = useAuthStore.getState();
    const isAuthEndpoint =
      request.url?.includes("/api/auth/github/login") ||
      request.url?.includes("/api/auth/github/callback");

    if (token && !isAuthEndpoint) {
      request.headers.set("Authorization", `Bearer ${token}`);
    }
    request.headers.set("Accept", "application/json");
    return request;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response interceptor for centralized error handling
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (err: unknown) => {
    // Better error handling
    if (err && typeof err === "object" && "response" in err) {
      const response = (
        err as {
          response: {
            status?: number;
            data?: unknown;
            statusText?: string;
          };
          message?: string;
        }
      ).response;

      // Safe access to response properties
      const status = response?.status;

      // Handle token expiration or unauthorized access
      if (status === 401) {
        console.error("Unauthorized access. Token may be expired.");

        // Check if this is a GitHub token expiration
        const responseData = response.data as {
          reauthorize?: boolean;
          authUrl?: string;
          error?: string;
        };
        if (responseData?.reauthorize && responseData?.authUrl) {
          console.info("GitHub token expired. Redirecting to reauthorize.");
          // Log out but then redirect to the GitHub auth URL
          useAuthStore.getState().logout();
          window.location.href = responseData.authUrl;
          return Promise.reject(
            new Error(
              "GitHub token expired. Redirecting to reauthorize GitHub access."
            )
          );
        }

        // Regular JWT token expiration - only log out if we're not already on the login or callback page
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/callback")
        ) {
          console.info("Redirecting to login due to authentication issue");
          // Log out using the store directly
          useAuthStore.getState().logout();
          window.location.href = "/login";
          return Promise.reject(
            new Error("Your session has expired. Please log in again.")
          );
        }
      } else if (status === 403) {
        console.error("Access forbidden:", response);
        // GitHub API rate limit might be exceeded
        const responseData = response.data as {
          message?: string;
          documentation_url?: string;
        };

        if (responseData?.message?.includes("API rate limit exceeded")) {
          return Promise.reject(
            new Error("GitHub API rate limit exceeded. Please try again later.")
          );
        }

        return Promise.reject(
          new Error(responseData?.message || "Access forbidden")
        );
      } else if (status === 404) {
        console.error("Resource not found:", response);
        return Promise.reject(
          new Error("The requested resource could not be found")
        );
      } else if (status && status >= 500) {
        console.error("Server error:", response);
        return Promise.reject(
          new Error("A server error occurred. Please try again later.")
        );
      } else {
        console.error("API Error Response:", response);
        const responseData = response.data as {
          error?: string;
          message?: string;
        };
        const errorMessage =
          responseData?.error ||
          responseData?.message ||
          response?.statusText ||
          "An error occurred";
        return Promise.reject(new Error(errorMessage));
      }
    } else {
      console.error("API Request Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Network error";
      return Promise.reject(new Error(`Request failed: ${errorMessage}`));
    }
  }
);

/**
 * Generic API client for making type-safe HTTP requests
 * T represents the expected response data type
 */
class APIClient<T> {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /**
   * Make a GET request to retrieve data
   * @param config Optional Axios request configuration
   * @returns Promise with response data
   */
  get = (config?: AxiosRequestConfig): Promise<T> => {
    return axiosInstance.get<T>(this.endpoint, config).then((res) => res.data);
  };

  /**
   * Get a resource by ID appended as a query param
   * @param id Resource identifier
   * @returns Promise with response data
   */
  getById = (id?: string): Promise<T> => {
    return axiosInstance
      .get<T>(this.endpoint + "?" + id)
      .then((res) => res.data);
  };

  /**
   * Get a resource by ID appended as path param
   * @param payload Resource identifier
   * @returns Promise with response data
   */
  getByIdParams = (payload: string | number): Promise<T> => {
    return axiosInstance
      .get<T>(`${this.endpoint}/${payload}`)
      .then((res) => res.data);
  };

  /**
   * Get multiple resources
   * @param config Optional Axios request configuration
   * @returns Promise with array of response data
   */
  getAll = (config?: AxiosRequestConfig): Promise<T[]> => {
    return axiosInstance
      .get<T[]>(this.endpoint, config)
      .then((res) => res.data);
  };

  /**
   * Create a new resource
   * @param payload Data to be sent in the request body
   * @param config Optional Axios request configuration
   * @returns Promise with response data
   */
  post = <U = Record<string, unknown>>(
    payload?: U,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return axiosInstance
      .post<T>(this.endpoint, payload, config)
      .then((res) => res.data);
  };

  /**
   * Update an existing resource
   * @param payload Object containing ID and data to update
   * @returns Promise with response data
   */
  patch = (payload: {
    id: number | string;
    data: Record<string, unknown>;
  }): Promise<T> => {
    return axiosInstance
      .patch<T>(`${this.endpoint}/${payload.id}`, payload.data)
      .then((res) => res.data);
  };

  /**
   * Delete a resource
   * @param payload Resource identifier
   * @returns Promise with response data
   */
  delete = (payload: string | number): Promise<unknown> => {
    return axiosInstance
      .delete(`${this.endpoint}/${payload}`)
      .then((res) => res.data);
  };
}

export default APIClient;
