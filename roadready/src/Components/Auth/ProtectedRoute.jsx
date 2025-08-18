import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const hasToken = !!sessionStorage.getItem("token");
  return hasToken ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
