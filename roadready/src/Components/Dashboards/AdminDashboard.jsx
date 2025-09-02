import { useEffect, useMemo, useState } from "react";
import "./AdminDashboard.css";
import api from "../../Interceptors/AuthInterceptor";
import {
  Menu, Search, LogOut,
  LineChart, Car, Users as UsersIcon, Wrench,
  Plus, Edit, Trash2, Settings
} from "lucide-react";
import AdminFleetTab from "./AdminFleetTab";

/* ---- helpers ---- */
const money = (n) =>
  Number(n || 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString() : "—");

const normalizeCar = (raw) => ({
  carId: raw.carId ?? raw.id,
  brandId: raw.brandId ?? raw.brand?.brandId,
  brandName: raw.brandName ?? raw.brand?.brandName ?? raw.brand ?? "",
  modelName: raw.modelName ?? raw.model ?? "",
  year: raw.year ?? raw.Year ?? "",
  dailyRate: raw.dailyRate ?? raw.pricePerDay ?? raw.DailyRate ?? 0,
  seats: raw.seats ?? raw.Seats ?? "",
  transmission: raw.transmission ?? raw.Transmission ?? "",
  fuelType: raw.fuelType ?? raw.FuelType ?? "",
  statusId: raw.statusId ?? raw.status?.statusId,
  statusName: raw.statusName ?? raw.status?.statusName ?? raw.status ?? "",
  imageUrl: raw.imageUrl ?? raw.imageURL ?? raw.image ?? "",
  description: raw.description ?? raw.Description ?? "",
});

const pillClass = (role) => {
  const r = (role || "").toLowerCase();
  if (r.includes("admin")) return "pill-purple";
  if (r.includes("agent")) return "pill-blue";
  return "pill-green";
};

// fallback map in case /Roles doesn't return ids (your DB seed uses these ids)
const roleIdByName = (name) => {
  const map = { admin: 1, rentalagent: 2, customer: 3 };
  return map[(name || "").toLowerCase()];
};

