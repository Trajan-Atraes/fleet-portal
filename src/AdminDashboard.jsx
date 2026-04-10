import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import AllRequests    from "./tabs/AdminServiceRequests";
import Companies      from "./tabs/AdminCompanies";
import Billing        from "./tabs/AdminBilling";
// import Receivables    from "./tabs/AdminReceivables"; // hidden — restore when ready
import VehicleRegistry from "./tabs/AdminVehicleRegistry";
import UserManagement from "./tabs/AdminUserManagement";
import Inventory      from "./tabs/AdminInventory";
import AuditLog       from "./tabs/AdminAuditLog";
import { IcoWrench, IcoBuilding, IcoUsers, IcoDollar, IcoMenu, IcoUserCog, IcoCar, IcoBox, IcoShield, IcoBell } from "./components/Icons";

// ─── PORTAL-SPECIFIC OVERRIDES (ADMIN — DARK MAROON BADGE) ───
const css = `
  /* ── Admin portal tag (dark maroon) ── */
  .auth-logo .portal-tag {
    background:rgba(80,10,10,0.6); color:#fca5a5;
    border:1px solid rgba(80,10,10,0.9);
  }
  .sidebar-portal-tag {
    margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
    background:rgba(80,10,10,0.6); color:#fca5a5; border:1px solid rgba(80,10,10,0.9);
    border-radius:3px; padding:2px 6px;
  }

  /* ── Notification bell ── */
  .notif-wrapper { position:relative; }
  .notif-bell { background:none; border:none; cursor:pointer; color:var(--muted); padding:4px; display:flex; align-items:center; position:relative; transition:color 0.15s; }
  .notif-bell:hover { color:var(--text); }
  .notif-badge { position:absolute; top:-2px; right:-4px; min-width:16px; height:16px; border-radius:8px; background:#ef4444; color:#fff; font-size:10px; font-weight:700; display:flex; align-items:center; justify-content:center; padding:0 4px; line-height:1; pointer-events:none; }
  .notif-dropdown { position:absolute; top:calc(100% + 8px); right:0; width:360px; max-height:440px; background:var(--surface); border:1px solid var(--border); border-radius:8px; box-shadow:0 8px 32px rgba(0,0,0,0.4); z-index:1000; display:flex; flex-direction:column; overflow:hidden; }
  .notif-dropdown-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid var(--border); }
  .notif-dropdown-header h3 { margin:0; font-size:13px; font-weight:700; color:var(--text); letter-spacing:0.06em; }
  .notif-dropdown-body { flex:1; overflow-y:auto; }
  .notif-item { padding:12px 16px; border-bottom:1px solid var(--border); cursor:pointer; transition:background 0.12s; }
  .notif-item:last-child { border-bottom:none; }
  .notif-item:hover { background:rgba(255,255,255,0.03); }
  .notif-item.unread { background:rgba(59,130,246,0.06); }
  .notif-item.unread:hover { background:rgba(59,130,246,0.1); }
  .notif-item-header { display:flex; align-items:center; gap:6px; margin-bottom:4px; }
  .notif-item-dot { width:6px; height:6px; border-radius:50%; background:#3b82f6; flex-shrink:0; }
  .notif-item-title { font-size:12px; font-weight:600; color:var(--text); }
  .notif-item-msg { font-size:11px; color:var(--muted); line-height:1.4; }
  .notif-item-time { font-size:10px; color:var(--dim); margin-top:4px; }
  .notif-empty { padding:32px 16px; text-align:center; color:var(--dim); font-size:12px; }
  .notif-type-warning .notif-item-dot { background:#f59e0b; }
  .notif-type-action .notif-item-dot { background:#ef4444; }

  /* ── Legacy line-item aliases for modal compat ── */
  .line-item-row { display:grid; grid-template-columns:1fr 60px 90px 80px 28px; gap:6px; margin-bottom:6px; align-items:center; }
  .line-item-row-header { display:grid; grid-template-columns:1fr 60px 90px 80px 28px; gap:6px; margin-bottom:4px; }
  .line-item-header-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); }
`;

