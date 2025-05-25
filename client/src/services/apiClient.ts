import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import useAuthStore from "../stores/useAuthStore";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5001",
});

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

class APIClient<T> {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  /** get single*/
  get = (config?: AxiosRequestConfig) => {
    return axiosInstance.get<T>(this.endpoint, config).then((res) => res.data);
  };

  getById = (id?: string) => {
    return axiosInstance
      .get<T>(this.endpoint + "?" + id)
      .then((res) => res.data);
  };

  getByIdParams = (payload: string | number) => {
    return axiosInstance
      .get<T>(this.endpoint + "/" + payload)
      .then((res) => res.data);
  };

  /** get multiple*/
  getAll = (config?: AxiosRequestConfig) => {
    return axiosInstance
      .get<T[]>(this.endpoint, config)
      .then((res) => res.data);
  };

  /** post */
  post = <U = Record<string, unknown>>(
    payload?: U,
    config?: AxiosRequestConfig
  ) => {
    return axiosInstance
      .post<T>(this.endpoint, payload, config)
      .then((res) => res.data);
  };

  /** update */
  patch = (payload: { id: number | string; data: Record<string, unknown> }) => {
    return axiosInstance.patch<T>(
      this.endpoint + "/" + payload.id,
      payload.data
    );
  };

  /** delete */
  delete = (payload: string | number) => {
    return axiosInstance
      .delete(this.endpoint + "/" + payload)
      .then((res) => res.data);
  };
}

export default APIClient;
