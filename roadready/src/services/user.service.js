import api from "../Interceptors/AuthInterceptor";

export const meAPICall = () => api.get("Users/me");
export const getAllUsersAPICall = () => api.get("Users");
