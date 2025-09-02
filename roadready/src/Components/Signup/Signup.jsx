import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { baseUrl } from "../../environment.dev";
import "./Signup.css";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErr(""); setOk("");
  };

  const submit = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.email || !form.password) {
      setErr("First name, email and password are required.");
      return;
    }
    if (form.password !== form.confirm) {
      setErr("Passwords do not match.");
      return;
    }

    try {
      setBusy(true);
      await axios.post(`${baseUrl}Authentication/register`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phoneNumber: form.phoneNumber,
        password: form.password,
      });
      setOk("Account created. You can sign in now.");
      setTimeout(() => nav("/login"), 900);
    } catch (ex) {
      const d = ex?.response?.data;
      setErr(d?.message || d?.Message || d?.error || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="su-bg">
      <div className="su-card">
        <header className="su-head">
          <h1 className="su-brand">RoadReady</h1>
          <p className="su-sub">Create your account</p>
        </header>

        <form onSubmit={submit} className="su-form">
          <div className="su-grid2">
            <div className="su-field">
              <label>First name</label>
              <input
                name="firstName"
                value={form.firstName}
                onChange={change}
                autoComplete="given-name"
              />
            </div>
            <div className="su-field">
              <label>Last name</label>
              <input
                name="lastName"
                value={form.lastName}
                onChange={change}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="su-field">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              autoComplete="email"
              placeholder="name@example.com"
            />
          </div>

          <div className="su-field">
            <label>Phone (optional)</label>
            <input
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={change}
              autoComplete="tel"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="su-grid2">
            <div className="su-field">
              <label>Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={change}
                autoComplete="new-password"
              />
            </div>
            <div className="su-field">
              <label>Confirm password</label>
              <input
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={change}
                autoComplete="new-password"
              />
            </div>
          </div>

          {err && <div className="su-alert err" role="alert">{err}</div>}
          {ok && <div className="su-alert ok" role="status">{ok}</div>}

          <button className="su-btn" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>

          <p className="su-foot">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
