import api from "../Interceptors/AuthInterceptor";

export function loginAPICall(loginModel) {
  return api.post("Authentication/login", loginModel);
}
