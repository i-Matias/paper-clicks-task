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
        err as { response: { status?: number; data?: unknown } }
      ).response;

      // Handle token expiration or unauthorized access
      if (response?.status === 401) {
        console.error("Unauthorized access. Token may be expired.");

        // Only log out if we're not already on the login or callback page
        const currentPath = window.location.pathname;
        if (
          !currentPath.includes("/login") &&
          !currentPath.includes("/callback")
        ) {
          console.info("Redirecting to login due to authentication issue");
          // Log out using the store directly
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      } else {
        console.error("API Error Response:", response);
      }
    } else {
      console.error("API Request Error:", err);
    }
    return Promise.reject(err);
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
  post = <U = Record<string, unknown>>(payload?: U) => {
    return axiosInstance
      .post<T>(this.endpoint, payload)
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
