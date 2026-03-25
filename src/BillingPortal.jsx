import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ICONS ───────────────────────────────────────────────────
const IcoCard     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>;
const IcoActivity = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcoFile     = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;

// ─── DESIGN TOKENS (BILLING PORTAL — PURPLE ACCENT) ──────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@400;500;600&display=swap');

  :root {
    --base:    #070b11;
    --surface: #0d1520;
    --raised:  #111c2c;
    --plate:   #162338;
    --border:  #1c2d42;
    --rim:     #243a55;
    --dim:     #374f68;
    --muted:   #526a84;
    --soft:    #738fa8;
    --body:    #9ab2c8;
    --text:    #bfd0e2;
    --snow:    #dae7f2;
    --white:   #edf4fd;
    --accent:     #8b5cf6;
    --accent-hot: #a78bfa;
    --accent-dim: rgba(139,92,246,0.10);
    --accent-rim: rgba(139,92,246,0.22);
    --green:  #10b981; --green-dim:  rgba(16,185,129,0.12);
    --red:    #ef4444; --red-dim:    rgba(239,68,68,0.12);
    --blue:   #3b82f6; --blue-dim:   rgba(59,130,246,0.12);
    --amber:  #f59e0b;
    --sidebar-w: 216px;
    --topbar-h:  44px;
    --row-h:     32px;
  }

  html, body { height:100%; }
  body { font-family:'Barlow',sans-serif; background:var(--base); color:var(--text); overflow:hidden; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:var(--rim); }

  /* ── AUTH ── */
  .auth-wrap { height:100dvh; display:flex; align-items:center; justify-content:center; background:var(--base); }
  .auth-card { width:100%; max-width:360px; padding:40px; background:var(--raised); border:1px solid var(--border); border-radius:8px; animation:slideUp 0.3s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  .auth-logo { font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; letter-spacing:0.07em; text-transform:uppercase; color:var(--white); display:flex; align-items:center; gap:6px; margin-bottom:28px; }
  .auth-logo em { color:var(--accent); font-style:normal; }
  .auth-logo .portal-tag { font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-rim); border-radius:3px; padding:2px 6px; }
  .auth-card h2 { font-family:'Barlow Condensed',sans-serif; font-size:24px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--snow); margin-bottom:4px; }
  .auth-card .sub { font-size:12px; color:var(--muted); margin-bottom:24px; }

  /* ── FORM ── */
  .field { margin-bottom:14px; }
  label { display:block; font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
  input, select { width:100%; background:var(--plate); border:1px solid var(--border); border-radius:5px; padding:8px 11px; font-family:'Barlow',sans-serif; font-size:13px; color:var(--white); outline:none; transition:border-color 0.15s, box-shadow 0.15s; }
  input::placeholder { color:var(--dim); }
  input:focus, select:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-dim); }
  select option { background:var(--surface); }

  /* ── BUTTONS ── */
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:8px 16px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:var(--accent); color:var(--white); }
  .btn-primary:hover:not(:disabled) { background:var(--accent-hot); }
  .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
  .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--body); }
  .btn-ghost:hover { border-color:var(--rim); color:var(--text); }
  .btn-sm { padding:5px 11px; font-size:11px; }

  /* ── FEEDBACK ── */
  .error-box { background:var(--red-dim); border:1px solid rgba(239,68,68,0.25); border-radius:4px; padding:9px 12px; font-size:12px; color:#fca5a5; margin-bottom:14px; }

  /* ── SIDEBAR LAYOUT ── */
  .app-shell { height:100dvh; display:flex; overflow:hidden; background:var(--base); }
  .sidebar { width:var(--sidebar-w); background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; height:100%; }
  .sidebar-header { height:var(--topbar-h); display:flex; align-items:center; padding:0 16px; border-bottom:1px solid var(--border); flex-shrink:0; }
  .sidebar-logo { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900; letter-spacing:0.07em; text-transform:uppercase; color:var(--white); }
  .sidebar-logo em { color:var(--accent); font-style:normal; }
  .sidebar-portal-tag { margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-rim); border-radius:3px; padding:2px 6px; }
  .sidebar-nav { flex:1; padding:8px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
  .sidebar-section-label { font-size:9px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--dim); padding:10px 8px 4px; }
  .nav-item { display:flex; align-items:center; gap:9px; padding:0 10px; height:32px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; background:transparent; color:var(--muted); transition:all 0.15s; width:100%; text-align:left; }
  .nav-item:hover { background:var(--raised); color:var(--text); }
  .nav-item.active { background:var(--accent-dim); color:var(--accent); }
  .sidebar-bottom { border-top:1px solid var(--border); padding:12px 14px; flex-shrink:0; }
  .sidebar-user-email { font-size:10px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; }

  /* ── MAIN ── */
  .main-area { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
  .main-header { height:var(--topbar-h); background:var(--surface); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 20px; flex-shrink:0; }
  .main-header-title { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:var(--snow); }
  .main-content { flex:1; overflow-y:auto; padding:20px; }

  /* ── STATS ── */
  .stats-row { display:grid; gap:10px; margin-bottom:20px; }
  .stats-4 { grid-template-columns:repeat(4,1fr); }
  .stat-card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:14px 16px; }
  .stat-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .stat-value { font-family:'Barlow Condensed',sans-serif; font-size:28px; font-weight:900; color:var(--white); line-height:1; }
  .stat-value.c-purple { color:#a78bfa; }
  .stat-value.c-green  { color:#34d399; }
  .stat-value.c-amber  { color:#fbbf24; }
  .stat-value.c-blue   { color:#60a5fa; }
  .stat-delta { font-size:10px; color:var(--muted); margin-top:4px; }

  /* ── TABLE ── */
  .table-wrap { background:var(--raised); border:1px solid var(--border); border-radius:5px; overflow:hidden; margin-bottom:20px; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:var(--surface); border-bottom:1px solid var(--border); }
  th { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); padding:0 14px; height:30px; text-align:left; white-space:nowrap; }
  td { padding:0 14px; height:32px; font-size:13px; border-bottom:1px solid rgba(28,45,66,0.6); vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tbody tr:hover td { background:rgba(255,255,255,0.02); }
  .mono { font-family:monospace; font-size:11px; color:var(--soft); }

  /* ── BADGE ── */
  .badge { display:inline-flex; align-items:center; gap:5px; padding:0 7px; height:18px; border-radius:3px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; white-space:nowrap; }
  .badge.paid    { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.22); }
  .badge.pending { background:rgba(245,158,11,0.12); color:#fbbf24; border:1px solid rgba(245,158,11,0.22); }
  .badge.overdue { background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.22); }
  .badge.active  { background:rgba(139,92,246,0.12); color:#a78bfa; border:1px solid rgba(139,92,246,0.22); }

  /* ── PAGE HEADER ── */
  .page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:8px; }
  .page-title { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; text-transform:uppercase; letter-spacing:0.04em; color:var(--snow); }
  .page-sub { font-size:11px; color:var(--muted); margin-top:2px; }

  /* ── EMPTY ── */
  .empty-state { text-align:center; padding:56px 24px; }
  .empty-state h3 { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--body); margin-bottom:6px; }
  .empty-state p { font-size:12px; color:var(--muted); }

  /* ── SECTION TITLE ── */
  .section-title { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:var(--snow); margin-bottom:10px; }

  /* ── PLAN CARD ── */
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
    .stats-4 { grid-template-columns:1fr 1fr; }
    .plan-grid { grid-template-columns:1fr; }
    .main-content { padding:14px; }
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
    if (err || !data?.session) { setError(err?.message || "Invalid credentials."); return; }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
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
      {!session ? (
        <BillingAuth onLogin={setSession} />
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
