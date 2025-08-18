import axios from "axios";
import { baseUrl } from "../environment.dev";

const api = axios.create({
  baseURL: baseUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");
  if (token) {
    // IMPORTANT: backticks!
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const data = err?.response?.data;
    const message =
      data?.Message || data?.message || data?.errorMessage || data?.title || "Request failed";
    return Promise.reject({
      status: err?.response?.status,
      message,
      raw: err,
    });
  }
);

export default api;
