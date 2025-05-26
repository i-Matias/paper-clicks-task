import axios, {
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import useAuthStore from "../stores/useAuthStore";
import useNotificationStore from "../stores/useNotificationStore";

const API_BASE_URL = "http://localhost:5001";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

const handleAuthRedirect = (message: string, redirectUrl: string): Error => {
  useNotificationStore.getState().addNotification("info", message);

  useAuthStore.getState().logout();

  window.location.href = redirectUrl;

  return new Error(message);
};

axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { token, isTokenValid } = useAuthStore.getState();

    const isAuthEndpoint =
      request.url?.includes("/api/auth/github/login") ||
      request.url?.includes("/api/auth/github/callback");

    if (token && !isAuthEndpoint) {
      if (!isTokenValid()) {
        throw handleAuthRedirect(
          "Your session has expired. Please log in again.",
          "/login"
        );
      }

      request.headers.set("Authorization", `Bearer ${token}`);
    }

    request.headers.set("Accept", "application/json");

    return request;
  },
  (error: unknown) => {
    console.error("Request interceptor error:", error);

    if (error instanceof Error && !error.message.includes("Session expired")) {
      useNotificationStore
        .getState()
        .addNotification("error", `Request setup failed: ${error.message}`);
    }

    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },

  (err: unknown) => {
    const { addNotification } = useNotificationStore.getState();

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

      const status = response?.status;

      if (status === 401) {
        console.error("Unauthorized access. Token may be expired.");

        const responseData = response.data as {
          reauthorize?: boolean;
          authUrl?: string;
          error?: string;
        };

        if (responseData?.reauthorize && responseData?.authUrl) {
          return Promise.reject(
            handleAuthRedirect(
              "GitHub token expired. Redirecting to GitHub login...",
              responseData.authUrl
            )
          );
        }

        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/callback")
        ) {
          return Promise.reject(
            handleAuthRedirect(
              "Your session has expired. Please log in again.",
              "/login"
            )
          );
        }
      } else if (status === 403) {
        console.error("Access forbidden:", response);
        const responseData = response.data as {
          message?: string;
          documentation_url?: string;
        };

        if (responseData?.message?.includes("API rate limit exceeded")) {
          const message =
            "GitHub API rate limit exceeded. Please try again later.";
          addNotification("warning", message);
          return Promise.reject(new Error(message));
        }

        const message = responseData?.message || "Access forbidden";
        addNotification("error", message);
        return Promise.reject(new Error(message));
      } else if (status === 404) {
        console.error("Resource not found:", response);
        const message = "The requested resource could not be found";
        addNotification("error", message);
        return Promise.reject(new Error(message));
      } else if (status && status >= 500) {
        console.error("Server error:", response);
        const message = "A server error occurred. Please try again later.";
        addNotification("error", message);
        return Promise.reject(new Error(message));
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

        addNotification("error", errorMessage);
        return Promise.reject(new Error(errorMessage));
      }
    } else {
      console.error("API Request Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Network error";
      const message = `Request failed: ${errorMessage}`;

      // Only show notification for network errors if not related to auth redirects
      if (
        !errorMessage.includes("Session expired") &&
        !errorMessage.includes("Redirecting to reauthorize")
      ) {
        addNotification("error", message);
      }

      return Promise.reject(new Error(message));
    }
  }
);

interface APIClientOptions {
  showSuccessNotification?: boolean;
  successMessage?: string;
}

class APIClient<T> {
  endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  get = (
    config?: AxiosRequestConfig,
    options?: APIClientOptions
  ): Promise<T> => {
    return axiosInstance.get<T>(this.endpoint, config).then((res) => {
      this.handleSuccess(res, options);
      return res.data;
    });
  };

  post = (
    data?: unknown,
    config?: AxiosRequestConfig,
    options?: APIClientOptions
  ): Promise<T> => {
    return axiosInstance.post<T>(this.endpoint, data, config).then((res) => {
      this.handleSuccess(res, options);
      return res.data;
    });
  };

  private handleSuccess = (
    _response: AxiosResponse,
    options?: APIClientOptions
  ): void => {
    if (options?.showSuccessNotification) {
      const message =
        options.successMessage || "Operation completed successfully";
      useNotificationStore.getState().addNotification("success", message);
    }
  };
}

export default APIClient;
