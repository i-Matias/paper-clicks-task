import axios, { type AxiosRequestConfig } from "axios";
import useAuthStore from "../stores/useAuthStore";

const axiosInstance = axios.create({
  baseURL: `${process.env.REACT_APP_API_URL}`,
  // baseURL: `${process.env.REACT_APP_API_URL}/${CUSTOMER}`,
});

axiosInstance.interceptors.request.use(
  (request: any) => {
    const { token } = useAuthStore.getState();
    request.headers = {
      ...request.headers,
      ...{ Authorization: `Bearer ` + token },
      Accept: "application/json",
    };
    return request;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (err: any) => {
    // const { response } = err;
    // const { data } = response;
    // const { errorCode, error } = data;
    // if (response.status == 401 && !useAuthStore.getState().token) {
    //   switch (errorCode) {
    //     case "user_not_found":
    //       navigate("/not-found");
    //       break;
    //     case "user_inactive":
    //       navigate("/not-active");
    //       break;
    //     case "invalid_token":
    //     case "token_malformed":
    //       keycloak.logout({ redirectUri: window.location.origin });
    //       break;
    //     default:
    //       keycloak.logout({ redirectUri: window.location.origin });
    //       break;
    //   }
    // }

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
  post = (payload?: any) => {
    return axiosInstance
      .post<T>(this.endpoint, payload)
      .then((res) => res.data);
  };

  /** update */
  patch = (payload: { id: number | string; data: T }) => {
    return axiosInstance.patch<T>(
      this.endpoint + "/" + payload.id,
      payload.data
    );
  };
  /** delete */
  delete = (payload: string | number) => {
    return axiosInstance
      .delete<any>(this.endpoint + "/" + payload)
      .then((res) => res.data);
  };
}

export default APIClient;
