import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const location = useLocation(); // ✅ inside component
  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}




// import { Navigate, Outlet } from "react-router-dom";

// const ProtectedRoute = () => {
//   const hasToken = !!sessionStorage.getItem("token");
//   return hasToken ? <Outlet /> : <Navigate to="/login" replace />;
// };

// export default ProtectedRoute;
