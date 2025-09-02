import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import Logo from "../common/Logo";        // ← new
import "./Navbar.css";

export default function Navbar() {
  const nav = useNavigate();
  const collapseRef = useRef(null);
  const token = sessionStorage.getItem("token") || localStorage.getItem("token");
  const user = (() => { try { return JSON.parse(sessionStorage.getItem("user")||"{}"); } catch { return {}; }})();
  const role = (user.roleName || user.role || "").toString();

  const logout = () => { localStorage.removeItem("token"); sessionStorage.clear(); nav("/login"); };

  useEffect(() => {
    const node = collapseRef.current;
    if (!node) return;
    const onClick = (e) => {
      if (e.target.closest("a,button")) {
        const bs = window.bootstrap?.Collapse.getInstance(node);
        bs?.hide?.();
      }
    };
    node.addEventListener("click", onClick);
    return () => node.removeEventListener("click", onClick);
  }, []);

  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : "");

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm sticky-top rr-navbar">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold" to="/">
          <div className="rr-logo-wrap"><Logo size={28} /></div>
          <span>RoadReady</span>
        </Link>

        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#rrNav">
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="rrNav" ref={collapseRef}>
          <ul className="navbar-nav mx-auto">
            <li className="nav-item"><NavLink className={linkClass} to="/">Home</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/cars">Cars</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/about">About</NavLink></li>
            <li className="nav-item"><NavLink className={linkClass} to="/contact">Contact</NavLink></li>
          </ul>

          {!token ? (
            <div className="d-flex gap-2">
              <NavLink className="btn btn-outline-primary" to="/login">Login</NavLink>
              <NavLink className="btn btn-primary" to="/signup">Sign Up</NavLink>
            </div>
          ) : (
            <div className="d-flex gap-2 align-items-center">
              {role==="Admin"       && <NavLink to="/dashboard/admin"    className="btn btn-outline-success btn-sm">Admin</NavLink>}
              {role==="RentalAgent" && <NavLink to="/dashboard/agent"    className="btn btn-outline-success btn-sm">Agent</NavLink>}
              {role==="Customer"    && <NavLink to="/dashboard/customer" className="btn btn-outline-success btn-sm">My Area</NavLink>}
              <button className="btn btn-outline-danger btn-sm" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
