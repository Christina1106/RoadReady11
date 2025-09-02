import { createContext, useContext, useEffect, useState } from "react";
import api from "../Interceptors/AuthInterceptor";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  // read from BOTH localStorage and sessionStorage
  const [token, setToken] = useState(
    () => localStorage.getItem("token") || sessionStorage.getItem("token") || null
  );
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
    catch { return {}; }
  });
  const [loading, setLoading] = useState(false);

  // light re-hydration in case storage was updated outside the context
  useEffect(() => {
    const sync = () => {
      const t = localStorage.getItem("token") || sessionStorage.getItem("token") || null;
      if (t && t !== token) setToken(t);
      try {
        const u = JSON.parse(sessionStorage.getItem("user") || "{}");
        if (JSON.stringify(u) !== JSON.stringify(user)) setUser(u);
      } catch {}
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [token, user]);

  // accepts remember flag
  const login = async (email, password, remember = true) => {
    try {
      setLoading(true);
      const { data } = await api.post("Authentication/login", { email, password });
      const t = data?.token || data?.Token || data?.accessToken || data?.jwt;
      if (!t) throw new Error("Token missing");

      if (remember) localStorage.setItem("token", t);
      else sessionStorage.setItem("token", t);
      setToken(t);

      try {
        const me = await api.get("Users/me");
        sessionStorage.setItem("user", JSON.stringify(me.data || {}));
        setUser(me.data || {});
      } catch { /* still logged in with token */ }

      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
};

export const useAuth = () => useContext(AuthCtx);
