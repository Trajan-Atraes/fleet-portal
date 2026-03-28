import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import NotesLog from "./components/NotesLog";
import ServiceLinesEditor from "./components/ServiceLinesEditor";

const SUPABASE_URL = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ICONS ───────────────────────────────────────────────────
const IcoWrench  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const IcoRefresh = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoChevron = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoPlus    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoMenu    = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;

// ─── DESIGN TOKENS (MECHANIC PORTAL — TEAL ACCENT) ───────────
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
  .auth-card {
    width:100%; max-width:360px; padding:40px;
    background:var(--raised); border:1px solid var(--border); border-radius:8px;
    animation:slideUp 0.3s ease;
  }
  @keyframes slideUp { from{opacity:0;transform:translateY(14px);} to{opacity:1;transform:translateY(0);} }
  .auth-logo { font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; letter-spacing:0.07em; text-transform:uppercase; color:var(--white); display:flex; align-items:center; gap:6px; margin-bottom:28px; }
  .auth-logo em { color:var(--accent); font-style:normal; }
  .auth-logo .portal-tag { font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; background:rgba(13,148,136,0.15); color:#2dd4bf; border:1px solid rgba(13,148,136,0.35); border-radius:3px; padding:2px 6px; }
  .auth-card h2 { font-family:'Barlow Condensed',sans-serif; font-size:24px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--snow); margin-bottom:4px; }
  .auth-card .sub { font-size:12px; color:var(--muted); margin-bottom:24px; }

  /* ── FORM ── */
  .field { margin-bottom:14px; }
  label { display:block; font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
  input, select, textarea { width:100%; background:var(--plate); border:1px solid var(--border); border-radius:5px; padding:8px 11px; font-family:'Barlow',sans-serif; font-size:13px; color:var(--white); outline:none; transition:border-color 0.15s, box-shadow 0.15s; }
  input::placeholder, textarea::placeholder { color:var(--dim); }
  input:focus, select:focus, textarea:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-dim); }
  select option { background:var(--surface); }
  textarea { resize:vertical; min-height:80px; line-height:1.5; }

  /* ── BUTTONS ── */
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:8px 16px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
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
  .error-box { background:var(--red-dim); border:1px solid rgba(239,68,68,0.25); border-radius:4px; padding:9px 12px; font-size:12px; color:#fca5a5; margin-bottom:14px; }
  .success-box { background:var(--green-dim); border:1px solid rgba(16,185,129,0.25); border-radius:4px; padding:9px 12px; font-size:12px; color:#6ee7b7; margin-bottom:14px; }

  /* ── SIDEBAR LAYOUT ── */
  .app-shell { height:100dvh; display:flex; overflow:hidden; background:var(--base); }
  .sidebar { width:var(--sidebar-w); background:var(--surface); border-right:1px solid var(--border); display:flex; flex-direction:column; flex-shrink:0; height:100%; }
  .sidebar-header { height:var(--topbar-h); display:flex; align-items:center; padding:0 16px; border-bottom:1px solid var(--border); flex-shrink:0; }
  .sidebar-logo { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900; letter-spacing:0.07em; text-transform:uppercase; color:var(--white); }
  .sidebar-logo em { color:var(--accent); font-style:normal; }
  .sidebar-portal-tag { margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; background:rgba(13,148,136,0.15); color:#2dd4bf; border:1px solid rgba(13,148,136,0.35); border-radius:3px; padding:2px 6px; }
  .sidebar-nav { flex:1; padding:8px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
  .sidebar-section-label { font-size:9px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--dim); padding:10px 8px 4px; }
  .nav-item { display:flex; align-items:center; gap:9px; padding:0 10px; height:32px; border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; background:transparent; color:var(--muted); transition:all 0.15s; width:100%; text-align:left; }
  .nav-item:hover { background:var(--raised); color:var(--text); }
  .nav-item.active { background:var(--accent-dim); color:var(--accent); }
  .sidebar-bottom { border-top:1px solid var(--border); padding:12px 14px; flex-shrink:0; }
  .sidebar-user-name { font-size:12px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .sidebar-user-email { font-size:10px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; }

  /* ── MAIN ── */
  .main-area { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
  .main-header { height:var(--topbar-h); background:var(--surface); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; padding:0 20px; flex-shrink:0; }
  .main-header-title { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:var(--snow); }
  .main-header-actions { display:flex; align-items:center; gap:8px; }
  .main-content { flex:1; overflow-y:auto; padding:20px; }

  /* ── STATS ── */
  .stats-row { display:grid; gap:10px; margin-bottom:16px; }
  .stats-5 { grid-template-columns:repeat(5,1fr); }
  .stat-card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:12px 14px; }
  .stat-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
  .stat-value { font-family:'Barlow Condensed',sans-serif; font-size:30px; font-weight:900; color:var(--white); line-height:1; }
  .stat-value.c-teal   { color:#2dd4bf; }
  .stat-value.c-blue   { color:#60a5fa; }
  .stat-value.c-green  { color:#34d399; }
  .stat-value.c-red    { color:#f87171; }
  .stat-value.c-purple { color:#a78bfa; }

  /* ── TABLE ── */
  .table-wrap { background:var(--raised); border:1px solid var(--border); border-radius:5px; overflow-x:auto; overflow-y:hidden; -webkit-overflow-scrolling:touch; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:var(--surface); border-bottom:1px solid var(--border); }
  th { font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); padding:0 14px; height:30px; text-align:left; white-space:nowrap; }
  td { padding:0 14px; height:32px; font-size:13px; border-bottom:1px solid rgba(28,45,66,0.6); vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tbody tr:hover td { background:rgba(255,255,255,0.025); }
  tbody tr { cursor:pointer; }
  .mono { font-family:monospace; font-size:11px; letter-spacing:0.03em; color:var(--soft); }

  /* ── BADGES ── */
  .badge { display:inline-flex; align-items:center; gap:5px; padding:0 7px; height:18px; border-radius:3px; font-family:'Barlow Condensed',sans-serif; font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; white-space:nowrap; }
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
  .urg.medium { color:var(--amber); }
  .urg.high   { color:var(--red); }

  /* ── TOOLBAR ── */
  .toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap; }
  .filters { display:flex; gap:5px; flex-wrap:wrap; }
  .filter-btn { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:0 11px; height:24px; border-radius:3px; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--muted); transition:all 0.15s; display:flex; align-items:center; }
  .filter-btn:hover { border-color:var(--rim); color:var(--body); }
  .filter-btn.active { background:var(--accent); border-color:var(--accent); color:#000; }
  .search-input { background:var(--raised); border:1px solid var(--border); border-radius:4px; padding:0 10px; height:26px; font-size:12px; color:var(--text); outline:none; width:200px; font-family:'Barlow',sans-serif; }
  .search-input::placeholder { color:var(--dim); }
  .search-input:focus { border-color:var(--rim); }

  /* ── MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); display:flex; align-items:center; justify-content:center; z-index:500; padding:20px; animation:fadeIn 0.18s ease; }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  .modal { background:var(--raised); border:1px solid var(--border); border-radius:7px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; }
  @media (min-width:900px) { .modal { max-width:min(83vw,1100px); max-height:88vh; } }
  .modal-head { padding:18px 22px 14px; display:flex; align-items:flex-start; justify-content:space-between; border-bottom:1px solid var(--border); position:sticky; top:0; background:var(--raised); z-index:1; }
  .modal-head h3 { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900; text-transform:uppercase; letter-spacing:0.06em; color:var(--snow); }
  .modal-head-sub { font-size:11px; color:var(--muted); margin-top:2px; }
  .modal-close { background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer; line-height:1; padding:0; }
  .modal-close:hover { color:var(--text); }
  .modal-body { padding:16px 22px 22px; }
  .detail-grid { display:grid; grid-template-columns:110px 1fr; row-gap:4px; column-gap:10px; margin-bottom:14px; }
  .detail-label { font-size:10px; font-weight:600; letter-spacing:0.15em; text-transform:uppercase; color:var(--muted); display:flex; align-items:center; height:28px; }
  .detail-value { font-size:13px; color:var(--text); display:flex; align-items:center; height:28px; }
  hr.divider { border:none; border-top:1px solid var(--border); margin:14px 0; }
  .vehicle-block { background:var(--plate); border-radius:5px; padding:12px 14px; margin-bottom:14px; border:1px solid var(--border); }
  .vehicle-block-eyebrow { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .vehicle-block-id { font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900; text-transform:uppercase; color:var(--white); }
  .vehicle-block-meta { font-size:12px; color:var(--soft); margin-top:3px; }

  /* ── PAGE HEADER ── */
  .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
  .page-title { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; text-transform:uppercase; letter-spacing:0.04em; color:var(--snow); }
  .page-sub { font-size:11px; color:var(--muted); margin-top:2px; }

  /* ── EMPTY ── */
  .empty-state { text-align:center; padding:56px 24px; }
  .empty-state h3 { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--body); margin-bottom:6px; }
  .empty-state p { font-size:12px; color:var(--muted); }
  .loading-row { text-align:center; padding:40px; font-size:12px; color:var(--muted); }

  /* ── HAMBURGER (always visible) ── */
  .menu-btn {
    display:flex; align-items:center; justify-content:center;
    width:32px; height:32px; background:transparent;
    border:1px solid var(--border); border-radius:4px;
    color:var(--body); cursor:pointer; flex-shrink:0; margin-right:8px;
  }
  .menu-btn:hover { border-color:var(--rim); color:var(--text); }

  /* ── SIDEBAR OVERLAY ── */
  .sidebar-overlay {
    display:none; position:fixed; inset:0;
    background:rgba(0,0,0,0.65); z-index:199;
  }

  /* ── DESKTOP COLLAPSE ── */
  @media (min-width:769px) {
    .sidebar { overflow:hidden; transition:width 0.22s ease; }
    .sidebar:not(.open) { width:0; border-right-width:0; }
  }

  @media (max-width:768px) {
    .sidebar {
      position:fixed; left:0; top:0; bottom:0; z-index:200;
      transform:translateX(-100%); transition:transform 0.25s ease;
    }
    .sidebar.open {
      transform:translateX(0);
      box-shadow:8px 0 32px rgba(0,0,0,0.6);
    }
    .sidebar-overlay { display:block; }
    body { overflow:auto; }
    .main-content { padding:14px; }
    .stats-5 { grid-template-columns:repeat(2,1fr); }
  }

  @media (max-width:900px) {
    .stats-5 { grid-template-columns:repeat(3,1fr); }
    .main-content { padding:14px; }
  }
`;

const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const STATUS_LABELS  = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };

const SERVICE_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Service", "Engine Repair",
  "Transmission Service", "AC/Heat Repair", "Electrical Diagnosis",
  "Suspension / Steering", "Alignment", "Exhaust", "Fluid Service",
  "Preventive Maintenance", "DOT Inspection", "Other",
];

function StatusBadge({ status }) {
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function InvoiceBillingBadge({ status, label }) {
  const map = {
    draft:         { color:"#526a84",  bg:"rgba(55,79,104,0.3)",    label:"Draft"      },
    submitted:     { color:"#fbbf24",  bg:"rgba(245,158,11,0.12)",  label:"Submitted"  },
    approved:      { color:"#34d399",  bg:"rgba(16,185,129,0.12)",  label:"Approved"   },
    rejected:      { color:"#f87171",  bg:"rgba(239,68,68,0.12)",   label:"Rejected"   },
    client_billed: { color:"#60a5fa",  bg:"rgba(59,130,246,0.12)",  label:"Billed"     },
    paid:          { color:"#6ee7b7",  bg:"rgba(16,185,129,0.22)",  label:"Paid"       },
  };
  const s = map[status];
  if (!s) return (
    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700,
      letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)" }}>
      Not Invoiced
    </span>
  );
  const displayLabel = label ? `${label} · ${s.label}` : s.label;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"0 7px",
      height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {displayLabel}
    </span>
  );
}

// ─── INVOICE LINE BADGES (multi-line summary) ─────────────────
function LineInvoiceBadges({ linesInvoiceData }) {
  if (!linesInvoiceData || linesInvoiceData.length === 0) {
    return (
      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700,
        letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)" }}>
        Not Invoiced
      </span>
    );
  }
  return (
    <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
      {linesInvoiceData.map(({ line_letter, status }) => (
        <InvoiceBillingBadge key={line_letter} status={status} label={`Line ${line_letter}`} />
      ))}
    </div>
  );
}

// ─── UPDATE MODAL ─────────────────────────────────────────────
function UpdateModal({ request, mechanic, companiesMap, linesInvoiceData, onClose, onUpdate }) {
  const [serviceLines,  setServiceLines]  = useState([]);
  const [loadingLines,  setLoadingLines]  = useState(true);
  const [vehicleStatus, setVehicleStatus] = useState(null);

  useEffect(() => {
    if (request.vehicle_registry_id) {
      supabase.from("vehicles").select("status").eq("id", request.vehicle_registry_id).maybeSingle()
        .then(({ data }) => { if (data) setVehicleStatus(data.status); });
    }
    setLoadingLines(true);
    supabase.from("service_lines")
      .select("id, line_letter, service_name, notes, parts, is_completed")
      .eq("sr_id", request.id)
      .order("line_letter")
      .then(({ data }) => { setServiceLines(data || []); setLoadingLines(false); });
  }, [request.id, request.vehicle_registry_id]);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>SR-{request.request_number} — Service Request</h3>
            <div className="modal-head-sub">
              {new Date(request.created_at).toLocaleDateString("en-US", { weekday:"short", month:"long", day:"numeric", year:"numeric" })}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Vehicle block */}
          <div className="vehicle-block">
            <div className="vehicle-block-eyebrow">Vehicle</div>
            <div className="vehicle-block-id">{request.vehicle_id}</div>
            {(request.vehicle_year || request.vehicle_make || request.vehicle_model) && (
              <div className="vehicle-block-meta">
                {[request.vehicle_year, request.vehicle_make, request.vehicle_model].filter(Boolean).join(" ")}
                {request.mileage && ` — ${Number(request.mileage).toLocaleString()} mi`}
              </div>
            )}
          </div>

          {vehicleStatus === "Not Road Worthy" && (
            <div style={{ background:"var(--amber-dim)", border:"1px solid rgba(245,158,11,0.35)", borderRadius:6, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
              <span style={{ color:"var(--amber)", fontWeight:700, fontSize:14 }}>⚠</span>
              <span style={{ color:"var(--amber)", fontWeight:700 }}>Not Road Worthy</span>
              <span style={{ color:"var(--body)" }}>— this vehicle is currently marked Not Road Worthy in the registry</span>
            </div>
          )}

          {/* Detail grid */}
          <div className="detail-grid">
            <span className="detail-label">DSP</span>
            <span className="detail-value">{companiesMap[request.company_id] || "—"}</span>
            <span className="detail-label">VIN</span>
            <span className="detail-value mono">{request.vin || "—"}</span>
            <span className="detail-label">Urgency</span>
            <span className="detail-value"><span className={`urg ${request.urgency}`}>{request.urgency?.toUpperCase()}</span></span>
            <span className="detail-label">Status</span>
            <span className="detail-value"><StatusBadge status={request.status} /></span>
            <span className="detail-label">Updated At</span>
            <span className="detail-value" style={{fontSize:12}}>
              {request.updated_at ? new Date(request.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(request.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
            </span>
            <span className="detail-label">Invoice</span>
            <span className="detail-value"><LineInvoiceBadges linesInvoiceData={linesInvoiceData} /></span>
          </div>

          {/* Customer Reported Issue */}
          {request.description && (
            <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>
                Customer Reported Issue
              </div>
              <div style={{ background:"var(--plate)", borderRadius:5, padding:"10px 12px", fontSize:13, color:"var(--body)", lineHeight:1.6, border:"1px solid rgba(245,158,11,0.2)", marginBottom:14 }}>
                {request.description}
              </div>
            </>
          )}

          <hr className="divider" />

          {/* Service Lines editor */}
          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>
            Service Lines
          </div>

          {loadingLines ? (
            <div style={{ fontSize:12, color:"var(--muted)", padding:"12px 0" }}>Loading lines…</div>
          ) : (
            <ServiceLinesEditor
              srId={request.id}
              initialLines={serviceLines}
              mechanic={mechanic}
              srStatus={request.status}
              onSaved={() => onUpdate()}
              onSubmitted={() => { onUpdate(); onClose(); }}
            />
          )}

          <hr className="divider" />

          {/* Notes log */}
          <NotesLog srId={request.id} currentUserName={mechanic.display_name || mechanic.name} isAdmin={false} />

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NEW REQUEST MODAL (MECHANIC) ─────────────────────────────
function NewRequestModal({ mechanic, onClose, onCreated }) {
  const [companies, setCompanies]   = useState([]);
  const [form, setForm] = useState({
    company_id:"", vehicle_id:"", vin:"",
    vehicle_make:"", vehicle_model:"", vehicle_year:"", mileage:"",
    urgency:"medium", description:"",
  });
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [scanning, setScanning]         = useState("");
  const [scanResult, setScanResult]     = useState(null);
  const [scanError, setScanError]       = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null); // null=unchecked, []|[...]=checked
  // registry state
  const [lookingUp, setLookingUp]           = useState(false);
  const [registryVehicle, setRegistryVehicle] = useState(null); // null=not looked up, false=not found, obj=found
  const [saveToRegistry, setSaveToRegistry] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
  }, []);

  const f = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (["vin", "mileage"].includes(k)) setDuplicateWarning(null);
  };

  const handleCompanyChange = (val) => { f("company_id", val); setRegistryVehicle(null); setSaveToRegistry(false); };
  const handleVehicleIdChange = (val) => { f("vehicle_id", val); setRegistryVehicle(null); setSaveToRegistry(false); };

  const handleRegistryLookup = async () => {
    if (!form.company_id || !form.vehicle_id.trim()) return;
    setLookingUp(true);
    const { data } = await supabase.from("vehicles")
      .select("*")
      .eq("company_id", form.company_id)
      .eq("vehicle_id", form.vehicle_id.trim())
      .maybeSingle();
    setLookingUp(false);
    if (data) {
      setRegistryVehicle(data);
      if (data.status !== "Retired") {
        setForm(p => ({ ...p, vin: data.vin || "", vehicle_make: data.vehicle_make || "", vehicle_model: data.vehicle_model || "", vehicle_year: data.vehicle_year || "" }));
      }
    } else {
      setRegistryVehicle(false);
    }
  };

  const handleScanVin = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setScanError(""); setScanResult(null); setScanning("reading");
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(",")[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const mediaType = file.type || "image/jpeg";
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/scan-vin-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });
      const { vin, error: vinErr } = await resp.json();
      if (vinErr) throw new Error(vinErr);
      setScanning("decoding");
      const nhtsaResp = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
      const nhtsaData = await nhtsaResp.json();
      const results   = nhtsaData.Results || [];
      const get = (label) => results.find(r => r.Variable === label)?.Value || "";
      setScanResult({ vin, make: get("Make"), model: get("Model"), year: get("Model Year") });
    } catch (err) {
      setScanError(err.message || "Scan failed. Try a clearer photo.");
    }
    setScanning("");
  };

  const applyScannedVin = () => {
    if (!scanResult) return;
    setForm(p => ({ ...p, vin: scanResult.vin, vehicle_make: scanResult.make || p.vehicle_make, vehicle_model: scanResult.model || p.vehicle_model, vehicle_year: scanResult.year || p.vehicle_year }));
    setScanResult(null);
    setDuplicateWarning(null);
  };

  const handleSave = async () => {
    if (!form.company_id || !form.vehicle_id || !form.urgency) {
      setError("Company, Vehicle ID, and Urgency are required."); return;
    }
    if (registryVehicle && registryVehicle.status === "Retired") {
      setError("This vehicle is retired and cannot be assigned to a new service request."); return;
    }
    setSaving(true); setError("");

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
        setSaving(false);
        return;
      }
    }

    let vehicleRegistryId = registryVehicle ? registryVehicle.id : null;

    if (!registryVehicle && saveToRegistry && form.vehicle_id.trim()) {
      const { data: newVeh, error: vErr } = await supabase.from("vehicles").insert({
        company_id:    form.company_id,
        vehicle_id:    form.vehicle_id.trim(),
        vin:           form.vin || null,
        vehicle_make:  form.vehicle_make || null,
        vehicle_model: form.vehicle_model || null,
        vehicle_year:  form.vehicle_year || null,
      }).select("id").single();
      if (vErr && vErr.code !== "23505") { setError("Registry save failed: " + vErr.message); setSaving(false); return; }
      if (newVeh) vehicleRegistryId = newVeh.id;
    }

    const { error: err } = await supabase.from("service_requests").insert({
      client_id:           mechanic.id,
      company_id:          form.company_id,
      vehicle_id:          form.vehicle_id,
      vin:                 form.vin || null,
      vehicle_make:        form.vehicle_make,
      vehicle_model:       form.vehicle_model,
      vehicle_year:        form.vehicle_year,
      mileage:             form.mileage ? parseInt(form.mileage) : null,
      urgency:             form.urgency,
      description:         form.description,
      status:              "pending",
      updated_by_id:       mechanic.id,
      updated_by_name:     mechanic.display_name || mechanic.name,
      updated_by_email:    mechanic.email,
      vehicle_registry_id: vehicleRegistryId,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onCreated();
  };

  const fromRegistry = registryVehicle && registryVehicle !== false && registryVehicle.status !== "Retired";

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:580 }}>
        <div className="modal-head">
          <div>
            <h3>New Service Request</h3>
            <div className="modal-head-sub">Create a new service request</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}

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

          {scanResult && (
            <div style={{ background:"var(--plate)", border:"1px solid var(--accent-rim)", borderRadius:6, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--accent)", marginBottom:8 }}>VIN Scan Result — Confirm</div>
              <div style={{ display:"grid", gridTemplateColumns:"80px 1fr", rowGap:4, fontSize:13, marginBottom:10 }}>
                <span style={{ color:"var(--muted)", fontSize:11 }}>VIN</span><span style={{ fontFamily:"monospace", color:"var(--white)" }}>{scanResult.vin}</span>
                <span style={{ color:"var(--muted)", fontSize:11 }}>Make</span><span>{scanResult.make || "—"}</span>
                <span style={{ color:"var(--muted)", fontSize:11 }}>Model</span><span>{scanResult.model || "—"}</span>
                <span style={{ color:"var(--muted)", fontSize:11 }}>Year</span><span>{scanResult.year || "—"}</span>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-primary btn-sm" onClick={applyScannedVin}>Apply to Form</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setScanResult(null)}>Dismiss</button>
              </div>
            </div>
          )}
          {scanError && <div className="error-box" style={{ marginBottom:10 }}>{scanError}</div>}

          <div className="field">
            <label>DSP *</label>
            <select value={form.company_id} onChange={e => handleCompanyChange(e.target.value)}>
              <option value="">— Select Company —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Vehicle ID + registry lookup */}
          <div className="field">
            <label>Vehicle ID / Unit # *</label>
            <div style={{ display:"flex", gap:6 }}>
              <input style={{ flex:1 }} value={form.vehicle_id} onChange={e => handleVehicleIdChange(e.target.value)} placeholder="UNIT-042" onKeyDown={e => e.key === "Enter" && handleRegistryLookup()} />
              <button className="btn btn-ghost btn-sm" style={{ whiteSpace:"nowrap", flexShrink:0 }} onClick={handleRegistryLookup} disabled={lookingUp || !form.company_id || !form.vehicle_id.trim()}>
                {lookingUp ? "Looking up…" : "Look up"}
              </button>
            </div>
          </div>

          {/* Registry match banner */}
          {fromRegistry && registryVehicle.status === "Not Road Worthy" && (
            <div style={{ background:"var(--amber-dim)", border:"1px solid rgba(245,158,11,0.35)", borderRadius:6, padding:"8px 12px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
              <span style={{ color:"var(--amber)", fontWeight:700 }}>⚠ Not Road Worthy</span>
              <span style={{ color:"var(--body)" }}>— vehicle is marked Not Road Worthy, proceed with caution</span>
              <button style={{ marginLeft:"auto", background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:12 }} onClick={() => setRegistryVehicle(null)}>Edit manually</button>
            </div>
          )}
          {fromRegistry && registryVehicle.status !== "Not Road Worthy" && (
            <div style={{ background:"var(--green-dim)", border:"1px solid rgba(16,185,129,0.3)", borderRadius:6, padding:"8px 12px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
              <span style={{ color:"var(--green)", fontWeight:700 }}>✓ Registry match</span>
              <span style={{ color:"var(--body)" }}>— vehicle details auto-populated and locked</span>
              <button style={{ marginLeft:"auto", background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:12 }} onClick={() => setRegistryVehicle(null)}>Edit manually</button>
            </div>
          )}
          {registryVehicle && registryVehicle !== false && registryVehicle.status === "Retired" && (
            <div style={{ background:"var(--red-dim)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:12 }}>
              <span style={{ color:"var(--red)", fontWeight:700 }}>✗ Vehicle Retired</span>
              <span style={{ color:"var(--body)", marginLeft:8 }}>This vehicle is retired and cannot be assigned to a new service request.</span>
            </div>
          )}
          {registryVehicle === false && (
            <div style={{ background:"var(--raised)", border:"1px solid var(--border)", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:12, color:"var(--muted)" }}>
              Not found in registry — fill in details manually.
              <label style={{ display:"inline-flex", alignItems:"center", gap:6, marginLeft:12, color:"var(--body)", cursor:"pointer" }}>
                <input type="checkbox" checked={saveToRegistry} onChange={e => setSaveToRegistry(e.target.checked)} style={{ accentColor:"var(--accent)" }} />
                Save to registry after submit
              </label>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div className="field">
              <label>VIN</label>
              {fromRegistry ? (
                <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)", fontFamily:"monospace" }}>{form.vin || "—"}</div>
              ) : (
                <div style={{ display:"flex", gap:6 }}>
                  <input style={{ flex:1 }} value={form.vin} onChange={e => f("vin", e.target.value)} placeholder="1HGBH41JXMN109186" />
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display:"none" }} onChange={handleScanVin} />
                  <button className="btn btn-ghost btn-sm" style={{ whiteSpace:"nowrap", flexShrink:0 }} onClick={() => fileRef.current?.click()} disabled={!!scanning}>
                    {scanning === "reading" ? "Reading…" : scanning === "decoding" ? "Decoding…" : "📷 Scan VIN"}
                  </button>
                </div>
              )}
            </div>
            <div className="field">
              <label>Year</label>
              {fromRegistry ? <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{form.vehicle_year || "—"}</div>
                : <input value={form.vehicle_year} onChange={e => f("vehicle_year", e.target.value)} placeholder="2022" />}
            </div>
            <div className="field">
              <label>Make</label>
              {fromRegistry ? <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{form.vehicle_make || "—"}</div>
                : <input value={form.vehicle_make} onChange={e => f("vehicle_make", e.target.value)} placeholder="Ford" />}
            </div>
            <div className="field">
              <label>Model</label>
              {fromRegistry ? <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{form.vehicle_model || "—"}</div>
                : <input value={form.vehicle_model} onChange={e => f("vehicle_model", e.target.value)} placeholder="F-150" />}
            </div>
            {fromRegistry && registryVehicle.license_plate && (
              <div className="field">
                <label>License Plate</label>
                <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{registryVehicle.license_plate}</div>
              </div>
            )}
            <div className="field">
              <label>Mileage</label>
              <input type="number" value={form.mileage} onChange={e => f("mileage", e.target.value)} placeholder="85000" />
            </div>
          </div>
          <div className="field">
            <label>Urgency *</label>
            <select value={form.urgency} onChange={e => f("urgency", e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} placeholder="Describe the issue…" />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Creating…" : duplicateWarning && duplicateWarning.length > 0 ? "Submit Anyway" : "Create Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── REQUESTS VIEW ────────────────────────────────────────────
function RequestsView({ mechanic }) {
  const [requests, setRequests]         = useState([]);
  const [companiesMap, setCompaniesMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");
  const [search, setSearch]             = useState("");
  const [selected, setSelected]               = useState(null);
  const [showNewRequest, setShowNewRequest]   = useState(false);
  const [linesInvoiceMap, setLinesInvoiceMap] = useState({}); // sr_id → [{line_letter, status}]

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: cos }, { data: invs }] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
      supabase.from("invoices").select("service_request_id, status, service_line_id, service_lines(line_letter)"),
    ]);
    const map = {};
    (cos || []).forEach(c => { map[c.id] = c.name; });
    setCompaniesMap(map);
    setRequests(data || []);
    const imap = {};
    (invs || []).forEach(i => {
      if (!i.service_request_id) return;
      if (!imap[i.service_request_id]) imap[i.service_request_id] = [];
      imap[i.service_request_id].push({ line_letter: i.service_lines?.line_letter || "?", status: i.status });
    });
    setLinesInvoiceMap(imap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const counts = {
    all:         requests.length,
    pending:     requests.filter(r => r.status === "pending").length,
    in_progress: requests.filter(r => r.status === "in_progress").length,
    completed:   requests.filter(r => r.status === "completed").length,
    cancelled:   requests.filter(r => r.status === "cancelled").length,
  };

  const filtered = requests.filter(r => {
    const matchStatus = filter === "all" || r.status === filter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `sr-${r.request_number}`.includes(q) ||
      String(r.request_number).includes(q) ||
      r.vehicle_id?.toLowerCase().includes(q) ||
      r.service_type?.toLowerCase().includes(q) ||
      r.vehicle_make?.toLowerCase().includes(q) ||
      r.vehicle_model?.toLowerCase().includes(q) ||
      r.vin?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      companiesMap[r.company_id]?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Service Requests</div>
          <div className="page-sub">View and update service requests in your queue</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewRequest(true)}><IcoPlus /> New Request</button>
        </div>
      </div>

      <div className="stats-row stats-5">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{counts.all}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value c-purple">{counts.pending}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value c-blue">{counts.in_progress}</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value c-green">{counts.completed}</div></div>
        <div className="stat-card"><div className="stat-label">Cancelled</div><div className="stat-value c-red">{counts.cancelled}</div></div>
      </div>

      <div className="toolbar">
        <div className="filters">
          {["all","pending","in_progress","completed","cancelled"].map(s => (
            <button key={s} className={`filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? `All (${counts.all})` : `${STATUS_LABELS[s]} (${counts[s]})`}
            </button>
          ))}
        </div>
        <input className="search-input" placeholder="Search vehicles, services…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="loading-row">Loading requests…</div> : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No requests found</h3>
          <p>Try adjusting your filter or search.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Last Updated</th>
                <th>SR #</th>
                <th>Company</th>
                <th>Vehicle</th>
                <th>VIN</th>
                <th>Service Type</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Invoice</th>
                <th>Updated By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)}>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </td>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {r.updated_at ? new Date(r.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(r.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
                  </td>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>
                      SR-{r.request_number}
                    </span>
                  </td>
                  <td style={{ fontWeight:600, fontSize:13 }}>{companiesMap[r.company_id] || "—"}</td>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase" }}>{r.vehicle_id}</span>
                    {(r.vehicle_make || r.vehicle_model) && (
                      <span style={{ color:"var(--muted)", fontSize:11, marginLeft:8 }}>
                        {[r.vehicle_year, r.vehicle_make, r.vehicle_model].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </td>
                  <td className="mono">{r.vin || "—"}</td>
                  <td style={{ fontSize:13 }}>{r.service_type}</td>
                  <td><span className={`urg ${r.urgency}`}>{r.urgency}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><LineInvoiceBadges linesInvoiceData={linesInvoiceMap[r.id]} /></td>
                  <td>
                    {r.updated_by_name ? (
                      <div>
                        <div style={{ fontSize:12, fontWeight:600 }}>{r.updated_by_name}</div>
                        <div style={{ fontSize:10, color:"var(--muted)" }}>{r.updated_by_email}</div>
                      </div>
                    ) : <span style={{ color:"var(--dim)", fontSize:12 }}>—</span>}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(r); }}>
                      Update <IcoChevron />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <UpdateModal request={selected} mechanic={mechanic} companiesMap={companiesMap}
          linesInvoiceData={linesInvoiceMap[selected.id]}
          onClose={() => setSelected(null)}
          onUpdate={() => load()} />
      )}

      {showNewRequest && (
        <NewRequestModal
          mechanic={mechanic}
          onClose={() => setShowNewRequest(false)}
          onCreated={() => { setShowNewRequest(false); load(); }} />
      )}
    </div>
  );
}

// ─── MECHANIC AUTH ────────────────────────────────────────────
function MechanicAuth({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err || !data?.session) { setError(err?.message || "Invalid credentials."); return; }
    const { data: mechData, error: mechErr } = await supabase
      .from("mechanics").select("id, email, name, display_name").eq("id", data.session.user.id).single();
    if (mechErr || !mechData) {
      await supabase.auth.signOut();
      setError("Access denied. This account does not have mechanic privileges.");
      return;
    }
    onLogin(data.session, mechData);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span>JUR<em>MOB</em>Y</span>
          <span className="portal-tag">Mechanic</span>
        </div>
        <h2>Mechanic Portal</h2>
        <p className="sub">Sign in to view and update service requests</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="mechanic@company.com" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
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
export default function MechanicApp() {
  const [session, setSession]         = useState(null);
  const [mechanic, setMechanic]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogin = (sess, mech) => { setSession(sess); setMechanic(mech); };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); setMechanic(null);
  };

  return (
    <>
      <style>{css}</style>
      {!session ? (
        <MechanicAuth onLogin={handleLogin} />
      ) : (
        <div className="app-shell">
          {/* SIDEBAR OVERLAY (mobile) */}
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <div className="sidebar-logo">JUR<em>MOB</em>Y</div>
              <span className="sidebar-portal-tag">Mechanic</span>
            </div>
            <nav className="sidebar-nav">
              <div className="sidebar-section-label">Navigation</div>
              <button className="nav-item active" onClick={() => { if (window.innerWidth <= 768) setSidebarOpen(false); }}>
                <IcoWrench /> Service Requests
              </button>
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-user-name">{mechanic?.display_name || mechanic?.name}</div>
              <div className="sidebar-user-email">{session.user?.email}</div>
              <button className="btn btn-ghost btn-sm" style={{ width:"100%" }} onClick={handleLogout}>Sign Out</button>
            </div>
          </aside>

          <main className="main-area">
            <div className="main-header">
              <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}><IcoMenu /></button>
              <div className="main-header-title">Service Requests</div>
            </div>
            <div className="main-content">
              <RequestsView mechanic={mechanic} />
            </div>
          </main>
        </div>
      )}
    </>
  );
}
