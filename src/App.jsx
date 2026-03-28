import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ICONS ───────────────────────────────────────────────────
const IcoWrench = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const IcoPlus  = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoRefresh = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;

// ─── DESIGN TOKENS (CLIENT PORTAL — AMBER ACCENT) ────────────
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
    --accent:     #f59e0b;
    --accent-hot: #fbbf24;
    --accent-dim: rgba(245,158,11,0.10);
    --accent-rim: rgba(245,158,11,0.22);
    --green:  #10b981; --green-dim:  rgba(16,185,129,0.12);
    --red:    #ef4444; --red-dim:    rgba(239,68,68,0.12);
    --blue:   #3b82f6; --blue-dim:   rgba(59,130,246,0.12);
    --purple: #8b5cf6; --purple-dim: rgba(139,92,246,0.12);
    --topbar-h: 44px;
  }

  html, body { height: 100%; }
  body { font-family:'Barlow',sans-serif; background:var(--base); color:var(--text); overflow:hidden; }
  ::-webkit-scrollbar { width:5px; height:5px; }
  ::-webkit-scrollbar-track { background:transparent; }
  ::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
  ::-webkit-scrollbar-thumb:hover { background:var(--rim); }

  /* ── AUTH ── */
  .auth-wrap { height:100dvh; display:grid; grid-template-columns:1.3fr 1fr; }
  .auth-hero {
    background:var(--surface); border-right:1px solid var(--border);
    display:flex; flex-direction:column; justify-content:center; padding:72px 64px;
    position:relative; overflow:hidden;
  }
  .auth-hero::before {
    content:''; position:absolute; inset:0;
    background:radial-gradient(ellipse at 85% 40%, rgba(245,158,11,0.07) 0%, transparent 65%);
    pointer-events:none;
  }
  .auth-hero-eyebrow {
    font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700;
    letter-spacing:0.28em; text-transform:uppercase; color:var(--accent); margin-bottom:20px;
  }
  .auth-hero-logo {
    font-family:'Barlow Condensed',sans-serif; font-size:clamp(56px,6.5vw,88px);
    font-weight:900; line-height:0.9; text-transform:uppercase; letter-spacing:-0.01em;
    color:var(--white); margin-bottom:8px; position:relative; z-index:1;
  }
  .auth-hero-logo em { color:var(--accent); font-style:normal; }
  .auth-hero-sub {
    font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:600;
    text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-bottom:32px;
  }
  .auth-hero p { font-size:14px; color:var(--soft); line-height:1.7; max-width:340px; margin-bottom:36px; }
  .feature-list { display:flex; flex-direction:column; gap:10px; }
  .feature-item { display:flex; align-items:center; gap:10px; font-size:13px; color:var(--body); }
  .feature-dot { width:3px; height:3px; border-radius:50%; background:var(--accent); flex-shrink:0; }

  .auth-form-panel { background:var(--base); display:flex; align-items:center; justify-content:center; padding:48px; }
  .auth-card { width:100%; max-width:340px; animation:slideUp 0.3s ease; }
  @keyframes slideUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }

  .auth-card-logo {
    font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900;
    letter-spacing:0.08em; text-transform:uppercase; color:var(--white); margin-bottom:28px;
    display:flex; align-items:center; gap:6px;
  }
  .auth-card-logo span { color:var(--accent); }
  .auth-card-logo .portal-tag {
    font-size:9px; font-weight:700; letter-spacing:0.2em;
    background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-rim);
    border-radius:3px; padding:2px 6px;
  }
  .auth-card h2 {
    font-family:'Barlow Condensed',sans-serif; font-size:24px; font-weight:700;
    text-transform:uppercase; letter-spacing:0.05em; color:var(--snow); margin-bottom:4px;
  }
  .auth-card .sub { font-size:12px; color:var(--muted); margin-bottom:24px; }

  /* ── FORM ── */
  .field { margin-bottom:14px; }
  label {
    display:block; font-size:10px; font-weight:600; letter-spacing:0.18em;
    text-transform:uppercase; color:var(--muted); margin-bottom:5px;
  }
  input, select, textarea {
    width:100%; background:var(--raised); border:1px solid var(--border);
    border-radius:5px; padding:8px 11px; font-family:'Barlow',sans-serif;
    font-size:13px; color:var(--white); outline:none;
    transition:border-color 0.15s, box-shadow 0.15s;
  }
  input::placeholder, textarea::placeholder { color:var(--dim); }
  input:focus, select:focus, textarea:focus {
    border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-dim);
  }
  select option { background:var(--surface); }
  textarea { resize:vertical; min-height:80px; line-height:1.5; }

  /* ── BUTTONS ── */
  .btn {
    display:inline-flex; align-items:center; justify-content:center; gap:6px;
    padding:8px 16px; border-radius:5px; font-family:'Barlow Condensed',sans-serif;
    font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap;
  }
  .btn-primary { background:var(--accent); color:#000; }
  .btn-primary:hover:not(:disabled) { background:var(--accent-hot); }
  .btn-primary:active:not(:disabled) { transform:scale(0.97); }
  .btn-primary:disabled { opacity:0.4; cursor:not-allowed; }
  .btn-ghost { background:transparent; border:1px solid var(--border); color:var(--body); }
  .btn-ghost:hover { border-color:var(--rim); color:var(--text); }
  .btn-danger { background:transparent; border:1px solid rgba(239,68,68,0.25); color:var(--red); }
  .btn-danger:hover { background:var(--red-dim); }
  .btn-sm { padding:5px 11px; font-size:11px; }

  /* ── FEEDBACK ── */
  .error-box {
    background:var(--red-dim); border:1px solid rgba(239,68,68,0.25);
    border-radius:4px; padding:9px 12px; font-size:12px; color:#fca5a5; margin-bottom:14px;
  }
  .success-box {
    background:var(--green-dim); border:1px solid rgba(16,185,129,0.25);
    border-radius:4px; padding:9px 12px; font-size:12px; color:#6ee7b7; margin-bottom:14px;
  }

  /* ── APP SHELL ── */
  .app-shell { height:100dvh; display:flex; flex-direction:column; overflow:hidden; }

  /* ── TOPBAR ── */
  .topbar {
    background:var(--surface); border-bottom:1px solid var(--border);
    padding:0 20px; height:var(--topbar-h);
    display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
  }
  .topbar-left { display:flex; align-items:stretch; height:var(--topbar-h); gap:0; }
  .topbar-brand {
    font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900;
    text-transform:uppercase; letter-spacing:0.07em; color:var(--white);
    display:flex; align-items:center; margin-right:20px; gap:0;
  }
  .topbar-brand em { color:var(--accent); font-style:normal; }
  .topbar-nav { display:flex; align-items:stretch; gap:0; }
  .topbar-tab {
    font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:0.14em; text-transform:uppercase; padding:0 16px; height:100%;
    display:flex; align-items:center; gap:6px; cursor:pointer; border:none;
    background:transparent; color:var(--muted); border-bottom:2px solid transparent;
    transition:all 0.15s;
  }
  .topbar-tab:hover { color:var(--text); background:rgba(255,255,255,0.02); }
  .topbar-tab.active { color:var(--accent); border-bottom-color:var(--accent); }

  .topbar-right { display:flex; align-items:center; gap:10px; }
  .topbar-company { color:var(--accent); font-weight:600; font-size:11px; }
  .topbar-email { color:var(--muted); font-size:11px; }

  /* ── CONTENT ── */
  .content-area { flex:1; overflow-y:auto; padding:20px; }

  /* ── STATS ROW ── */
  .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:16px; }
  .stat-card {
    background:var(--raised); border:1px solid var(--border); border-radius:5px;
    padding:12px 14px; display:flex; flex-direction:column; gap:5px;
  }
  .stat-label {
    font-size:10px; font-weight:600; letter-spacing:0.18em;
    text-transform:uppercase; color:var(--muted);
  }
  .stat-value {
    font-family:'Barlow Condensed',sans-serif; font-size:30px; font-weight:900;
    color:var(--white); line-height:1;
  }
  .stat-value.c-amber  { color:var(--accent); }
  .stat-value.c-blue   { color:#60a5fa; }
  .stat-value.c-green  { color:#34d399; }
  .stat-value.c-red    { color:#f87171; }
  .stat-value.c-purple { color:#a78bfa; }

  /* ── TABLE ── */
  .table-wrap { background:var(--raised); border:1px solid var(--border); border-radius:5px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:var(--surface); border-bottom:1px solid var(--border); }
  th {
    font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700;
    letter-spacing:0.18em; text-transform:uppercase; color:var(--muted);
    padding:0 14px; height:30px; text-align:left; white-space:nowrap;
  }
  td {
    padding:0 14px; height:32px; font-size:13px;
    border-bottom:1px solid rgba(28,45,66,0.6); vertical-align:middle;
  }
  tr:last-child td { border-bottom:none; }
  tbody tr:hover td { background:rgba(255,255,255,0.025); cursor:default; }
  .mono { font-family:monospace; font-size:11px; letter-spacing:0.03em; color:var(--soft); }

  /* ── BADGES ── */
  .badge {
    display:inline-flex; align-items:center; gap:5px; padding:0 7px; height:18px;
    border-radius:3px; font-family:'Barlow Condensed',sans-serif; font-size:10px;
    font-weight:700; letter-spacing:0.12em; text-transform:uppercase; white-space:nowrap;
  }
  .badge-dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }
  .badge.pending     { background:rgba(245,158,11,0.12); color:#fbbf24; border:1px solid rgba(245,158,11,0.22); }
  .badge.pending .badge-dot     { background:#fbbf24; }
  .badge.in_progress { background:rgba(59,130,246,0.12); color:#60a5fa; border:1px solid rgba(59,130,246,0.22); }
  .badge.in_progress .badge-dot { background:#60a5fa; animation:pulse 1.5s infinite; }
  .badge.completed   { background:rgba(16,185,129,0.12); color:#34d399; border:1px solid rgba(16,185,129,0.22); }
  .badge.completed .badge-dot   { background:#34d399; }
  .badge.cancelled   { background:rgba(75,85,99,0.12); color:#6b7280; border:1px solid rgba(75,85,99,0.2); }
  .badge.cancelled .badge-dot   { background:#6b7280; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.2;} }

  /* ── URGENCY ── */
  .urg { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; font-family:'Barlow Condensed',sans-serif; }
  .urg.low    { color:var(--green); }
  .urg.medium { color:var(--accent); }
  .urg.high   { color:var(--red); }

  /* ── PAGE HEADER ── */
  .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
  .page-title { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; text-transform:uppercase; letter-spacing:0.04em; color:var(--snow); }
  .page-sub { font-size:11px; color:var(--muted); margin-top:2px; }

  /* ── TOOLBAR ── */
  .toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap; }
  .filters { display:flex; gap:5px; flex-wrap:wrap; }
  .filter-btn {
    font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700;
    letter-spacing:0.1em; text-transform:uppercase; padding:0 11px; height:24px;
    border-radius:3px; cursor:pointer; border:1px solid var(--border);
    background:transparent; color:var(--muted); transition:all 0.15s; display:flex; align-items:center;
  }
  .filter-btn:hover { border-color:var(--rim); color:var(--body); }
  .filter-btn.active { background:var(--accent); border-color:var(--accent); color:#000; }

  .search-input {
    background:var(--raised); border:1px solid var(--border); border-radius:4px;
    padding:0 10px; height:26px; font-size:12px; color:var(--text); outline:none; width:200px;
    font-family:'Barlow',sans-serif;
  }
  .search-input::placeholder { color:var(--dim); }
  .search-input:focus { border-color:var(--rim); }

  /* ── MODAL ── */
  .modal-overlay {
    position:fixed; inset:0; background:rgba(0,0,0,0.78);
    display:flex; align-items:center; justify-content:center; z-index:500; padding:20px;
    animation:fadeIn 0.18s ease;
  }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  .modal {
    background:var(--raised); border:1px solid var(--border); border-radius:7px;
    width:100%; max-width:500px; max-height:90vh; overflow-y:auto;
  }
  .modal-head {
    padding:18px 22px 0; display:flex; align-items:flex-start; justify-content:space-between;
    position:sticky; top:0; background:var(--raised); z-index:1;
  }
  .modal-head h3 {
    font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900;
    text-transform:uppercase; letter-spacing:0.06em; color:var(--snow);
  }
  .modal-head-sub { font-size:11px; color:var(--muted); margin-top:2px; }
  .modal-close { background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer; line-height:1; padding:0; }
  .modal-close:hover { color:var(--text); }
  .modal-body { padding:16px 22px 22px; }

  .detail-grid { display:grid; grid-template-columns:100px 1fr; row-gap:2px; column-gap:10px; margin-bottom:14px; font-size:13px; }
  .detail-label { font-size:10px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); display:flex; align-items:center; }
  .detail-value { color:var(--text); display:flex; align-items:center; }
  hr.divider { border:none; border-top:1px solid var(--border); margin:14px 0; }

  /* ── VEHICLE BLOCK ── */
  .vehicle-block {
    background:var(--plate); border-radius:5px; padding:12px 14px; margin-bottom:14px;
    border:1px solid var(--border);
  }
  .vehicle-block-eyebrow { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .vehicle-block-id { font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; text-transform:uppercase; color:var(--white); }
  .vehicle-block-meta { font-size:12px; color:var(--soft); margin-top:3px; }

  /* ── NEW REQUEST FORM ── */
  .card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:18px 20px; margin-bottom:14px; }
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .form-grid .full { grid-column:1/-1; }
  .urgency-group { display:flex; gap:6px; }
  .urgency-pill {
    flex:1; padding:7px; border-radius:4px; border:1px solid var(--border);
    text-align:center; cursor:pointer; font-family:'Barlow Condensed',sans-serif;
    font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    transition:all 0.15s; background:transparent; color:var(--muted);
  }
  .urgency-pill.low.selected    { background:var(--green-dim); border-color:var(--green); color:var(--green); }
  .urgency-pill.medium.selected { background:var(--accent-dim); border-color:var(--accent); color:var(--accent); }
  .urgency-pill.high.selected   { background:var(--red-dim); border-color:var(--red); color:var(--red); }

  /* ── EMPTY STATE ── */
  .empty-state { text-align:center; padding:56px 24px; }
  .empty-state h3 { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--body); margin-bottom:6px; }
  .empty-state p { font-size:12px; color:var(--muted); }

  /* ── LOADING ── */
  .loading-row { text-align:center; padding:40px; font-size:12px; color:var(--muted); }

  /* ── RESPONSIVE ── */
  @media (max-width:768px) {
    .auth-wrap { grid-template-columns:1fr; }
    .auth-hero { display:none; }
    .form-grid { grid-template-columns:1fr; }
    .stats-row { grid-template-columns:1fr 1fr; }
    .content-area { padding:14px; }
  }
`;

// ─── COMPONENTS ──────────────────────────────────────────────

function StatusBadge({ status }) {
  const labels = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />
      {labels[status] || status}
    </span>
  );
}

// ─── AUTH SCREEN ─────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err || !data?.session) { setError(err?.message || "Invalid email or password."); return; }
    onLogin(data.session);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-hero-eyebrow">Fleet Maintenance Platform</div>
        <div className="auth-hero-logo">JUR<em>MOB</em>Y</div>
        <div className="auth-hero-sub">Client Portal</div>
        <p>Submit maintenance requests, track service progress, and manage your entire fleet from one workspace.</p>
        <div className="feature-list">
          <div className="feature-item"><span className="feature-dot"/><span>Real-time request tracking</span></div>
          <div className="feature-item"><span className="feature-dot"/><span>Full service history per vehicle</span></div>
          <div className="feature-item"><span className="feature-dot"/><span>Urgency-based prioritization</span></div>
          <div className="feature-item"><span className="feature-dot"/><span>Multi-vehicle fleet support</span></div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-logo">
            <span>JUR<span>MOB</span>Y</span>
            <span className="portal-tag">Client</span>
          </div>
          <h2>Sign In</h2>
          <p className="sub">Access your fleet maintenance account</p>

          {error && <div className="error-box">{error}</div>}

          <div className="field">
            <label>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          </div>

          <button className="btn btn-primary" style={{ width:"100%", marginTop:8 }}
            onClick={handleSubmit} disabled={loading || !email || !password}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE TYPES ────────────────────────────────────────────
const SERVICE_TYPES = [
  "Oil Change", "Tire Rotation / Replacement", "Brake Service",
  "Engine Diagnostics", "Transmission Service", "Battery / Electrical",
  "A/C & Heating", "Suspension & Steering", "Fleet Inspection",
  "Preventive Maintenance", "Body Damage / Collision", "Other",
];

// ─── REQUEST FORM ─────────────────────────────────────────────
function RequestForm({ session, company, onSuccess }) {
  const [form, setForm] = useState({
    vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"",
    vehicle_year:"", urgency:"medium", description:"", mileage:"",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null); // null=unchecked, []|[...]=checked
  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (["vin", "mileage"].includes(k)) setDuplicateWarning(null);
  };

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.description) {
      setError("Please fill in Vehicle ID and describe the issue."); return;
    }
    setLoading(true); setError("");

    // Duplicate check — only when VIN + mileage are both present
    if (form.vin && form.mileage && duplicateWarning === null) {
      const { data: dupes } = await supabase
        .from("service_requests")
        .select("id, request_number, status")
        .eq("vin", form.vin.trim())
        .eq("mileage", parseInt(form.mileage))
        .in("status", ["pending", "in_progress"]);
      if (dupes && dupes.length > 0) {
        setDuplicateWarning(dupes);
        setLoading(false);
        return;
      }
    }

    const { error: err } = await supabase.from("service_requests").insert({
      ...form,
      client_id: session.user.id,
      company_id: company.id,
      status: "pending",
      mileage: form.mileage ? parseInt(form.mileage) : null,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setForm({ vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", urgency:"medium", description:"", mileage:"" });
    setTimeout(() => { setSuccess(false); onSuccess(); }, 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">New Service Request</div>
          <div className="page-sub">Submit a maintenance or repair request for your fleet vehicle</div>
        </div>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">Request submitted — redirecting to dashboard…</div>}

      {duplicateWarning && duplicateWarning.length > 0 && (
        <div style={{ background:"var(--amber-dim)", border:"1px solid rgba(245,158,11,0.35)", borderRadius:6, padding:"12px 14px", marginBottom:14 }}>
          <div style={{ fontWeight:700, color:"var(--amber)", fontSize:13, marginBottom:6 }}>⚠ Possible Duplicate Request</div>
          <div style={{ fontSize:12, color:"var(--body)", marginBottom:6 }}>
            An active service request with the same VIN, service type, and mileage already exists:
          </div>
          {duplicateWarning.map(sr => (
            <div key={sr.id} style={{ fontSize:12, color:"var(--soft)", marginBottom:2 }}>
              SR-{sr.request_number} — <span style={{ textTransform:"capitalize" }}>{sr.status.replace("_", " ")}</span>
            </div>
          ))}
          <div style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>
            Click <strong>Submit Anyway</strong> to create this request, or edit the VIN, service type, or mileage to dismiss.
          </div>
        </div>
      )}

      <div className="card">
        <div className="form-grid">
          <div className="field">
            <label>Vehicle ID / Unit # <span style={{color:"var(--red)"}}>*</span></label>
            <input value={form.vehicle_id} onChange={e => set("vehicle_id", e.target.value)} placeholder="e.g. UNIT-042" />
          </div>
          <div className="field">
            <label>VIN</label>
            <input value={form.vin} onChange={e => set("vin", e.target.value)} placeholder="e.g. 1HGBH41JXMN109186" style={{fontFamily:"monospace",fontSize:12}} />
          </div>
          <div className="field">
            <label>Current Mileage</label>
            <input type="number" value={form.mileage} onChange={e => set("mileage", e.target.value)} placeholder="e.g. 84500" />
          </div>
          <div className="field">
            <label>Make</label>
            <input value={form.vehicle_make} onChange={e => set("vehicle_make", e.target.value)} placeholder="e.g. Ford" />
          </div>
          <div className="field">
            <label>Model</label>
            <input value={form.vehicle_model} onChange={e => set("vehicle_model", e.target.value)} placeholder="e.g. F-150" />
          </div>
          <div className="field">
            <label>Year</label>
            <input value={form.vehicle_year} onChange={e => set("vehicle_year", e.target.value)} placeholder="e.g. 2021" />
          </div>
          <div className="field full">
            <label>Urgency</label>
            <div className="urgency-group">
              {["low","medium","high"].map(u => (
                <button key={u}
                  className={`urgency-pill ${u} ${form.urgency === u ? "selected" : ""}`}
                  onClick={() => set("urgency", u)}>
                  {u === "low" ? "Low" : u === "medium" ? "Medium" : "High"}
                </button>
              ))}
            </div>
          </div>
          <div className="field full">
            <label>Issue Description <span style={{color:"var(--red)"}}>*</span></label>
            <textarea value={form.description} onChange={e => set("description", e.target.value)}
              placeholder="Describe the issue — symptoms, when it started, warning lights, etc." />
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting…" : duplicateWarning && duplicateWarning.length > 0 ? "Submit Anyway" : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ session, company, switchToForm }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("all");

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("service_requests").select("*")
      .eq("company_id", company.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [company?.id]);

  const counts = {
    total:       requests.length,
    pending:     requests.filter(r => r.status === "pending").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed:   requests.filter(r => r.status === "completed").length,
  };

  const STATUS_LABELS = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };
  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Service Requests</div>
          <div className="page-sub">All maintenance requests for {company?.name}</div>
        </div>
        <button className="btn btn-primary" onClick={switchToForm}>
          <IcoPlus /> New Request
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{counts.total}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value c-amber">{counts.pending}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value c-blue">{counts.in_progress}</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value c-green">{counts.completed}</div></div>
      </div>

      <div className="toolbar">
        <div className="filters">
          {["all","pending","in_progress","completed","cancelled"].map(s => (
            <button key={s} className={`filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? `All (${counts.total})` : `${STATUS_LABELS[s]} (${counts[s] ?? 0})`}
            </button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      {loading ? (
        <div className="loading-row">Loading requests…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{filter === "all" ? "No requests yet" : "No requests found"}</h3>
          <p style={{ marginBottom:16 }}>
            {filter === "all" ? "Submit your first service request to get started." : "Try changing the filter."}
          </p>
          {filter === "all" && (
            <button className="btn btn-primary" onClick={switchToForm}><IcoPlus /> New Request</button>
          )}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>VIN</th>
                <th>Service Type</th>
                <th>Mileage</th>
                <th>Urgency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color:"var(--dim)", fontSize:11, fontFamily:"monospace" }}>
                    {String(i + 1).padStart(3, "0")}
                  </td>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </td>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase" }}>{r.vehicle_id}</span>
                    {(r.vehicle_make || r.vehicle_model) && (
                      <span style={{ color:"var(--muted)", fontSize:11, marginLeft:8, fontWeight:400 }}>
                        {[r.vehicle_year, r.vehicle_make, r.vehicle_model].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </td>
                  <td className="mono">{r.vin || "—"}</td>
                  <td style={{ fontSize:13 }}>{r.service_type}</td>
                  <td style={{ fontSize:12, color:"var(--soft)", fontFamily:"monospace" }}>
                    {r.mileage ? Number(r.mileage).toLocaleString() + " mi" : "—"}
                  </td>
                  <td><span className={`urg ${r.urgency}`}>{r.urgency}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const [session, setSession]           = useState(null);
  const [company, setCompany]           = useState(null);
  const [displayName, setDisplayName]   = useState(null);
  const [tab, setTab]                   = useState("dashboard");
  const [noCompany, setNoCompany]       = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const handleLogin = async (sess) => {
    setSession(sess);
    setLoadingCompany(true);

    const { data: cuData } = await supabase
      .from("company_users").select("company_id, display_name").eq("user_id", sess.user.id).limit(1);

    if (!cuData || cuData.length === 0) {
      setNoCompany(true); setLoadingCompany(false); return;
    }

    const { data: companyData } = await supabase
      .from("companies").select("id, name").eq("id", cuData[0].company_id).limit(1);

    if (!companyData || companyData.length === 0) {
      setNoCompany(true); setLoadingCompany(false); return;
    }

    setCompany(companyData[0]);
    setDisplayName(cuData[0].display_name || null);
    setLoadingCompany(false);
    setTab("dashboard");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setCompany(null); setNoCompany(false);
  };

  return (
    <>
      <style>{css}</style>

      {!session ? (
        <AuthScreen onLogin={handleLogin} />
      ) : loadingCompany ? (
        <div style={{ height:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)", fontSize:13 }}>
          Loading account…
        </div>
      ) : noCompany ? (
        <div style={{ height:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:12, padding:32 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:900, textTransform:"uppercase", color:"var(--snow)" }}>No Company Assigned</div>
          <div style={{ fontSize:12, color:"var(--muted)", textAlign:"center", maxWidth:340 }}>Your account hasn't been linked to a company. Contact your administrator.</div>
          <button className="btn btn-ghost" onClick={handleLogout}>Sign Out</button>
        </div>
      ) : company ? (
        <div className="app-shell">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-brand"><span>JUR<em>MOB</em>Y</span></div>
              <nav className="topbar-nav">
                <button className={`topbar-tab ${tab === "dashboard" ? "active" : ""}`} onClick={() => setTab("dashboard")}>
                  <IcoWrench /> My Requests
                </button>
                <button className={`topbar-tab ${tab === "new" ? "active" : ""}`} onClick={() => setTab("new")}>
                  <IcoPlus /> New Request
                </button>
              </nav>
            </div>
            <div className="topbar-right">
              <span className="topbar-company">{company?.name}</span>
              <span className="topbar-email">{displayName || session.user?.email}</span>
              <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Sign Out</button>
            </div>
          </div>

          <div className="content-area">
            {tab === "dashboard" ? (
              <Dashboard session={session} company={company} switchToForm={() => setTab("new")} />
            ) : (
              <RequestForm session={session} company={company} onSuccess={() => setTab("dashboard")} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
