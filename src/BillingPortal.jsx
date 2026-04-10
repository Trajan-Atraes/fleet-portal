import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { IcoCard, IcoActivity, IcoFile } from "./components/Icons";

// ─── PORTAL-SPECIFIC OVERRIDES (BILLING — BLUE BADGE) ────────
const css = `
  /* ── Billing portal tag (blue) ── */
  .auth-logo .portal-tag {
    background:rgba(59,130,246,0.15); color:#60a5fa;
    border:1px solid rgba(59,130,246,0.35);
  }
  .sidebar-portal-tag {
    margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
    background:rgba(59,130,246,0.15); color:#60a5fa; border:1px solid rgba(59,130,246,0.35);
    border-radius:3px; padding:2px 6px;
  }

  /* ── Billing-specific badges ── */
  .badge.paid    { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.22); }
  .badge.overdue { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.22); }
  .badge.active  { background:rgba(139,92,246,0.12); color:#a78bfa; border:1px solid rgba(139,92,246,0.22); }

  /* ── Billing stat overrides ── */
  .stat-delta { font-size:10px; color:var(--muted); margin-top:4px; }

  /* ── Section title ── */
  .section-title { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:var(--snow); margin-bottom:10px; }

  /* ── Plan cards ── */
  .plan-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:20px; }
  .plan-card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:16px; }
  .plan-card.current { border-color:var(--accent-rim); background:var(--accent-dim); }
  .plan-name { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:900; text-transform:uppercase; letter-spacing:0.08em; color:var(--snow); margin-bottom:4px; }
  .plan-price { font-family:'Barlow Condensed',sans-serif; font-size:26px; font-weight:900; color:var(--white); line-height:1; }
  .plan-price span { font-size:12px; color:var(--muted); font-weight:400; font-family:'Barlow',sans-serif; }
  .plan-feature { font-size:11px; color:var(--body); margin-top:8px; display:flex; flex-direction:column; gap:4px; }
  .plan-feature-item { display:flex; align-items:center; gap:6px; }
  .plan-feature-dot { width:3px; height:3px; border-radius:50%; background:var(--accent); flex-shrink:0; }
  .plan-current-tag { font-size:9px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); margin-bottom:8px; }

  @media (max-width:900px) {
    .plan-grid { grid-template-columns:1fr; }
  }
`;

// ─── BILLING AUTH ─────────────────────────────────────────────
function BillingAuth({ onLogin }) {
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
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "billing" } }).then(null, () => {});
      return;
    }
    supabase.rpc("log_auth_event", { p_action: "login_success", p_status: "success", p_metadata: { portal: "billing" } }).then(null, () => {});
    // In production: check billing_users or admins table
    onLogin(data.session);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span>JUR<em>MOB</em>Y</span>
          <span className="portal-tag">Billing</span>
        </div>
        <h2>Billing Portal</h2>
        <p className="sub">Manage subscriptions, invoices, and payment methods</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="billing@company.com" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
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

// ─── OVERVIEW TAB ─────────────────────────────────────────────
function Overview() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Billing Overview</div>
          <div className="page-sub">Subscription status, usage, and payment summary</div>
        </div>
      </div>

      <div className="stats-row stats-4">
        <div className="stat-card">
          <div className="stat-label">Monthly Recurring</div>
          <div className="stat-value c-purple">—</div>
          <div className="stat-delta">Awaiting billing data</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Plans</div>
          <div className="stat-value c-green">—</div>
          <div className="stat-delta">Awaiting billing data</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Invoices Due</div>
          <div className="stat-value c-amber">—</div>
          <div className="stat-delta">Awaiting billing data</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Billed (YTD)</div>
          <div className="stat-value c-blue">—</div>
          <div className="stat-delta">Awaiting billing data</div>
        </div>
      </div>

      <div className="section-title">Subscription Plans</div>
      <div className="plan-grid">
        <div className="plan-card">
          <div className="plan-name">Starter</div>
          <div className="plan-price">$99<span>/mo</span></div>
          <div className="plan-feature">
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Up to 50 vehicles</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>3 client accounts</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>2 mechanic seats</span></div>
          </div>
        </div>
        <div className="plan-card current">
          <div className="plan-current-tag">Current Plan</div>
          <div className="plan-name">Professional</div>
          <div className="plan-price">$299<span>/mo</span></div>
          <div className="plan-feature">
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Up to 250 vehicles</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Unlimited client accounts</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>10 mechanic seats</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Billing portal access</span></div>
          </div>
        </div>
        <div className="plan-card">
          <div className="plan-name">Enterprise</div>
          <div className="plan-price">Custom</div>
          <div className="plan-feature">
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Unlimited vehicles</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Unlimited accounts</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Dedicated support</span></div>
            <div className="plan-feature-item"><span className="plan-feature-dot"/><span>Custom integrations</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── INVOICES TAB ─────────────────────────────────────────────
function Invoices() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Invoices</div>
          <div className="page-sub">All billing invoices and payment history</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6}>
                <div className="empty-state" style={{ padding:"40px 24px" }}>
                  <h3>No invoices yet</h3>
                  <p>Invoice history will appear here once billing is configured.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PAYMENT METHODS TAB ──────────────────────────────────────
function PaymentMethods() {
  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Payment Methods</div>
          <div className="page-sub">Manage saved cards and payment accounts</div>
        </div>
        <button className="btn btn-primary btn-sm">+ Add Card</button>
      </div>

      <div className="empty-state">
        <h3>No payment methods saved</h3>
        <p>Add a credit or debit card to enable automatic billing.</p>
        <button className="btn btn-primary" style={{ marginTop:14 }}>+ Add Payment Method</button>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function BillingApp() {
  const [session, setSession] = useState(null);
  const [tab, setTab]         = useState("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!sess) { window.location.href = "/"; return; }
      setSession(sess);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    supabase.rpc("log_auth_event", { p_action: "logout", p_status: "success", p_metadata: { portal: "billing" } }).then(null, () => {});
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const navItems = [
    { id:"overview",  label:"Overview",        icon:<IcoActivity /> },
    { id:"invoices",  label:"Invoices",         icon:<IcoFile /> },
    { id:"payment",   label:"Payment Methods",  icon:<IcoCard /> },
  ];

  const pageTitle = { overview:"Overview", invoices:"Invoices", payment:"Payment Methods" };

  return (
    <>
      <style>{css}</style>
      {loading || !session ? (
        <div style={{ height:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--base)", color:"var(--muted)", fontSize:13 }}>Loading…</div>
      ) : (
        <div className="app-shell">
          <aside className="sidebar">
            <div className="sidebar-header">
              <div className="sidebar-logo">JUR<em>MOB</em>Y</div>
              <span className="sidebar-portal-tag">Billing</span>
            </div>
            <nav className="sidebar-nav">
              <div className="sidebar-section-label">Navigation</div>
              {navItems.map(item => (
                <button key={item.id} className={`nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}>
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-user-email">{session.user?.email}</div>
              <button className="btn btn-ghost btn-sm" style={{ width:"100%" }} onClick={handleLogout}>Sign Out</button>
            </div>
          </aside>

          <main className="main-area">
            <div className="main-header">
              <div className="main-header-title">{pageTitle[tab]}</div>
            </div>
            <div className="main-content">
              {tab === "overview" && <Overview />}
              {tab === "invoices" && <Invoices />}
              {tab === "payment"  && <PaymentMethods />}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
