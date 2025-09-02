import { useState } from "react";
import "./Login.css";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/auth-context"; // ⬅️ use the context

const Login = () => {
  const nav = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (err) setErr("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setErr("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setErr("");

      // Auth via context (it will store token + fetch /Users/me)
      const ok = await login(form.email.trim(), form.password, remember);
      if (!ok) {
        setErr("Invalid credentials or server error.");
        return;
      }

      // Decide where to go based on role (from sessionStorage set by AuthProvider)
      const me = (() => {
        try { return JSON.parse(sessionStorage.getItem("user") || "{}"); }
        catch { return {}; }
      })();
      const role = me?.roleName || me?.role || "";

      if (role === "Admin")       return nav("/dashboard/admin", { replace: true });
      if (role === "RentalAgent") return nav("/dashboard/agent", { replace: true });
      return nav("/dashboard/customer", { replace: true }); // default
    } catch (ex) {
      setErr(ex?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="card-head">
          <div className="crest" aria-hidden>
            <ShieldCheck size={22} />
          </div>
          <h1 className="brand-title">RoadReady</h1>
          <p className="sub">Sign in to access your account</p>
        </div>

        <form onSubmit={submit} noValidate>
          {/* email */}
          <div className="field">
            <label htmlFor="email">Email address</label>
            <div className="input-wrap">
              <Mail className="icon" aria-hidden />
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={change}
                placeholder="you@example.com"
                className="input"
                autoComplete="email"
                inputMode="email"
                required
                autoFocus
              />
            </div>
          </div>

          {/* password */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <Lock className="icon" aria-hidden />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={change}
                placeholder="Enter password"
                className="input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                aria-label={showPw ? "Hide password" : "Show password"}
                onClick={() => setShowPw((v) => !v)}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* row: remember + forgot */}
          <div className="row-actions">
            <label className="remember">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <span className="spacer" /> {/* pushes link to the right */}
            <Link to="/forgot-password" className="link small">Forgot password?</Link>
          </div>

          {/* error */}
          {err && (
            <div role="alert" aria-live="polite" className="alert">
              {err}
            </div>
          )}

          {/* submit */}
          <button
            type="submit"
            className={`btn-primary w-100 ${loading ? "is-loading" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="spin" size={18} /> Signing in…
              </>
            ) : (
              "Sign In"
            )}
          </button>

          {/* bottom links */}
          <div className="row-actions" style={{justifyContent:'center', gap:8}}>
            <span className="muted small">New to RoadReady?</span>
            <Link to="/signup" className="link small">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;