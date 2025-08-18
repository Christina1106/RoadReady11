// src/services/login.service.js
import api from "../Interceptors/AuthInterceptor";

export function loginAPICall(loginModel) {
  // loginModel = { email, password }
  return api.post("Authentication/login", loginModel);
}