// allowed statuses for booking issues
const ISSUE_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export default function AdminDashboard() {
  const uStr = sessionStorage.getItem("user");
  const user = uStr ? JSON.parse(uStr) : null;
  const displayName = user?.firstName
  ? `${user.firstName} ${user.lastName || ""}`.trim()
  : (user?.email || "Admin");

const initials = displayName
  .split(/\s+/).filter(Boolean).slice(0,2).map(s => s[0]).join("").toUpperCase();


  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [section, setSection] = useState("dashboard"); // dashboard | fleet | users | reports

  // datasets
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  // maintenance + issues
  const [issues, setIssues] = useState([]);          // open maintenance (for KPI)
  const [openMaint, setOpenMaint] = useState([]);    // open maintenance (for reports table)
  const [allIssues, setAllIssues] = useState([]);    // booking issues (for reports table)

  // users ui
  const [uq, setUq] = useState("");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userSaving, setUserSaving] = useState(false);
  const [roles, setRoles] = useState([
    { roleName: "Admin" }, { roleName: "RentalAgent" }, { roleName: "Customer" }
  ]);

  /* ---- loaders ---- */
  const refreshCars = async () => {
    try {
      const res = await api.get("Cars");
      setCars((res.data || []).map(normalizeCar));
    } catch {
      setCars([]);
    }
  };
  const refreshBookings = async () => {
    try {
      const res = await api.get("Bookings");
      setBookings(res.data || []);
    } catch {
      setBookings([]);
    }
  };
  const refreshUsers = async () => {
    try {
      const res = await api.get("Users");
      setUsers(res.data || []);
    } catch {
      setUsers([]);
    }
  };
  // for dashboard KPI
  const refreshIssues = async () => {
    try {
      const res = await api.get("MaintenanceRequests/open").catch(() => ({ data: [] }));
      setIssues(res.data || []);
    } catch {
      setIssues([]);
    }
  };

  const refreshRoles = async () => {
    try {
      const res = await api.get("Roles"); // If your API exposes /Roles
      setRoles(res.data || []);
    } catch {
      // Safe fallback if there's no endpoint
      setRoles([{ roleName: "Admin" }, { roleName: "RentalAgent" }, { roleName: "Customer" }]);
    }
  };

  // reports data (open maintenance + booking issues)
  const loadReports = async () => {
    try {
      const [maintRes, issueRes] = await Promise.all([
        api.get("MaintenanceRequests/open"),
        api.get("BookingIssues"),
      ]);
      setOpenMaint(maintRes.data || []);
      setAllIssues(issueRes.data || []);
    } catch (e) {
      console.error(e);
      setOpenMaint([]);
      setAllIssues([]);
    }
  };

  useEffect(() => {
    refreshCars();
    refreshBookings();
    refreshUsers();
    refreshIssues(); // KPI
    refreshRoles();  // load roles for inline role editing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when switching to Reports, load those tables
  useEffect(() => {
    if (section === "reports") loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  /* ---- KPIs ---- */
  const totalRevenue = useMemo(
    () => bookings.reduce((s, b) => s + (Number(b.totalAmount) || 0), 0),
    [bookings]
  );
  const openIssueCount = issues.length;
  const availableCount = useMemo(
    () => cars.filter((c) => (c.statusName || "").toLowerCase() === "available").length,
    [cars]
  );

  /* ---- Users actions ---- */
  const openAddUser = () => { setEditingUser(null); setUserModalOpen(true); };
  const openEditUser = (u) => { setEditingUser(u); setUserModalOpen(true); };

  const saveUser = async (payload) => {
    try {
      setUserSaving(true);

      // ADD
      if (!editingUser?.userId && !editingUser?.id) {
        const rolesHaveIds = roles[0]?.roleId != null;
        let finalPayload = { ...payload };

        if (!rolesHaveIds) {
          const rid = roleIdByName(payload.roleName);
          if (!rid) {
            alert("Could not resolve role id. Make sure Roles API is available or choose a valid role.");
            return;
          }
          finalPayload = { ...payload, roleId: rid };
          delete finalPayload.roleName;
        }
        await api.post("Users", finalPayload);
      } else {
        const id = editingUser.userId ?? editingUser.id;
        await api.put(`Users/${id}`, payload);
      }

      await refreshUsers();
      setUserModalOpen(false);
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Save failed");
    } finally {
      setUserSaving(false);
    }
  };

  const toggleUserActive = async (u) => {
    const id = u.userId ?? u.id;
    const next = !(u.isActive ?? true);
    try {
      await api.patch(`Users/${id}/status`, { isActive: next });
      await refreshUsers();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || e.message || "Could not toggle status");
    }
  };

  // Inline role change (works with roleId or roleName APIs)
  const changeUserRole = async (u, value) => {
    const id = u.userId ?? u.id;
    const rolesHaveIds = roles[0]?.roleId != null;
    const body = rolesHaveIds ? { roleId: Number(value) } : { roleName: value };
    try {
      await api.patch(`Users/${id}/role`, body);
      await refreshUsers();
    } catch (e) {
      if (e?.response?.status === 401) {
        alert("401 Unauthorized. Log in again with an Admin account.");
        return;
      }
      alert(e?.response?.data?.message || e.message || "Could not change role");
    }
  };

  /* ---- Reports actions ---- */
  const markResolved = async (requestId) => {
    try {
      await api.patch(`MaintenanceRequests/${requestId}/resolve`);
      await loadReports();
      await refreshIssues(); // keep KPI in sync
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Could not resolve request");
    }
  };

  const setIssueStatus = async (issueId, status) => {
    try {
      await api.patch(`BookingIssues/${issueId}/status`, { status });
      await loadReports();
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Could not update issue status");
    }
  };

  return (
    <div className={`admin-shell ${sidebarOpen ? "is-open" : "is-collapsed"}`}>
      {/* sidebar */}
      <aside className="aside">
        <div className="aside-brand">
          <div className="logo">🏁</div>
          <div className="brand-txt">
            <div className="b1">RoadReady</div>
            <div className="b2">Admin</div>
          </div>
        </div>
        <nav className="aside-nav">
          <button className={`nav-item ${section === "dashboard" ? "active" : ""}`} onClick={() => setSection("dashboard")}>
            <LineChart size={18} /><span>Dashboard</span>
          </button>
          <button className={`nav-item ${section === "fleet" ? "active" : ""}`} onClick={() => setSection("fleet")}>
            <Car size={18} /><span>Fleet</span>
          </button>
          <button className={`nav-item ${section === "users" ? "active" : ""}`} onClick={() => setSection("users")}>
            <UsersIcon size={18} /><span>Users</span>
          </button>
          <button className={`nav-item ${section === "reports" ? "active" : ""}`} onClick={() => setSection("reports")}>
            <Wrench size={18} /><span>Reports</span>
          </button>
          <div className="aside-sep" />
          <button className="nav-item" disabled>
            <Settings size={18} /><span>Settings</span>
          </button>
        </nav>
      </aside>

      {/* header */}
      <header className="topbar">
        <div className="left">
          <button className="icon-btn" onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle menu">
            <Menu size={18} />
          </button>
          <div className="search">
            <Search size={16} />
            <input placeholder="Type to search…" disabled />
          </div>
        </div>
        <div className="right">
  <div className="user-badge">
    <div className="avatar">{initials}</div>
    <div className="name" title={displayName}>{displayName}</div>
  </div>
  <button
    className="btn ghost danger"
    onClick={() => { sessionStorage.clear(); localStorage.removeItem("token"); window.location.href = "/login"; }}
  >
    <LogOut size={16} /> Logout
  </button>
</div>

      </header>

      {/* content */}
      <main className="content">
        {/* Overview */}
        {section === "dashboard" && (
          <>
            <h2 className="h2">Overview</h2>
            <div className="kpis">
              <Kpi title="Total revenue" value={money(totalRevenue)} tone="green" />
              <Kpi title="Cars" value={`${cars.length}`} sub={`${availableCount} available`} tone="blue" />
              <Kpi title="Users" value={`${users.length}`} tone="purple" />
              <Kpi title="Open issues" value={`${openIssueCount}`} tone="red" />
            </div>

            <div className="card">
              <div className="card-head">Recent bookings</div>
              <div className="card-body">
                {bookings.slice(0, 6).map((b) => (
                  <div key={b.bookingId || b.id} className="row between">
                    <div>
                      <div className="row-strong">
                        #{b.bookingId} • {(b.car?.brandName || b.carBrandName || "—")} {(b.car?.model || b.carModel || "")}
                      </div>
                      <div className="muted small">
                        {fmtDate(b.pickupDateTimeUtc || b.startDate)} → {fmtDate(b.dropoffDateTimeUtc || b.endDate)}
                      </div>
                    </div>
                    <div className="row-amt">{money(b.totalAmount || 0)}</div>
                  </div>
                ))}
                {bookings.length === 0 && <div className="muted">No bookings.</div>}
              </div>
            </div>

            <div className="card">
              <div className="card-head">Maintenance & alerts</div>
              <div className="card-body">
                <ul className="bullets">
                  <li><span className="dot red" /> {openIssueCount} open maintenance issues</li>
                  <li><span className="dot amber" /> {cars.length - availableCount} cars currently rented</li>
                  <li><span className="dot green" /> Payments processing nominal</li>
                </ul>
              </div>
            </div>
          </>
        )}

        {/* Fleet */}
        {section === "fleet" && <AdminFleetTab />}

        {/* Users */}
        {section === "users" && (
          <>
            <div className="row between mb16">
              <h2 className="h2">Users</h2>
              <div className="row gap">
                <div className="search small">
                  <Search size={16} />
                  <input
                    placeholder="Search users…"
                    value={uq}
                    onChange={(e) => setUq(e.target.value)}
                  />
                </div>
                <button className="btn primary" onClick={openAddUser}>
                  <Plus size={16} /> Add User
                </button>
              </div>
            </div>

            <div className="card table-card">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th style={{ width: 220 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((u) =>
                      `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase().includes(uq.toLowerCase()) ||
                      (u.email || "").toLowerCase().includes(uq.toLowerCase()) ||
                      (u.roleName || u.role || "").toLowerCase().includes(uq.toLowerCase()) ||
                      String(u.phoneNumber || u.phone || "").includes(uq)
                    )
                    .map((u) => {
                      const id = u.userId ?? u.id;
                      const isActive = u.isActive ?? true;
                      const roleText = (u.roleName || u.role || "Customer").toString();
                      const rolesHaveIds = roles[0]?.roleId != null;

                      // keep select value stable even if backend didn't send roleId
                      const currentRoleValue = rolesHaveIds
                        ? String(u.roleId ?? (roles.find(r => r.roleName === roleText)?.roleId ?? ""))
                        : roleText;

                      return (
                        <tr key={id}>
                          <td>{u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : (u.name || "—")}</td>

                          {/* Role – dropdown if roles loaded, else pill */}
                          <td>
                            {roles.length ? (
                              rolesHaveIds ? (
                                <select
                                  className="select"
                                  value={currentRoleValue}
                                  onChange={(e) => changeUserRole(u, e.target.value)}
                                >
                                  {roles.map(r => (
                                    <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                                  ))}
                                </select>
                              ) : (
                                <select
                                  className="select"
                                  value={currentRoleValue}
                                  onChange={(e) => changeUserRole(u, e.target.value)}
                                >
                                  {roles.map(r => (
                                    <option key={r.roleName} value={r.roleName}>{r.roleName}</option>
                                  ))}
                                </select>
                              )
                            ) : (
                              <span className={`pill ${pillClass(roleText)}`}>{roleText}</span>
                            )}
                          </td>

                          <td>{u.email || "—"}</td>
                          <td>{u.phoneNumber || u.phone || "—"}</td>
                          <td>
                            <div className="row gap">
                              <button className="btn ghost" onClick={() => openEditUser(u)}>
                                <Edit size={16} /> Edit
                              </button>
                              <button
                                className={`btn ghost ${isActive ? "danger" : ""}`}
                                onClick={() => toggleUserActive(u)}
                              >
                                <Trash2 size={16} /> {isActive ? "Disable" : "Enable"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="muted">No users found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <UserFormModal
              open={userModalOpen}
              user={editingUser}
              onClose={() => setUserModalOpen(false)}
              onSave={saveUser}
              saving={userSaving}
              roles={roles}
            />
          </>
        )}

        {/* Reports */}
        {section === "reports" && (
          <>
            <h2 className="h2">Reports & Analytics</h2>

            {/* Maintenance requests (open) */}
            <div className="card table-card mb16">
              <div className="card-head">Maintenance requests (open)</div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Car</th>
                      <th>Description</th>
                      <th>Reported</th>
                      <th style={{ width: 140 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openMaint.length === 0 ? (
                      <tr><td colSpan={5} className="muted">No open maintenance.</td></tr>
                    ) : openMaint.map(r => {
                      const car = cars.find(c => c.carId === r.carId);
                      const carLabel = car ? `${car.brandName} ${car.modelName}` : `Car #${r.carId}`;
                      return (
                        <tr key={r.requestId}>
                          <td>#{r.requestId}</td>
                          <td>{carLabel}</td>
                          <td>{r.issueDescription}</td>
                          <td>{new Date(r.reportedDate).toLocaleString()}</td>
                          <td>
                            <button className="btn primary" onClick={() => markResolved(r.requestId)}>
                              Mark resolved
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Booking issues */}
            <div className="card table-card">
              <div className="card-head">Customer booking issues</div>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Booking</th>
                      <th>User</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th style={{ width: 160 }}>Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allIssues.length === 0 ? (
                      <tr><td colSpan={7} className="muted">No issues reported.</td></tr>
                    ) : allIssues.map(i => (
                      <tr key={i.issueId}>
                        <td>#{i.issueId}</td>
                        <td>#{i.bookingId}</td>
                        <td>{i.userId}</td>
                        <td>{i.issueType || "—"}</td>
                        <td style={{ maxWidth: 420 }}>{i.description}</td>
                        <td><span className="pill pill-blue">{i.status}</span></td>
                        <td>
                          <div className="row gap">
                            <select
                              className="select"
                              defaultValue={i.status}
                              onChange={(e) => setIssueStatus(i.issueId, e.target.value)}
                            >
                              {ISSUE_STATUSES.map(s => <option key={s}>{s}</option>)}
                            </select>
                            <button className="btn">Save</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ---- small ui ---- */
/* ---- small ui ---- */
function Kpi({ title, value, sub, tone = "blue" }) {
  return (
    <div className={`kpi ${tone}`}>
      <div className="kpi-title">{title}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}
// eslint-disable-next-line no-unused-vars
function Card({ title, children }) { /* ... */ }


/* ---- user modal ---- */
function UserFormModal({ open, user, onClose, onSave, saving, roles = [] }) {
  const rolesHaveIds = roles[0]?.roleId != null;

  // default role id (prefer "Customer" if present)
  const defaultRoleId = useMemo(() => {
    if (!rolesHaveIds) return undefined;
    const customer = roles.find(r => (r.roleName || "").toLowerCase() === "customer");
    return customer?.roleId ?? roles[0]?.roleId ?? 3;
  }, [rolesHaveIds, roles]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    // for Add only:
    roleId: rolesHaveIds ? "" : undefined,
    roleName: !rolesHaveIds ? "Customer" : undefined,
    password: "",
  });

  useEffect(() => {
    if (!open) return;

    if (user) {
      // EDIT mode (role changes are done inline in the table)
      setForm({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || user.phone || "",
        password: "",
        roleId: undefined,
        roleName: undefined,
      });
    } else {
      // ADD mode
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        roleId: rolesHaveIds ? (defaultRoleId ?? roles[0]?.roleId ?? "") : undefined,
        roleName: !rolesHaveIds ? (roles[0]?.roleName ?? "Customer") : undefined,
      });
    }
  }, [open, user, rolesHaveIds, roles, defaultRoleId]);

  if (!open) return null;

  const change = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const submit = (e) => {
    e.preventDefault();

    const base = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber?.trim() || null,
    };

    if (user) {
      onSave(base);
      return;
    }

    // ADD
    const payload = {
      ...base,
      ...(rolesHaveIds
        ? { roleId: Number(form.roleId || defaultRoleId) }
        : { roleName: form.roleName }),
      ...(form.password ? { password: form.password } : {}),
    };

    onSave(payload);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h3>{user ? "Edit User" : "Add User"}</h3>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <form className="sheet-form" onSubmit={submit}>
          <div className="grid two">
            <label className="field">
              <span>First name</span>
              <input name="firstName" value={form.firstName} onChange={change} required />
            </label>

            <label className="field">
              <span>Last name</span>
              <input name="lastName" value={form.lastName} onChange={change} />
            </label>

            <label className="field">
              <span>Email</span>
              <input type="email" name="email" value={form.email} onChange={change} required />
            </label>

            <label className="field">
              <span>Phone</span>
              <input name="phoneNumber" value={form.phoneNumber} onChange={change} />
            </label>

            {/* Role + Password only for ADD */}
            {!user && (
              <>
                <label className="field">
                  <span>Role</span>
                  {rolesHaveIds ? (
                    <select
                      name="roleId"
                      value={String(form.roleId ?? defaultRoleId ?? "")}
                      onChange={change}
                      required
                    >
                      {(roles.length ? roles : [
                        { roleId: 1, roleName: "Admin" },
                        { roleId: 2, roleName: "RentalAgent" },
                        { roleId: 3, roleName: "Customer" },
                      ]).map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                      ))}
                    </select>
                  ) : (
                    <select
                      name="roleName"
                      value={form.roleName}
                      onChange={change}
                      required
                    >
                      {(roles.length ? roles : [
                        { roleName: "Admin" },
                        { roleName: "RentalAgent" },
                        { roleName: "Customer" },
                      ]).map(r => (
                        <option key={r.roleName} value={r.roleName}>{r.roleName}</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="field col-2">
                  <span>Password (temporary)</span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={change}
                    placeholder="Optional – can be set later"
                  />
                </label>
              </>
            )}

            {user && (
              <div className="col-2 small muted" style={{ marginTop: -4 }}>
                To change role, use the Role dropdown in the table.
              </div>
            )}
          </div>

          <div className="sheet-actions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
