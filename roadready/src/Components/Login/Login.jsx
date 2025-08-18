// src/Components/Login/Login.jsx
import { useState } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "../../environment.dev";

const Tabs = ({ role, setRole }) => (
  <div className="rr-tabs d-flex gap-2 mb-3">
    <button type="button" className={`btn rr-tab ${role==="customer"?"active":""}`} onClick={()=>setRole("customer")} aria-pressed={role==="customer"}><span className="me-2">👤</span>Customer</button>
    <button type="button" className={`btn rr-tab ${role==="admin"?"active":""}`} onClick={()=>setRole("admin")} aria-pressed={role==="admin"}><span className="me-2">🛡️</span>Admin</button>
    <button type="button" className={`btn rr-tab ${role==="agent"?"active":""}`} onClick={()=>setRole("agent")} aria-pressed={role==="agent"}><span className="me-2">🔧</span>Rental Agent</button>
  </div>
);

const Login = () => {
  const nav = useNavigate();
  const [role,setRole] = useState("customer"); // visual only
  const [form,setForm] = useState({ email:"", password:"" });
  const [showPw,setShowPw] = useState(false);
  const [err,setErr] = useState("");

  const change = (e)=>{ const {name,value}=e.target; setForm(f=>({...f,[name]:value})); if(err) setErr(""); };

  const submit = async (e)=>{
    e.preventDefault();
    setErr("");

    if(!form.email || !form.password){
      setErr("Email and password are required.");
      return;
    }

    try {
      // --- 1) LOGIN (plain axios to avoid interceptor variables) ---
      const loginUrl = `${baseUrl}Authentication/login`; // e.g. http://localhost:5047/api/Authentication/login
      console.log("POST", loginUrl, form);
      const { data } = await axios.post(loginUrl, { email: form.email, password: form.password });

      const token = data?.token || data?.Token || data?.accessToken || data?.jwt;
      if (!token) throw new Error("Token missing in response");
      sessionStorage.setItem("token", token);

      // --- 2) OPTIONAL PROFILE (non-blocking) ---
      try {
        const meUrl = `${baseUrl}Users/me`;
        console.log("GET", meUrl);
        const me = await axios.get(meUrl, { headers: { Authorization: `Bearer ${token}` } });
        const meData = me?.data || {};
        sessionStorage.setItem("user", JSON.stringify(meData));

        // role-based redirect if we have it
        const roleName = meData.roleName || meData.role || meData.RoleName;
        if (roleName === "Admin")  return nav("/dashboard/admin");
        if (roleName === "RentalAgent") return nav("/dashboard/agent");
        return nav("/dashboard/customer");
      } catch (profileErr) {
        console.warn("Profile load failed (continuing):", profileErr);
        // Fall back if /Users/me not ready yet
        nav("/");
      }
    } catch (ex) {
      console.error("Login error:", ex?.response || ex);
      const status = ex?.response?.status;
      const resp   = ex?.response?.data;
      let msg = resp?.message || resp?.Message || resp?.error || ex?.message || "Login failed";
      if (status === 404) msg = "Login endpoint not found (404). Check baseUrl & route.";
      setErr(msg);
    }
  };

  const resetForm = ()=>{ setForm({ email:"", password:"" }); setErr(""); };

  return (
    <div className="container rr-hero">
      <div className="text-center mb-4">
        <div className="text-success mb-3" style={{ fontSize: 56 }}>🚗</div>
        <h1 className="fw-bold mb-2">Welcome to RoadReady</h1>
        <p className="text-muted mb-0">Sign in to your account</p>
      </div>

      <div className="d-flex flex-column align-items-center">
        <Tabs role={role} setRole={setRole} />

        <div className="rr-card shadow-sm p-4">
          <h6 className="fw-bold mb-1">
            {role==="admin" ? "Admin Login" : role==="agent" ? "Rental Agent Login" : "Customer Login"}
          </h6>
          <p className="text-muted mb-3">
            {role==="admin" ? "Admin access only" : role==="agent" ? "Handle bookings, pickups/returns, and payments" : "Access your bookings and rental history"}
          </p>

          <form onSubmit={submit}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input className="form-control" name="email" type="email"
                     placeholder="Enter your email" value={form.email}
                     onChange={change} autoComplete="username"/>
            </div>

            <div className="mb-2">
              <label className="form-label fw-semibold">Password</label>
              <div className="input-group">
                <input className="form-control" name="password" type={showPw?"text":"password"}
                       placeholder="Enter your password" value={form.password}
                       onChange={change} autoComplete="current-password"/>
                <button type="button" className="btn btn-outline-secondary"
                        onClick={()=>setShowPw(s=>!s)} aria-label="Toggle password visibility">
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="mb-3 d-flex justify-content-between">
              <Link to="/forgot-password" className="text-decoration-none small">Forgot password?</Link>
              <button type="button" className="btn btn-link p-0 small" onClick={resetForm}>Clear</button>
            </div>

            {err && <div className="alert alert-danger py-2">{err}</div>}

            <button type="submit" className="btn btn-success w-100 py-2">Sign In</button>
          </form>

          <div className="text-center mt-3">
            <span className="small text-muted">Don't have an account? </span>
            <Link to="/signup" className="small text-decoration-none">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