// ─── ADMIN AUTH ───────────────────────────────────────────────
function AdminAuth({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err || !data?.session) {
      setError(err?.message || "Invalid credentials.");
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "admin" } }).then(null, () => {});
      return;
    }
    const { data: adminData, error: adminErr } = await supabase.from("admins").select("id, display_name").eq("id", data.session.user.id).single();
    if (adminErr || !adminData) {
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "admin", reason: "not_admin" } }).then(null, () => {});
      await supabase.auth.signOut();
      setError("Access denied. This account does not have admin privileges.");
      return;
    }
    supabase.rpc("log_auth_event", { p_action: "login_success", p_status: "success", p_metadata: { portal: "admin" } }).then(null, () => {});
    onLogin(data.session, adminData.display_name || null);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span>JUR<em>MOB</em>Y</span>
          <span className="portal-tag">Admin</span>
        </div>
        <h2>Admin Portal</h2>
        <p className="sub">Sign in to manage service requests and accounts</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        <button className="btn btn-primary" style={{ width:"100%", marginTop:8 }} onClick={handleSubmit} disabled={loading || !email || !password}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function AdminApp() {
  const navigate = useNavigate();
  const [session, setSession]             = useState(null);
  const [adminDisplayName, setAdminDisplayName] = useState(null);
  const [isSuper, setIsSuper]                 = useState(false);
  const [tab, setTab]                     = useState(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    return ["requests","companies","billing","vehicles","inventory","users","audit"].includes(p) ? p : "requests";
  });
  const [sidebarOpen, setSidebarOpen]     = useState(() => window.innerWidth > 768);
  const [loading, setLoading]             = useState(true);
  const [refreshKey, setRefreshKey]       = useState(0);
  const [hasUpdates, setHasUpdates]       = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!sess) { navigate("/"); return; }
      const { data: adminRow } = await supabase.from("admins")
        .select("id, display_name, is_super").eq("id", sess.user.id).maybeSingle();
      if (!adminRow) { navigate("/"); return; }
      setSession(sess);
      setAdminDisplayName(adminRow.display_name || null);
      setIsSuper(!!adminRow.is_super);
      setLoading(false);
    });
  }, []);

  // Realtime subscriptions — show "new updates" banner on external changes
  useEffect(() => {
    if (!session) return;
    const mark = () => setHasUpdates(true);
    const channel = supabase.channel("admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, mark)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, mark)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_lines" }, mark)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const applyUpdates = () => { setHasUpdates(false); setRefreshKey(k => k + 1); };

  // ─── NOTIFICATIONS ──────────────────────────────────────────
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds]             = useState(new Set());
  const [notifOpen, setNotifOpen]         = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!session) return;
    const [{ data: notifs }, { data: reads }] = await Promise.all([
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("notification_reads").select("notification_id").eq("user_id", session.user.id),
    ]);
    setNotifications(notifs || []);
    setReadIds(new Set((reads || []).map(r => r.notification_id)));
  }, [session]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime: new notifications appear instantly
  useEffect(() => {
    if (!session) return;
    const ch = supabase.channel("admin-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => fetchNotifications())
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markRead = async (notifId) => {
    if (readIds.has(notifId)) return;
    setReadIds(prev => new Set([...prev, notifId]));
    await supabase.from("notification_reads").insert({ notification_id: notifId, user_id: session.user.id });
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !readIds.has(n.id));
    if (!unread.length) return;
    setReadIds(new Set(notifications.map(n => n.id)));
    await supabase.from("notification_reads").insert(unread.map(n => ({ notification_id: n.id, user_id: session.user.id })));
  };

  const handleNotifClick = (n) => {
    markRead(n.id);
    if (n.link_tab && ["requests","companies","billing","vehicles","inventory","users","audit"].includes(n.link_tab)) {
      handleNav(n.link_tab);
    }
    setNotifOpen(false);
  };

  const formatNotifTime = (ts) => {
    const d = new Date(ts), now = new Date(), diff = (now - d) / 1000;
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const handleLogout = async () => {
    supabase.rpc("log_auth_event", { p_action: "logout", p_status: "success", p_metadata: { portal: "admin" } }).then(null, () => {});
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleNav = (id) => {
    setTab(id);
    const url = new URL(window.location);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", url);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const navItems = [
    { id:"requests",    label:"Service Requests", icon:<IcoWrench /> },
    { id:"companies",   label:"DSPs",             icon:<IcoBuilding /> },
    { id:"billing",     label:"Billing",          icon:<IcoDollar /> },
    // { id:"receivables", label:"Receivables",      icon:<IcoDollar /> }, // hidden — restore when ready
    { id:"vehicles",    label:"Vehicle Registry", icon:<IcoCar /> },
    { id:"inventory",   label:"Inventory",         icon:<IcoBox /> },
    { id:"users",       label:"User Management",  icon:<IcoUserCog /> },
    ...(isSuper ? [{ id:"audit", label:"Audit Log", icon:<IcoShield /> }] : []),
  ];

  const pageTitle = { requests:"Service Requests", companies:"DSPs", billing:"Billing", /* receivables:"Receivables", */ vehicles:"Vehicle Registry", inventory:"Inventory", users:"User Management", audit:"Audit Log" };

  if (loading) return <style>{css}</style>;

  return (
    <>
      <style>{css}</style>
      <div className="app-shell">
          {/* SIDEBAR OVERLAY (mobile) */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          {/* SIDEBAR */}
          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <div className="sidebar-logo">JUR<em>MOB</em>Y</div>
              <span className="sidebar-portal-tag">Admin</span>
            </div>
            <nav className="sidebar-nav">
              <div className="sidebar-section-label">Navigation</div>
              {navItems.map(item => (
                <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => handleNav(item.id)}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-user-email">{adminDisplayName || session.user?.email}</div>
              <button className="btn btn-ghost btn-sm" style={{ width:"100%" }} onClick={handleLogout}>Sign Out</button>
            </div>
          </aside>

          {/* MAIN */}
          <main className="main-area">
            <div className="main-header">
              <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}><IcoMenu /></button>
              <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
                <div className="notif-wrapper" ref={notifRef}>
                  <button className="notif-bell" onClick={() => setNotifOpen(o => !o)} title="Notifications">
                    <IcoBell />
                    {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
                  </button>
                  {notifOpen && (
                    <div className="notif-dropdown">
                      <div className="notif-dropdown-header">
                        <h3>Notifications</h3>
                        {unreadCount > 0 && (
                          <button className="btn btn-ghost btn-sm" style={{ fontSize:"10px", padding:"2px 8px" }} onClick={markAllRead}>Mark all read</button>
                        )}
                      </div>
                      <div className="notif-dropdown-body">
                        {notifications.length === 0 ? (
                          <div className="notif-empty">No notifications</div>
                        ) : notifications.map(n => (
                          <div key={n.id} className={`notif-item notif-type-${n.type} ${readIds.has(n.id) ? "" : "unread"}`} onClick={() => handleNotifClick(n)}>
                            <div className="notif-item-header">
                              {!readIds.has(n.id) && <span className="notif-item-dot" />}
                              <span className="notif-item-title">{n.title}</span>
                            </div>
                            <div className="notif-item-msg">{n.message}</div>
                            <div className="notif-item-time">{formatNotifTime(n.created_at)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="main-header-title">{pageTitle[tab]}</div>
              </div>
              {hasUpdates && (
                <button className="btn btn-sm" onClick={applyUpdates} style={{ background:"var(--blue-dim)", color:"#60a5fa", border:"1px solid rgba(59,130,246,0.3)" }}>
                  New updates — click to refresh
                </button>
              )}
            </div>
            <div className="main-content">
              {tab === "requests"  && <AllRequests key={refreshKey} adminDisplayName={adminDisplayName} />}
              {tab === "companies" && <Companies key={refreshKey} />}
              {tab === "billing"     && <Billing key={refreshKey} adminDisplayName={adminDisplayName} />}
              {/* {tab === "receivables" && <Receivables adminDisplayName={adminDisplayName} />} */}{/* hidden — restore when ready */}
              {tab === "vehicles"    && <VehicleRegistry key={refreshKey} adminDisplayName={adminDisplayName} />}
              {tab === "inventory"   && <Inventory key={refreshKey} />}
              {tab === "users"    && <UserManagement key={refreshKey} onAdminDisplayNameChange={setAdminDisplayName} isSuper={isSuper} />}
              {tab === "audit"   && <AuditLog key={refreshKey} />}
            </div>
          </main>
      </div>
    </>
  );
}
