import { Navigate, Outlet } from "react-router-dom";

const RoleRoute = ({ allow }) => {
  try {
    const userJson = sessionStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : null;
    const role = user?.roleName || user?.role || user?.RoleName; // be flexible
    if (!role) return <Navigate to="/login" replace />;
    return allow.includes(role) ? <Outlet /> : <Navigate to="/" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
};

export default RoleRoute;
