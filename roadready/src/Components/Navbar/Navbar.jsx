import { Link, NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const nav = useNavigate();
  const token = sessionStorage.getItem("token");
  const user = (() => { try { return JSON.parse(sessionStorage.getItem("user")||"{}"); } catch { return {}; }})();
  const role = user?.roleName || user?.role || user?.RoleName;

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    nav("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <span className="me-2" style={{ fontSize: 22 }}>🚗</span> RoadReady
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#rrNav">
          <span className="navbar-toggler-icon" />
        </button>
        <div className="collapse navbar-collapse" id="rrNav">
          <ul className="navbar-nav mx-auto">
            <li className="nav-item"><NavLink className="nav-link" to="/">Home</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/cars">Cars</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/about">About</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/contact">Contact</NavLink></li>
          </ul>
          {!token ? (
            <div className="d-flex gap-2">
              <NavLink className="btn btn-link rr-link-btn" to="/login">Login</NavLink>
              <button className="btn btn-success">Sign Up</button>
            </div>
          ) : (
            <div className="d-flex gap-2 align-items-center">
              {role === "Admin" && <NavLink to="/dashboard/admin" className="btn btn-outline-success btn-sm">Admin</NavLink>}
              {role === "RentalAgent" && <NavLink to="/dashboard/agent" className="btn btn-outline-success btn-sm">Agent</NavLink>}
              {role === "Customer" && <NavLink to="/dashboard/customer" className="btn btn-outline-success btn-sm">My Area</NavLink>}
              <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
export default Navbar;
