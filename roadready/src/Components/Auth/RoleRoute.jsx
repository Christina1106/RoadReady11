import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RoleRoute({ allow = [] }) {
  const location = useLocation(); // ✅ inside component

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  let user = {};
  try { user = JSON.parse(sessionStorage.getItem("user") || "{}"); }
  catch { user = {}; }

  const role = (user.roleName || user.role || "").toString();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allow.length && !allow.includes(role)) {
    // Not allowed → you can choose a different destination if you prefer
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}




// import { Navigate, Outlet } from "react-router-dom";

// const RoleRoute = ({ allow }) => {
//   try {
//     const userJson = sessionStorage.getItem("user");
//     const user = userJson ? JSON.parse(userJson) : null;
//     const role = user?.roleName || user?.role || user?.RoleName; // be flexible
//     if (!role) return <Navigate to="/login" replace />;
//     return allow.includes(role) ? <Outlet /> : <Navigate to="/" replace />;
//   } catch {
//     return <Navigate to="/login" replace />;
//   }
// };

// export default RoleRoute;

