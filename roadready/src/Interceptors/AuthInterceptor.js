import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5047/api/", // <-- your ASP.NET base + /api
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // wherever you store it after login
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // helpful message + bounce back to login
      alert("Your session expired or you’re not authorized. Please log in as Admin.");
      // optional: window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
