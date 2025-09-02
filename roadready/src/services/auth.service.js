 import api from "../Interceptors/AuthInterceptor";
 export const registerAPICall = (payload) =>
   api.post("Authentication/register", payload);