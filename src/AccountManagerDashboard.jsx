import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ICONS ───────────────────────────────────────────────────
const IcoBuilding = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
const IcoDollar   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const IcoCar      = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-4h10l2 4h1a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>;
const IcoChevron  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoMenu     = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcoPlus     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoRefresh  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoSparkle  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>;

// ─── DESIGN TOKENS (ACCOUNT MANAGER — PURPLE ACCENT) ─────────
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
    --amber:  #f59e0b; --amber-dim:  rgba(245,158,11,0.12);
    --teal:   #0d9488;
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
  .auth-logo {
    font-family:'Barlow Condensed',sans-serif; font-size:18px; font-weight:900;
    letter-spacing:0.07em; text-transform:uppercase; color:var(--white);
    display:flex; align-items:center; gap:6px; margin-bottom:28px;
  }
  .auth-logo em { color:var(--accent); font-style:normal; }
  .auth-logo .portal-tag {
    font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
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
  label { display:block; font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
  input, select, textarea {
    width:100%; background:var(--plate); border:1px solid var(--border);
    border-radius:5px; padding:8px 11px; font-family:'Barlow',sans-serif;
    font-size:13px; color:var(--white); outline:none;
    transition:border-color 0.15s, box-shadow 0.15s;
  }
  input::placeholder, textarea::placeholder { color:var(--dim); }
  input:focus, select:focus, textarea:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-dim); }
  select option { background:var(--surface); }
  textarea { resize:vertical; min-height:80px; line-height:1.5; }

  /* ── BUTTONS ── */
  .btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:8px 16px; border-radius:5px; font-family:'Barlow Condensed',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; cursor:pointer; border:none; transition:all 0.15s; white-space:nowrap; }
  .btn-primary { background:var(--accent); color:#fff; }
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
  .sidebar {
    width:var(--sidebar-w); background:var(--surface); border-right:1px solid var(--border);
    display:flex; flex-direction:column; flex-shrink:0; height:100%;
  }
  .sidebar-header {
    height:var(--topbar-h); display:flex; align-items:center; padding:0 16px;
    border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .sidebar-logo { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900; letter-spacing:0.07em; text-transform:uppercase; color:var(--white); }
  .sidebar-logo em { color:var(--accent); font-style:normal; }
  .sidebar-portal-tag {
    margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
    background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-rim);
    border-radius:3px; padding:2px 6px;
  }
  .sidebar-nav { flex:1; padding:8px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
  .sidebar-section-label { font-size:9px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase; color:var(--dim); padding:10px 8px 4px; }
  .nav-item {
    display:flex; align-items:center; gap:9px; padding:0 10px; height:32px;
    border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:12px;
    font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    cursor:pointer; border:none; background:transparent; color:var(--muted);
    transition:all 0.15s; width:100%; text-align:left;
  }
  .nav-item:hover { background:var(--raised); color:var(--text); }
  .nav-item.active { background:var(--accent-dim); color:var(--accent); }
  .sidebar-bottom { border-top:1px solid var(--border); padding:12px 14px; flex-shrink:0; }
  .sidebar-user-email { font-size:10px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; }

  /* ── MAIN AREA ── */
  .main-area { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
  .main-header {
    height:var(--topbar-h); background:var(--surface); border-bottom:1px solid var(--border);
    display:flex; align-items:center; padding:0 20px; flex-shrink:0;
  }
  .main-header-title { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.12em; color:var(--snow); }
  .main-content { flex:1; overflow-y:auto; padding:20px; }

  /* ── STATS ── */
  .stats-row { display:grid; gap:10px; margin-bottom:16px; }
  .stats-5 { grid-template-columns:repeat(5,1fr); }
  .stats-4 { grid-template-columns:repeat(4,1fr); }
  .stat-card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:12px 14px; }
  .stat-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
  .stat-value { font-family:'Barlow Condensed',sans-serif; font-size:30px; font-weight:900; color:var(--white); line-height:1; }
  .stat-value.c-amber  { color:#f59e0b; }
  .stat-value.c-blue   { color:#60a5fa; }
  .stat-value.c-green  { color:#34d399; }
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

  /* ── TOOLBAR ── */
  .toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap; }
  .filters { display:flex; gap:5px; flex-wrap:wrap; align-items:center; }
  .filter-btn { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:0 11px; height:24px; border-radius:3px; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--muted); transition:all 0.15s; display:flex; align-items:center; }
  .filter-btn:hover { border-color:var(--rim); color:var(--body); }
  .filter-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }
  .filter-chip { display:inline-flex; align-items:center; gap:5px; padding:0 8px; height:24px; border-radius:3px; background:var(--blue-dim); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; }
  .filter-chip-x { cursor:pointer; opacity:0.7; font-size:15px; line-height:1; margin-left:2px; }
  .filter-chip-x:hover { opacity:1; }
  .clickable-val { cursor:pointer; }
  .clickable-val:hover { color:var(--accent) !important; text-decoration:underline; text-decoration-style:dotted; }

  /* ── SERVICES / LINE ITEMS ── */
  .service-card { background:var(--plate); border:1px solid var(--border); border-radius:6px; padding:14px; margin-bottom:10px; }
  .service-card-header { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
  .service-card-num { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.15em; text-transform:uppercase; color:var(--accent); background:var(--accent-dim); border:1px solid var(--accent-rim); border-radius:3px; padding:0 7px; height:20px; display:flex; align-items:center; flex-shrink:0; }
  .service-section-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:6px; }
  .service-footer { display:flex; justify-content:flex-end; align-items:center; margin-top:10px; padding-top:10px; border-top:1px solid var(--border); gap:16px; }
  .service-total-label { font-size:12px; color:var(--muted); }
  .service-total-val { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:900; color:var(--text); }
  .part-row { display:grid; grid-template-columns:1fr 60px 90px 80px 28px; gap:6px; margin-bottom:5px; align-items:center; }
  .part-row-header { display:grid; grid-template-columns:1fr 60px 90px 80px 28px; gap:6px; margin-bottom:4px; }
  .part-header-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); }
  .remove-item-btn { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:4px; border:1px solid rgba(239,68,68,0.25); background:transparent; color:var(--red); cursor:pointer; font-size:16px; line-height:1; flex-shrink:0; }
  .remove-item-btn:hover { background:var(--red-dim); }

  /* ── MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); display:flex; align-items:center; justify-content:center; z-index:500; padding:20px; animation:fadeIn 0.18s ease; }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  .modal { background:var(--raised); border:1px solid var(--border); border-radius:7px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; }
  .modal-head { padding:18px 22px 0; display:flex; align-items:flex-start; justify-content:space-between; position:sticky; top:0; background:var(--raised); z-index:1; padding-bottom:14px; border-bottom:1px solid var(--border); }
  .modal-head h3 { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900; text-transform:uppercase; letter-spacing:0.06em; color:var(--snow); }
  .modal-head-sub { font-size:11px; color:var(--muted); margin-top:2px; }
  .modal-close { background:none; border:none; color:var(--muted); font-size:20px; cursor:pointer; line-height:1; padding:0; }
  .modal-close:hover { color:var(--text); }
  .modal-body { padding:16px 22px 22px; }

  /* ── PAGE HEADER ── */
  .page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; flex-wrap:wrap; gap:8px; }
  .page-title { font-family:'Barlow Condensed',sans-serif; font-size:20px; font-weight:900; text-transform:uppercase; letter-spacing:0.04em; color:var(--snow); }
  .page-sub { font-size:11px; color:var(--muted); margin-top:2px; }

  /* ── CARD ── */
  .card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:18px 20px; margin-bottom:14px; }
  .card-title { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--snow); margin-bottom:14px; }

  /* ── FORM GRID ── */
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }

  /* ── INLINE INPUT ── */
  .inline-input { background:var(--plate); border:1px solid var(--border); border-radius:4px; padding:0 10px; height:26px; font-size:12px; color:var(--text); outline:none; font-family:'Barlow',sans-serif; }
  .inline-input:focus { border-color:var(--rim); }

  /* ── EMPTY / LOADING ── */
  .empty-state { text-align:center; padding:56px 24px; }
  .empty-state h3 { font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--body); margin-bottom:6px; }
  .empty-state p { font-size:12px; color:var(--muted); }
  .loading-row { text-align:center; padding:40px; font-size:12px; color:var(--muted); }

  /* ── COMPANY CARDS ── */
  .company-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .company-card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:16px; cursor:pointer; transition:border-color 0.15s; }
  .company-card:hover { border-color:var(--rim); }
  .company-card.selected { border-color:var(--accent); }
  .company-name { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:900; text-transform:uppercase; letter-spacing:0.04em; color:var(--white); margin-bottom:4px; }
  .company-meta { font-size:11px; color:var(--muted); line-height:1.6; }
  .company-user-count { font-size:11px; color:var(--soft); font-weight:600; }
  .company-expanded { border-top:1px solid var(--border); margin-top:12px; padding-top:12px; }
  .expanded-label { font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--dim); margin-bottom:8px; }
  .user-row { display:flex; justify-content:space-between; align-items:center; height:30px; border-bottom:1px solid rgba(28,45,66,0.5); }
  .user-row:last-child { border-bottom:none; }

  /* ── HAMBURGER ── */
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
    .sidebar.open { transform:translateX(0); box-shadow:8px 0 32px rgba(0,0,0,0.6); }
    .sidebar-overlay { display:block; }
    body { overflow:auto; }
    .main-content { padding:14px; }
    .company-grid { grid-template-columns:1fr; }
    .form-grid { grid-template-columns:1fr; }
    .form-grid-3 { grid-template-columns:1fr; }
  }

  @media (max-width:900px) {
    .stats-5 { grid-template-columns:repeat(3,1fr); }
    .company-grid { grid-template-columns:1fr; }
    .main-content { padding:14px; }
  }

  hr.divider { border:none; border-top:1px solid var(--border); margin:14px 0; }
`;

// ─── BILLING CONSTANTS ────────────────────────────────────────
const SUBMISSION_TARGETS = ["auto_integrate", "wheel", "client"];
const TARGET_LABELS = { auto_integrate: "Auto Integrate", wheel: "Wheel", client: "Client" };
const INVOICE_STATUSES = ["draft", "submitted", "approved", "rejected", "client_billed", "paid"];
const INVOICE_STATUS_LABELS = {
  draft: "Draft", submitted: "Submitted", approved: "Approved",
  rejected: "Rejected", client_billed: "Client Billed", paid: "Paid",
};
const HARD_FLOOR  = 185;
const DEFAULT_RATE = 220;
const SERVICE_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Service", "Engine Repair",
  "Transmission Service", "AC/Heat Repair", "Electrical Diagnosis",
  "Suspension / Steering", "Alignment", "Exhaust", "Fluid Service",
  "Preventive Maintenance", "DOT Inspection", "Other",
];

// ─── INVOICE STATUS BADGE ─────────────────────────────────────
function InvoiceStatusBadge({ status }) {
  const map = {
    draft:         { bg:"rgba(55,79,104,0.3)",    color:"#526a84", label:"Draft"         },
    submitted:     { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Submitted"     },
    approved:      { bg:"rgba(16,185,129,0.12)",  color:"#34d399", label:"Approved"      },
    rejected:      { bg:"rgba(239,68,68,0.12)",   color:"#f87171", label:"Rejected"      },
    client_billed: { bg:"rgba(139,92,246,0.12)",  color:"#a78bfa", label:"Client Billed" },
    paid:          { bg:"rgba(16,185,129,0.22)",  color:"#6ee7b7", label:"Paid"          },
  };
  const s = map[status] || map.draft;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"0 7px",
      height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {s.label}
    </span>
  );
}

function SRStatusBadge({ status }) {
  if (!status) return <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>;
  const map = {
    pending:     { color:"#fbbf24", bg:"rgba(245,158,11,0.12)"  },
    in_progress: { color:"#60a5fa", bg:"rgba(59,130,246,0.12)"  },
    completed:   { color:"#34d399", bg:"rgba(16,185,129,0.12)"  },
    cancelled:   { color:"#526a84", bg:"rgba(55,79,104,0.3)"    },
  };
  const STATUS_LABELS = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };
  const s = map[status] || { color:"var(--muted)", bg:"rgba(255,255,255,0.05)" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"0 7px",
      height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── PRICING INTELLIGENCE PANEL ───────────────────────────────
function PriceIntelPanel({ serviceType, vehicleType, target, onSuggestTotal }) {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceType || !vehicleType || !target) { setIntel(null); return; }
    setLoading(true);
    supabase
      .from("pricing_intelligence")
      .select("*")
      .eq("service_type", serviceType)
      .eq("vehicle_type", vehicleType)
      .eq("submission_target", target)
      .maybeSingle()
      .then(({ data }) => { setIntel(data); setLoading(false); });
  }, [serviceType, vehicleType, target]);

  const panelBase = { background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"12px 14px", marginBottom:14 };

  if (!serviceType || !vehicleType || !target) return (
    <div style={panelBase}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--dim)", marginBottom:4 }}>Price Intelligence</div>
      <div style={{ fontSize:12, color:"var(--muted)" }}>Select service type, vehicle, and target to see price intelligence.</div>
    </div>
  );

  if (loading) return (
    <div style={panelBase}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--dim)", marginBottom:4 }}>Price Intelligence</div>
      <div style={{ fontSize:12, color:"var(--muted)" }}>Loading…</div>
    </div>
  );

  const confColor = { "Very High":"#3b82f6", "High":"#10b981", "Medium":"#f59e0b", "Low":"#526a84" };

  if (!intel) return (
    <div style={{ ...panelBase, border:"1px solid var(--border)" }}>
      <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--dim)", marginBottom:6 }}>Price Intelligence</div>
      <div style={{ fontSize:12, color:"var(--muted)" }}>
        No history for this combination yet. Defaults: <strong style={{ color:"var(--accent)" }}>${DEFAULT_RATE}/hr</strong> (floor: ${HARD_FLOOR}/hr).
      </div>
    </div>
  );

  return (
    <div style={{ ...panelBase, border:"1px solid var(--accent-rim)" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:9, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)" }}>Price Intelligence</div>
        <div style={{ fontSize:10, color:"var(--dim)" }}>{intel.total_points} data point{intel.total_points !== 1 ? "s" : ""} · {intel.approved_count}A / {intel.rejected_count}R</div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
        {[
          { label:"Floor",      val:`$${Number(intel.floor_price).toFixed(2)}`,                                          color:"#34d399" },
          { label:"Ceiling",    val:intel.ceiling_price ? `$${Number(intel.ceiling_price).toFixed(2)}` : "—",            color:"#f87171" },
          { label:"Suggested",  val:`$${Number(intel.suggested_price).toFixed(2)}`,                                      color:"var(--accent)" },
          { label:"Confidence", val:intel.confidence,                                                                    color:confColor[intel.confidence] || "#526a84" },
        ].map(({ label, val, color }) => (
          <div key={label}>
            <div style={{ fontSize:9, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.15em", fontWeight:600, marginBottom:3 }}>{label}</div>
            <div style={{ fontSize:15, fontWeight:900, color, fontFamily:"'Barlow Condensed',sans-serif" }}>{val}</div>
          </div>
        ))}
      </div>
      {onSuggestTotal && intel.suggested_price && (
        <button className="btn btn-ghost btn-sm" style={{ marginTop:10, fontSize:10 }} onClick={() => onSuggestTotal(Number(intel.suggested_price))}>
          Apply Suggested Total
        </button>
      )}
    </div>
  );
}

// ─── INVOICE BUILDER ──────────────────────────────────────────
function InvoiceBuilder({ onSaved, onCancel }) {
  const [requests, setRequests]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [linkedReqId, setLinkedReqId] = useState("");
  const [form, setForm] = useState({
    company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"",
    service_type:"", submission_target:"",
    taxType:"flat", taxValue:"0",
    discountType:"none", discountValue:"0",
    notes:"",
  });
  const [services, setServices] = useState([{
    name:"", labor_hours:"", labor_rate:String(DEFAULT_RATE),
    parts:[{ description:"", quantity:"1", rate:"" }],
  }]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote]       = useState("");

  useEffect(() => {
    supabase.from("service_requests").select("id,request_number,vehicle_id,vin,vehicle_make,vehicle_model,vehicle_year,service_type,company_id").order("request_number",{ascending:false}).then(({data}) => setRequests(data||[]));
    supabase.from("companies").select("id,name").order("name").then(({data}) => setCompanies(data||[]));
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLinkRequest = (reqId) => {
    setLinkedReqId(reqId);
    if (!reqId) return;
    const r = requests.find(r => r.id === reqId);
    if (r) setForm(p => ({
      ...p,
      company_id:    r.company_id    || p.company_id,
      vehicle_id:    r.vehicle_id    || "",
      vin:           r.vin           || "",
      vehicle_make:  r.vehicle_make  || "",
      vehicle_model: r.vehicle_model || "",
      vehicle_year:  r.vehicle_year  || "",
      service_type:  r.service_type  || "",
    }));
  };

  const vehicleType = [form.vehicle_make, form.vehicle_model].filter(Boolean).join(" ") || form.vehicle_id || "";

  const svcTotals = (svc) => {
    const lr = Math.max(parseFloat(svc.labor_rate) || DEFAULT_RATE, HARD_FLOOR);
    const lh = parseFloat(svc.labor_hours) || 0;
    const labor = lr * lh;
    const parts = svc.parts.reduce((s, p) => s + (parseFloat(p.quantity)||0) * (parseFloat(p.rate)||0), 0);
    return { labor, parts, total: labor + parts };
  };
  const servicesTotal = services.reduce((s, svc) => s + svcTotals(svc).total, 0);
  const discountAmt   = form.discountType === "flat" ? (parseFloat(form.discountValue)||0)
                      : form.discountType === "pct"  ? servicesTotal * (parseFloat(form.discountValue)||0) / 100
                      : 0;
  const afterDiscount = Math.max(servicesTotal - discountAmt, 0);
  const taxAmt        = form.taxType === "pct"
                      ? afterDiscount * (parseFloat(form.taxValue)||0) / 100
                      : parseFloat(form.taxValue) || 0;
  const grandTotal    = afterDiscount + taxAmt;

  const addService    = () => setServices(p => [...p, { name:"", labor_hours:"", labor_rate:String(DEFAULT_RATE), parts:[] }]);
  const removeService = (si) => setServices(p => p.filter((_,i) => i !== si));
  const updateService = (si, key, val) => setServices(p => p.map((s,i) => i===si ? {...s,[key]:val} : s));
  const addPart       = (si) => setServices(p => p.map((s,i) => i===si ? {...s, parts:[...s.parts,{description:"",quantity:"1",rate:""}]} : s));
  const removePart    = (si, pi) => setServices(p => p.map((s,i) => i===si ? {...s, parts:s.parts.filter((_,j) => j!==pi)} : s));
  const updatePart    = (si, pi, k, v) => setServices(p => p.map((s,i) => i===si ? {...s, parts:s.parts.map((pt,j) => j===pi ? {...pt,[k]:v} : pt)} : s));

  const handleAiEstimate = async () => {
    if (!form.service_type) { setAiNote("Select a service type first."); return; }
    setAiLoading(true); setAiNote("");
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-ai-estimate`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
        body: JSON.stringify({ vehicle_year:form.vehicle_year, vehicle_make:form.vehicle_make, vehicle_model:form.vehicle_model, service_type:form.service_type }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const aiParts = [];
      if (data.parts_cost)     aiParts.push({ description: data.parts_description || "Parts", quantity:"1", rate: String(data.parts_cost) });
      if (data.diagnostic_fee) aiParts.push({ description: "Diagnostic Fee",                   quantity:"1", rate: String(data.diagnostic_fee) });
      setServices(prev => {
        const updated = [...prev];
        updated[0] = { ...updated[0], labor_hours: String(data.labor_hours || ""), parts: aiParts };
        return updated;
      });
      setAiNote(data.labor_description || "Estimate applied.");
    } catch (e) { setAiNote("AI estimate failed: " + e.message); }
    setAiLoading(false);
  };

  const handleSave = async (submitNow) => {
    if (!form.service_type || !form.submission_target) { setError("Service type and submission target are required."); return; }
    setSaving(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    const { error: err } = await supabase.from("invoices").insert({
      service_request_id: linkedReqId || null,
      company_id:         form.company_id || null,
      vehicle_id:         form.vehicle_id,
      vin:                form.vin || null,
      vehicle_make:       form.vehicle_make,
      vehicle_model:      form.vehicle_model,
      vehicle_year:       form.vehicle_year,
      service_type:       form.service_type,
      submission_target:  form.submission_target,
      labor_hours:        0,
      labor_rate:         DEFAULT_RATE,
      parts_cost:         afterDiscount,
      diagnostic_fee:     0,
      tax:                taxAmt,
      line_items:         { services, settings: { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue } },
      status:             submitNow ? "submitted" : "draft",
      notes:              form.notes,
      created_by:         session?.user?.id,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  };

  const companyName = id => companies.find(c => c.id === id)?.name || "";

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">New Invoice</div>
          <div className="page-sub">Build and submit an invoice for pricing review</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>← Back</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      <div className="card" style={{ marginBottom:12 }}>
        <div className="card-title">Link Service Request (Optional)</div>
        <div className="field" style={{ marginBottom:0 }}>
          <label>Service Request</label>
          <select value={linkedReqId} onChange={e => handleLinkRequest(e.target.value)}>
            <option value="">— None —</option>
            {requests.map(r => (
              <option key={r.id} value={r.id}>
                SR-{r.request_number} · {r.vehicle_id} · {r.service_type}{companyName(r.company_id) ? ` — ${companyName(r.company_id)}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginBottom:12 }}>
        <div className="card-title">Vehicle & Service</div>
        <div className="form-grid" style={{ marginBottom:10 }}>
          <div className="field">
            <label>Company</label>
            <select value={form.company_id} onChange={e => f("company_id",e.target.value)}>
              <option value="">— Select —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Vehicle ID / Unit #</label>
            <input value={form.vehicle_id} onChange={e => f("vehicle_id",e.target.value)} placeholder="UNIT-042" />
          </div>
          <div className="field">
            <label>VIN</label>
            <input value={form.vin} onChange={e => f("vin",e.target.value)} placeholder="1HGBH41JXMN109186" />
          </div>
          <div className="field">
            <label>Year</label>
            <input value={form.vehicle_year} onChange={e => f("vehicle_year",e.target.value)} placeholder="2022" />
          </div>
          <div className="field">
            <label>Make</label>
            <input value={form.vehicle_make} onChange={e => f("vehicle_make",e.target.value)} placeholder="Ford" />
          </div>
          <div className="field">
            <label>Model</label>
            <input value={form.vehicle_model} onChange={e => f("vehicle_model",e.target.value)} placeholder="F-150" />
          </div>
          <div className="field">
            <label>Service Type</label>
            <select value={form.service_type} onChange={e => f("service_type",e.target.value)}>
              <option value="">— Select —</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="field" style={{ marginBottom:0 }}>
          <label>Submission Target</label>
          <select value={form.submission_target} onChange={e => f("submission_target",e.target.value)}>
            <option value="">— Select Target —</option>
            {SUBMISSION_TARGETS.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
          </select>
        </div>
      </div>

      <PriceIntelPanel
        serviceType={form.service_type}
        vehicleType={vehicleType}
        target={form.submission_target}
        onSuggestTotal={(suggestedTotal) => {
          const remaining = suggestedTotal - taxAmt;
          if (remaining > 0) {
            const firstRate = Math.max(parseFloat(services[0]?.labor_rate) || DEFAULT_RATE, HARD_FLOOR);
            updateService(0, "labor_hours", (remaining / firstRate).toFixed(2));
          }
        }}
      />

      <div className="card" style={{ marginBottom:12 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
          <div className="card-title" style={{ marginBottom:0 }}>Services</div>
          <div style={{ display:"flex", gap:6 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleAiEstimate} disabled={aiLoading} style={{ fontSize:11 }}>
              <IcoSparkle />{aiLoading ? "Estimating…" : "AI Estimate"}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={addService}><IcoPlus /> Add Service</button>
          </div>
        </div>
        {aiNote && (
          <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"8px 12px", fontSize:11, color:"var(--soft)", marginBottom:12 }}>{aiNote}</div>
        )}

        {services.map((svc, si) => {
          const t = svcTotals(svc);
          return (
            <div key={si} className="service-card">
              <div className="service-card-header">
                <span className="service-card-num">Service {si + 1}</span>
                <input className="inline-input" style={{ flex:1 }} placeholder="Service name (e.g. Brake Replacement)" value={svc.name} onChange={e => updateService(si,"name",e.target.value)} />
                {services.length > 1 && (
                  <button className="btn btn-danger btn-sm" style={{ fontSize:11 }} onClick={() => removeService(si)}>Remove</button>
                )}
              </div>

              <div className="service-section-label">Labor</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                <div className="field" style={{ marginBottom:0 }}>
                  <label>Hours</label>
                  <input type="number" min="0" step="0.25" placeholder="0.00" value={svc.labor_hours} onChange={e => updateService(si,"labor_hours",e.target.value)} />
                </div>
                <div className="field" style={{ marginBottom:0 }}>
                  <label>Rate / hr (min ${HARD_FLOOR})</label>
                  <input type="number" min={HARD_FLOOR} step="5" value={svc.labor_rate}
                    onChange={e => updateService(si,"labor_rate",e.target.value)}
                    onBlur={() => { if ((parseFloat(svc.labor_rate)||0) < HARD_FLOOR) updateService(si,"labor_rate",String(HARD_FLOOR)); }} />
                </div>
                <div className="field" style={{ marginBottom:0 }}>
                  <label>Labor Total</label>
                  <input readOnly value={`$${t.labor.toFixed(2)}`} style={{ background:"var(--surface)", color:"var(--soft)", cursor:"default" }} />
                </div>
              </div>

              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                <div className="service-section-label" style={{ marginBottom:0 }}>Parts</div>
                <button className="btn btn-ghost btn-sm" style={{ fontSize:10 }} onClick={() => addPart(si)}><IcoPlus /> Add Part</button>
              </div>
              {svc.parts.length > 0 && (
                <div className="part-row-header">
                  <span className="part-header-label">Description</span>
                  <span className="part-header-label">Qty</span>
                  <span className="part-header-label">Rate ($)</span>
                  <span className="part-header-label">Total</span>
                  <span />
                </div>
              )}
              {svc.parts.map((pt, pi) => {
                const lineTotal = (parseFloat(pt.quantity)||0) * (parseFloat(pt.rate)||0);
                return (
                  <div key={pi} className="part-row">
                    <input className="inline-input" style={{ width:"100%" }} placeholder="e.g. Brake pads" value={pt.description} onChange={e => updatePart(si,pi,"description",e.target.value)} />
                    <input className="inline-input" style={{ width:"100%" }} type="number" min="0" step="1" placeholder="1" value={pt.quantity} onChange={e => updatePart(si,pi,"quantity",e.target.value)} />
                    <input className="inline-input" style={{ width:"100%" }} type="number" min="0" step="0.01" placeholder="0.00" value={pt.rate} onChange={e => updatePart(si,pi,"rate",e.target.value)} />
                    <input className="inline-input" style={{ width:"100%", background:"var(--surface)", color:"var(--soft)", cursor:"default" }} readOnly value={`$${lineTotal.toFixed(2)}`} />
                    <button className="remove-item-btn" onClick={() => removePart(si,pi)}>×</button>
                  </div>
                );
              })}
              {svc.parts.length === 0 && <div style={{ fontSize:12, color:"var(--dim)", marginBottom:8 }}>No parts — click "Add Part".</div>}

              <div className="service-footer">
                <span className="service-total-label">Parts: <strong style={{ color:"var(--soft)" }}>${t.parts.toFixed(2)}</strong></span>
                <span className="service-total-label">Labor: <strong style={{ color:"var(--soft)" }}>${t.labor.toFixed(2)}</strong></span>
                <span className="service-total-label">Service Total: <span className="service-total-val">${t.total.toFixed(2)}</span></span>
              </div>
            </div>
          );
        })}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"start", marginTop:4 }}>
          <div>
            <div style={{ marginBottom:10 }}>
              <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Discount</label>
              <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                {[["none","None"],["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                  <button key={val} onClick={() => f("discountType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.discountType===val ? "var(--accent)" : "var(--raised)", color: form.discountType===val ? "#fff" : "var(--muted)", marginRight:-1 }}>{label}</button>
                ))}
              </div>
              {form.discountType !== "none" && (
                <input type="number" min="0" step={form.discountType==="pct"?"0.1":"0.01"} value={form.discountValue} onChange={e => f("discountValue",e.target.value)} placeholder={form.discountType==="pct"?"0.0":"0.00"} style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:28, fontSize:12, color:"var(--text)", outline:"none", width:"100%", fontFamily:"'Barlow',sans-serif" }} />
              )}
            </div>
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Tax</label>
              <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                {[["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                  <button key={val} onClick={() => f("taxType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.taxType===val ? "var(--accent)" : "var(--raised)", color: form.taxType===val ? "#fff" : "var(--muted)", marginRight:-1 }}>{label}</button>
                ))}
              </div>
              <input type="number" min="0" step={form.taxType==="pct"?"0.1":"0.01"} value={form.taxValue} onChange={e => f("taxValue",e.target.value)} placeholder={form.taxType==="pct"?"0.0":"0.00"} style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:28, fontSize:12, color:"var(--text)", outline:"none", width:"100%", fontFamily:"'Barlow',sans-serif" }} />
            </div>
          </div>
          <div style={{ background:"var(--surface)", borderRadius:5, padding:"10px 14px", border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>Services</span>
              <span style={{ fontSize:11, color:"var(--soft)" }}>${servicesTotal.toFixed(2)}</span>
            </div>
            {discountAmt > 0 && <>
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Discount{form.discountType==="pct" ? ` (${form.discountValue}%)` : ""}</span>
                <span style={{ fontSize:11, color:"#f87171" }}>-${discountAmt.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>After Discount</span>
                <span style={{ fontSize:11, color:"var(--soft)" }}>${afterDiscount.toFixed(2)}</span>
              </div>
            </>}
            <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>Tax{form.taxType==="pct" ? ` (${form.taxValue}%)` : ""}</span>
              <span style={{ fontSize:11, color:"var(--soft)" }}>${taxAmt.toFixed(2)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", height:32, alignItems:"center" }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", color:"var(--snow)" }}>Total</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:"var(--accent)" }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-title">Notes</div>
        <textarea value={form.notes} onChange={e => f("notes",e.target.value)} placeholder="Internal notes, special instructions…" style={{ marginBottom:0 }} />
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving}>{saving?"Saving…":"Save Draft"}</button>
        <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving||!form.service_type||!form.submission_target}>
          {saving?"Submitting…":"Submit Invoice"}
        </button>
      </div>
    </div>
  );
}

// ─── INVOICE MODAL ────────────────────────────────────────────
function InvoiceModal({ invoice, companies, requestsStatusMap, requestsMap, onClose, onUpdate }) {
  const savedSettings = (!Array.isArray(invoice.line_items) && invoice.line_items?.settings) ? invoice.line_items.settings : null;
  const [form, setForm] = useState({
    company_id:        invoice.company_id        || "",
    vehicle_id:        invoice.vehicle_id        || "",
    vin:               invoice.vin               || "",
    vehicle_make:      invoice.vehicle_make      || "",
    vehicle_model:     invoice.vehicle_model     || "",
    vehicle_year:      invoice.vehicle_year      || "",
    service_type:      invoice.service_type      || "",
    submission_target: invoice.submission_target || "",
    taxType:           savedSettings?.taxType      || "flat",
    taxValue:          savedSettings?.taxValue     || String(invoice.tax || "0"),
    discountType:      savedSettings?.discountType || "none",
    discountValue:     savedSettings?.discountValue || "0",
    notes:             invoice.notes             || "",
  });
  const [services, setServices] = useState(() => {
    const li = invoice.line_items;
    if (li && !Array.isArray(li) && li.services) {
      return li.services.map(s => ({
        name:        s.name        || "",
        labor_hours: String(s.labor_hours || ""),
        labor_rate:  String(s.labor_rate  || DEFAULT_RATE),
        parts: (s.parts || []).map(p => ({
          description: p.description || "",
          quantity:    String(p.quantity || "1"),
          rate:        String(p.rate != null ? p.rate : (p.amount || "")),
        })),
      }));
    }
    if (Array.isArray(li) && li.length > 0 && li[0].parts !== undefined) {
      return li.map(s => ({
        name:        s.name        || "",
        labor_hours: String(s.labor_hours || ""),
        labor_rate:  String(s.labor_rate  || DEFAULT_RATE),
        parts: (s.parts || []).map(p => ({
          description: p.description || "",
          quantity:    String(p.quantity || "1"),
          rate:        String(p.rate != null ? p.rate : (p.amount || "")),
        })),
      }));
    }
    const pc = Number(invoice.parts_cost)     || 0;
    const df = Number(invoice.diagnostic_fee) || 0;
    const lh = Number(invoice.labor_hours)    || 0;
    const lr = Number(invoice.labor_rate)     || DEFAULT_RATE;
    const parts = [];
    if (Array.isArray(li) && li.length > 0) {
      li.forEach(i => parts.push({ description: i.description || "", quantity: String(i.quantity || "1"), rate: String(i.rate || i.amount || "") }));
    } else {
      if (pc > 0) parts.push({ description:"Parts",          quantity:"1", rate:String(pc) });
      if (df > 0) parts.push({ description:"Diagnostic Fee", quantity:"1", rate:String(df) });
    }
    return [{ name: invoice.service_type || "", labor_hours: String(lh || ""), labor_rate: String(lr), parts }];
  });
  const [status,    setStatus]    = useState(invoice.status);
  const [rejReason, setRejReason] = useState(invoice.rejection_reason || "");
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState("");

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addService    = () => setServices(p => [...p, { name:"", labor_hours:"", labor_rate:String(DEFAULT_RATE), parts:[] }]);
  const removeService = (si) => setServices(p => p.filter((_,i) => i !== si));
  const updateService = (si, key, val) => setServices(p => p.map((s,i) => i===si ? {...s,[key]:val} : s));
  const addPart       = (si) => setServices(p => p.map((s,i) => i===si ? {...s, parts:[...s.parts,{description:"",quantity:"1",rate:""}]} : s));
  const removePart    = (si, pi) => setServices(p => p.map((s,i) => i===si ? {...s, parts:s.parts.filter((_,j) => j!==pi)} : s));
  const updatePart    = (si, pi, k, v) => setServices(p => p.map((s,i) => i===si ? {...s, parts:s.parts.map((pt,j) => j===pi ? {...pt,[k]:v} : pt)} : s));

  const svcTotals = (svc) => {
    const lr = Math.max(parseFloat(svc.labor_rate) || DEFAULT_RATE, HARD_FLOOR);
    const lh = parseFloat(svc.labor_hours) || 0;
    const labor = lr * lh;
    const parts = svc.parts.reduce((s, p) => s + (parseFloat(p.quantity)||0) * (parseFloat(p.rate)||0), 0);
    return { labor, parts, total: labor + parts };
  };
  const servicesTotal = services.reduce((s, svc) => s + svcTotals(svc).total, 0);
  const discountAmt   = form.discountType === "flat" ? (parseFloat(form.discountValue)||0)
                      : form.discountType === "pct"  ? servicesTotal * (parseFloat(form.discountValue)||0) / 100
                      : 0;
  const afterDiscount = Math.max(servicesTotal - discountAmt, 0);
  const taxAmt        = form.taxType === "pct"
                      ? afterDiscount * (parseFloat(form.taxValue)||0) / 100
                      : parseFloat(form.taxValue) || 0;
  const total         = afterDiscount + taxAmt;

  const handleSave = async () => {
    setSaving(true); setError("");
    const updates = {
      company_id:        form.company_id || null,
      vehicle_id:        form.vehicle_id,
      vin:               form.vin || null,
      vehicle_make:      form.vehicle_make,
      vehicle_model:     form.vehicle_model,
      vehicle_year:      form.vehicle_year,
      service_type:      form.service_type,
      submission_target: form.submission_target,
      labor_hours:       0,
      labor_rate:        DEFAULT_RATE,
      parts_cost:        afterDiscount,
      diagnostic_fee:    0,
      tax:               taxAmt,
      line_items:        { services, settings: { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue } },
      status,
      notes:             form.notes,
      updated_at:        new Date().toISOString(),
    };
    if (status === "rejected") updates.rejection_reason = rejReason;
    const { error: err } = await supabase.from("invoices").update(updates).eq("id", invoice.id);
    if (err) { setError(err.message); setSaving(false); return; }
    const wasUnresolved = !["approved","rejected"].includes(invoice.status);
    const isResolved    = status === "approved" || status === "rejected";
    if (wasUnresolved && isResolved) {
      const vehicleType = [form.vehicle_make, form.vehicle_model].filter(Boolean).join(" ") || form.vehicle_id || "Unknown";
      await supabase.from("pricing_history").insert({
        invoice_id: invoice.id, service_type: form.service_type,
        vehicle_type: vehicleType, submission_target: form.submission_target,
        submitted_amount: total, outcome: status,
      });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onUpdate(); }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:700 }}>
        <div className="modal-head">
          <div>
            <h3>Edit Invoice</h3>
            <div className="modal-head-sub" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span>{companies.find(c => c.id === form.company_id)?.name || "—"} · Created {new Date(invoice.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
              {invoice.service_request_id && requestsMap?.[invoice.service_request_id] && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ color:"var(--muted)", fontSize:10 }}>SR-{requestsMap[invoice.service_request_id]}</span>
                  <SRStatusBadge status={requestsStatusMap?.[invoice.service_request_id]} />
                </span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}

          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:8 }}>Vehicle & Service</div>
          <div className="form-grid" style={{ marginBottom:8 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Company</label>
              <select value={form.company_id} onChange={e => f("company_id",e.target.value)}>
                <option value="">— Select —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Vehicle ID / Unit #</label>
              <input value={form.vehicle_id} onChange={e => f("vehicle_id",e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>VIN</label>
              <input value={form.vin} onChange={e => f("vin",e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Year</label>
              <input value={form.vehicle_year} onChange={e => f("vehicle_year",e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Make</label>
              <input value={form.vehicle_make} onChange={e => f("vehicle_make",e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Model</label>
              <input value={form.vehicle_model} onChange={e => f("vehicle_model",e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Service Type</label>
              <select value={form.service_type} onChange={e => f("service_type",e.target.value)}>
                <option value="">— Select —</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom:14 }}>
            <label>Submission Target</label>
            <select value={form.submission_target} onChange={e => f("submission_target",e.target.value)}>
              <option value="">— Select —</option>
              {SUBMISSION_TARGETS.map(t => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
            </select>
          </div>

          <hr className="divider" />

          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)" }}>Services</div>
            <button className="btn btn-ghost btn-sm" style={{ fontSize:10 }} onClick={addService}><IcoPlus /> Add Service</button>
          </div>

          {services.map((svc, si) => {
            const t = svcTotals(svc);
            return (
              <div key={si} className="service-card">
                <div className="service-card-header">
                  <span className="service-card-num">Service {si + 1}</span>
                  <input className="inline-input" style={{ flex:1 }} placeholder="Service name" value={svc.name} onChange={e => updateService(si,"name",e.target.value)} />
                  {services.length > 1 && (
                    <button className="btn btn-danger btn-sm" style={{ fontSize:11 }} onClick={() => removeService(si)}>Remove</button>
                  )}
                </div>
                <div className="service-section-label">Labor</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:12 }}>
                  <div className="field" style={{ marginBottom:0 }}>
                    <label>Hours</label>
                    <input type="number" min="0" step="0.25" placeholder="0.00" value={svc.labor_hours} onChange={e => updateService(si,"labor_hours",e.target.value)} />
                  </div>
                  <div className="field" style={{ marginBottom:0 }}>
                    <label>Rate / hr (min ${HARD_FLOOR})</label>
                    <input type="number" min={HARD_FLOOR} step="5" value={svc.labor_rate}
                      onChange={e => updateService(si,"labor_rate",e.target.value)}
                      onBlur={() => { if ((parseFloat(svc.labor_rate)||0) < HARD_FLOOR) updateService(si,"labor_rate",String(HARD_FLOOR)); }} />
                  </div>
                  <div className="field" style={{ marginBottom:0 }}>
                    <label>Labor Total</label>
                    <input readOnly value={`$${t.labor.toFixed(2)}`} style={{ background:"var(--surface)", color:"var(--soft)", cursor:"default" }} />
                  </div>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                  <div className="service-section-label" style={{ marginBottom:0 }}>Parts</div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:10 }} onClick={() => addPart(si)}><IcoPlus /> Add Part</button>
                </div>
                {svc.parts.length > 0 && (
                  <div className="part-row-header">
                    <span className="part-header-label">Description</span>
                    <span className="part-header-label">Qty</span>
                    <span className="part-header-label">Rate ($)</span>
                    <span className="part-header-label">Total</span>
                    <span />
                  </div>
                )}
                {svc.parts.map((pt, pi) => {
                  const lt = (parseFloat(pt.quantity)||0) * (parseFloat(pt.rate)||0);
                  return (
                    <div key={pi} className="part-row">
                      <input className="inline-input" style={{ width:"100%" }} placeholder="e.g. Brake pads" value={pt.description} onChange={e => updatePart(si,pi,"description",e.target.value)} />
                      <input className="inline-input" style={{ width:"100%" }} type="number" min="0" step="1" placeholder="1" value={pt.quantity} onChange={e => updatePart(si,pi,"quantity",e.target.value)} />
                      <input className="inline-input" style={{ width:"100%" }} type="number" min="0" step="0.01" placeholder="0.00" value={pt.rate} onChange={e => updatePart(si,pi,"rate",e.target.value)} />
                      <input className="inline-input" style={{ width:"100%", background:"var(--surface)", color:"var(--soft)", cursor:"default" }} readOnly value={`$${lt.toFixed(2)}`} />
                      <button className="remove-item-btn" onClick={() => removePart(si,pi)}>×</button>
                    </div>
                  );
                })}
                {svc.parts.length === 0 && <div style={{ fontSize:12, color:"var(--dim)", marginBottom:6 }}>No parts — click "Add Part".</div>}
                <div className="service-footer">
                  <span className="service-total-label">Parts: <strong style={{ color:"var(--soft)" }}>${t.parts.toFixed(2)}</strong></span>
                  <span className="service-total-label">Labor: <strong style={{ color:"var(--soft)" }}>${t.labor.toFixed(2)}</strong></span>
                  <span className="service-total-label">Service Total: <span className="service-total-val">${t.total.toFixed(2)}</span></span>
                </div>
              </div>
            );
          })}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"start", marginBottom:14 }}>
            <div>
              <div style={{ marginBottom:10 }}>
                <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Discount</label>
                <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                  {[["none","None"],["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                    <button key={val} onClick={() => f("discountType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.discountType===val ? "var(--accent)" : "var(--raised)", color: form.discountType===val ? "#fff" : "var(--muted)", marginRight:-1 }}>{label}</button>
                  ))}
                </div>
                {form.discountType !== "none" && (
                  <input type="number" min="0" step={form.discountType==="pct"?"0.1":"0.01"} value={form.discountValue} onChange={e => f("discountValue",e.target.value)} placeholder={form.discountType==="pct"?"0.0":"0.00"} style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:28, fontSize:12, color:"var(--text)", outline:"none", width:"100%", fontFamily:"'Barlow',sans-serif" }} />
                )}
              </div>
              <div>
                <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Tax</label>
                <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                  {[["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                    <button key={val} onClick={() => f("taxType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.taxType===val ? "var(--accent)" : "var(--raised)", color: form.taxType===val ? "#fff" : "var(--muted)", marginRight:-1 }}>{label}</button>
                  ))}
                </div>
                <input type="number" min="0" step={form.taxType==="pct"?"0.1":"0.01"} value={form.taxValue} onChange={e => f("taxValue",e.target.value)} placeholder={form.taxType==="pct"?"0.0":"0.00"} style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:28, fontSize:12, color:"var(--text)", outline:"none", width:"100%", fontFamily:"'Barlow',sans-serif" }} />
              </div>
            </div>
            <div style={{ background:"var(--surface)", borderRadius:5, padding:"10px 14px", border:"1px solid var(--border)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Services</span>
                <span style={{ fontSize:11, color:"var(--soft)" }}>${servicesTotal.toFixed(2)}</span>
              </div>
              {discountAmt > 0 && <>
                <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>Discount{form.discountType==="pct" ? ` (${form.discountValue}%)` : ""}</span>
                  <span style={{ fontSize:11, color:"#f87171" }}>-${discountAmt.toFixed(2)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>After Discount</span>
                  <span style={{ fontSize:11, color:"var(--soft)" }}>${afterDiscount.toFixed(2)}</span>
                </div>
              </>}
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Tax{form.taxType==="pct" ? ` (${form.taxValue}%)` : ""}</span>
                <span style={{ fontSize:11, color:"var(--soft)" }}>${taxAmt.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", height:32, alignItems:"center" }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", color:"var(--snow)" }}>Total</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:"var(--accent)" }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <hr className="divider" />

          <div className="field">
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {INVOICE_STATUSES.map(s => <option key={s} value={s}>{INVOICE_STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          {status === "rejected" && (
            <div className="field">
              <label>Rejection Reason</label>
              <input value={rejReason} onChange={e => setRejReason(e.target.value)} placeholder="Why was this invoice rejected?" />
            </div>
          )}
          <div className="field">
            <label>Notes</label>
            <textarea value={form.notes} onChange={e => f("notes",e.target.value)} placeholder="Internal notes…" />
          </div>

          {saved && <div className="success-box">Saved.</div>}

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BILLING TAB ──────────────────────────────────────────────
function Billing() {
  const [invoices, setInvoices]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState("list");
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [targetFilter, setTargetFilter]   = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: invs }, { data: cos }, { data: reqs }] = await Promise.all([
      supabase.from("invoices").select("*").order("created_at",{ascending:false}),
      supabase.from("companies").select("id,name").order("name"),
      supabase.from("service_requests").select("id,request_number,status"),
    ]);
    setInvoices(invs || []);
    setCompanies(cos || []);
    setRequests(reqs || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const companiesMap      = Object.fromEntries((companies||[]).map(c => [c.id, c.name]));
  const requestsMap       = Object.fromEntries((requests||[]).map(r => [r.id, r.request_number]));
  const requestsStatusMap = Object.fromEntries((requests||[]).map(r => [r.id, r.status]));

  const counts = {
    all:       invoices.length,
    draft:     invoices.filter(i => i.status === "draft").length,
    submitted: invoices.filter(i => i.status === "submitted").length,
    approved:  invoices.filter(i => i.status === "approved").length,
    rejected:  invoices.filter(i => i.status === "rejected").length,
    paid:      invoices.filter(i => i.status === "paid" || i.status === "client_billed").length,
  };

  const approvedRevenue = invoices
    .filter(i => ["approved","client_billed","paid"].includes(i.status))
    .reduce((sum, i) => sum + (Number(i.total)||0), 0);

  const filtered = invoices
    .filter(i => filter === "all" || (filter === "paid" ? (i.status === "paid" || i.status === "client_billed") : i.status === filter))
    .filter(i => !serviceFilter || i.service_type === serviceFilter)
    .filter(i => !targetFilter || i.submission_target === targetFilter);

  if (view === "builder") {
    return <InvoiceBuilder onSaved={() => { load(); setView("list"); }} onCancel={() => setView("list")} />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Billing</div>
          <div className="page-sub">Create and manage invoices with AI-powered pricing intelligence</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
          <button className="btn btn-primary btn-sm" onClick={() => setView("builder")}><IcoPlus /> New Invoice</button>
        </div>
      </div>

      <div className="stats-row stats-5">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{counts.all}</div></div>
        <div className="stat-card"><div className="stat-label">Draft</div><div className="stat-value c-purple">{counts.draft}</div></div>
        <div className="stat-card"><div className="stat-label">Submitted</div><div className="stat-value c-blue">{counts.submitted}</div></div>
        <div className="stat-card"><div className="stat-label">Approved</div><div className="stat-value c-green">{counts.approved}</div></div>
        <div className="stat-card">
          <div className="stat-label">Approved Revenue</div>
          <div className="stat-value c-amber" style={{ fontSize:20 }}>${approvedRevenue.toFixed(0)}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="filters">
          {[["all","All"],["draft","Draft"],["submitted","Submitted"],["approved","Approved"],["rejected","Rejected"],["paid","Paid/Billed"]].map(([id,label]) => (
            <button key={id} className={`filter-btn ${filter===id?"active":""}`} onClick={() => setFilter(id)}>
              {label} ({id==="paid" ? counts.paid : id==="all" ? counts.all : counts[id] ?? 0})
            </button>
          ))}
          {serviceFilter && (
            <span className="filter-chip">
              {serviceFilter}
              <span className="filter-chip-x" onClick={() => setServiceFilter("")}>×</span>
            </span>
          )}
          {targetFilter && (
            <span className="filter-chip">
              {TARGET_LABELS[targetFilter] || targetFilter}
              <span className="filter-chip-x" onClick={() => setTargetFilter("")}>×</span>
            </span>
          )}
        </div>
      </div>

      {loading ? <div className="loading-row">Loading invoices…</div> : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No invoices{filter!=="all"?` (${filter})`:""}</h3>
          <p>Create your first invoice to get started.</p>
          <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => setView("builder")}><IcoPlus /> New Invoice</button>
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
                <th>Service</th>
                <th>Target</th>
                <th>Total</th>
                <th>SR Status</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id} onClick={() => setSelected(inv)}>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {new Date(inv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                  </td>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {inv.updated_at ? new Date(inv.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) + " " + new Date(inv.updated_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}) : "—"}
                  </td>
                  <td>
                    {inv.service_request_id && requestsMap[inv.service_request_id]
                      ? <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>SR-{requestsMap[inv.service_request_id]}</span>
                      : <span style={{ color:"var(--muted)" }}>—</span>}
                  </td>
                  <td style={{ fontWeight:600, fontSize:13 }}>{companiesMap[inv.company_id] || "—"}</td>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase" }}>{inv.vehicle_id || "—"}</span>
                    {(inv.vehicle_make||inv.vehicle_model) && (
                      <span style={{ color:"var(--muted)", fontSize:11, marginLeft:8 }}>
                        {[inv.vehicle_year,inv.vehicle_make,inv.vehicle_model].filter(Boolean).join(" ")}
                      </span>
                    )}
                  </td>
                  <td className="mono">{inv.vin || "—"}</td>
                  <td style={{ fontSize:12 }}>
                    {inv.service_type
                      ? <span className="clickable-val" onClick={e => { e.stopPropagation(); setServiceFilter(inv.service_type); }}>{inv.service_type}</span>
                      : "—"}
                  </td>
                  <td style={{ fontSize:12 }}>
                    {inv.submission_target
                      ? <span className="clickable-val" onClick={e => { e.stopPropagation(); setTargetFilter(inv.submission_target); }}>{TARGET_LABELS[inv.submission_target] || inv.submission_target}</span>
                      : "—"}
                  </td>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:"var(--accent)" }}>
                      ${Number(inv.total||0).toFixed(2)}
                    </span>
                  </td>
                  <td>{inv.service_request_id ? <SRStatusBadge status={requestsStatusMap[inv.service_request_id]} /> : <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>}</td>
                  <td><InvoiceStatusBadge status={inv.status} /></td>
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(inv); }}>
                      View <IcoChevron />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <InvoiceModal
          invoice={selected}
          companies={companies}
          requestsStatusMap={requestsStatusMap}
          requestsMap={requestsMap}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}

// ─── COMPANIES TAB (SCOPED TO ASSIGNED COMPANIES) ─────────────
function AMCompanies() {
  const [companies, setCompanies]   = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  // company detail editing
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailForm, setDetailForm]         = useState({ name:"", email:"", phone:"", address:"" });
  // user invite
  const [inviteEmail, setInviteEmail]       = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  // user display_name editing: { userId, companyId } | null
  const [editingUser, setEditingUser]           = useState(null);
  const [editUserDisplayName, setEditUserDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    // RLS automatically scopes to assigned companies
    const { data: cos } = await supabase.from("companies").select("*").order("name");
    const { data: cus } = await supabase.from("company_users").select("*");
    setCompanies(cos || []);
    setUsers(cus || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSaveDetails = async () => {
    if (!detailForm.name) { setError("Company name is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("companies").update({
      name:    detailForm.name,
      email:   detailForm.email   || null,
      phone:   detailForm.phone   || null,
      address: detailForm.address || null,
    }).eq("id", selected.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess("Company updated.");
    setEditingDetails(false);
    load();
  };

  const handleInviteUser = async () => {
    if (!inviteEmail || !invitePassword || !selected) return;
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ email: inviteEmail, password: invitePassword, company_id: selected.id }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${inviteEmail} added to ${selected.name}.`);
    setInviteEmail(""); setInvitePassword("");
    load();
  };

  const handleRemoveUser = async (userId, companyId) => {
    if (!window.confirm("Remove this user from the company? This will revoke their client portal access.")) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("company_users").delete().eq("user_id", userId).eq("company_id", companyId);
    if (err) { setError(err.message); return; }
    setSuccess("User removed.");
    load();
  };

  const handleSaveUserDisplayName = async () => {
    if (!editingUser) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("company_users")
      .update({ display_name: editUserDisplayName.trim() || null })
      .eq("user_id", editingUser.userId)
      .eq("company_id", editingUser.companyId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditingUser(null);
    setEditUserDisplayName("");
    setSuccess("Display name updated.");
    load();
  };

  const openEditUser = (u) => {
    setEditingUser({ userId: u.user_id, companyId: u.company_id });
    setEditUserDisplayName(u.display_name || "");
    setError(""); setSuccess("");
  };

  const companyUserCount = id => users.filter(u => u.company_id === id).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Companies</div>
          <div className="page-sub">Manage your assigned client companies and their portal users</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {loading ? <div className="loading-row">Loading…</div> : companies.length === 0 ? (
        <div className="empty-state">
          <h3>No companies assigned</h3>
          <p>Contact an admin to assign companies to your account.</p>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map(c => (
            <div key={c.id}
              className={`company-card ${selected?.id === c.id ? "selected" : ""}`}
              onClick={() => {
                const isClosing = selected?.id === c.id;
                setSelected(isClosing ? null : c);
                if (!isClosing) {
                  setEditingDetails(false);
                  setEditingUser(null);
                  setInviteEmail("");
                  setInvitePassword("");
                  setError("");
                  setSuccess("");
                }
              }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div className="company-name">{c.name}</div>
                  <div className="company-meta">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                    {c.address && <div>{c.address}</div>}
                  </div>
                </div>
                <div className="company-user-count">{companyUserCount(c.id)} user{companyUserCount(c.id) !== 1 ? "s" : ""}</div>
              </div>

              {selected?.id === c.id && (
                <div className="company-expanded" onClick={e => e.stopPropagation()}>

                  {/* ── Company Details ── */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                    <div className="expanded-label" style={{ marginBottom:0 }}>Company Details</div>
                    {!editingDetails && (
                      <button className="btn btn-ghost btn-sm" onClick={() => {
                        setDetailForm({ name:c.name, email:c.email||"", phone:c.phone||"", address:c.address||"" });
                        setEditingDetails(true);
                      }}>Edit</button>
                    )}
                  </div>

                  {editingDetails ? (
                    <div style={{ marginBottom:14 }}>
                      <div className="form-grid" style={{ marginBottom:8 }}>
                        <div className="field" style={{ marginBottom:0 }}>
                          <label>Company Name *</label>
                          <input value={detailForm.name} onChange={e => setDetailForm(f=>({...f,name:e.target.value}))} />
                        </div>
                        <div className="field" style={{ marginBottom:0 }}>
                          <label>Email</label>
                          <input value={detailForm.email} onChange={e => setDetailForm(f=>({...f,email:e.target.value}))} placeholder="contact@company.com" />
                        </div>
                        <div className="field" style={{ marginBottom:0 }}>
                          <label>Phone</label>
                          <input value={detailForm.phone} onChange={e => setDetailForm(f=>({...f,phone:e.target.value}))} placeholder="(702) 555-0100" />
                        </div>
                        <div className="field" style={{ marginBottom:0 }}>
                          <label>Address</label>
                          <input value={detailForm.address} onChange={e => setDetailForm(f=>({...f,address:e.target.value}))} placeholder="123 Main St" />
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditingDetails(false)}>Cancel</button>
                        <button className="btn btn-primary btn-sm" onClick={handleSaveDetails} disabled={saving}>{saving?"Saving…":"Save Details"}</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:14 }}>
                      {[c.email, c.phone, c.address].filter(Boolean).join(" · ") || "No contact details on file."}
                    </div>
                  )}

                  {/* ── Users ── */}
                  <div className="expanded-label">Users</div>

                  {users.filter(u => u.company_id === c.id).length === 0 ? (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>No users linked yet.</div>
                  ) : (
                    users.filter(u => u.company_id === c.id).map(u => (
                      <div key={u.user_id}>
                        {editingUser?.userId === u.user_id ? (
                          <div style={{ display:"flex", gap:6, alignItems:"center", paddingBottom:6, borderBottom:"1px solid rgba(28,45,66,0.5)", marginBottom:4 }}>
                            <input
                              className="inline-input"
                              style={{ flex:1 }}
                              placeholder="Display name (optional)"
                              value={editUserDisplayName}
                              onChange={e => setEditUserDisplayName(e.target.value)}
                              autoFocus
                            />
                            <button className="btn btn-primary btn-sm" onClick={handleSaveUserDisplayName} disabled={saving}>{saving?"…":"Save"}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
                          </div>
                        ) : (
                          <div className="user-row">
                            <span style={{ fontSize:12, color:"var(--soft)" }}>
                              {u.display_name
                                ? <><strong style={{ color:"var(--text)" }}>{u.display_name}</strong> <span className="mono" style={{ fontSize:10 }}>{u.user_id.slice(0,8)}…</span></>
                                : <span className="mono">{u.user_id}</span>}
                            </span>
                            <div style={{ display:"flex", gap:4 }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEditUser(u)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(u.user_id, c.id)}>Remove</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}

                  {/* ── Add User ── */}
                  <div style={{ marginTop:10 }}>
                    <div className="expanded-label" style={{ marginBottom:6 }}>Add User</div>
                    <div style={{ display:"flex", gap:6 }}>
                      <input className="inline-input" style={{ flex:1 }} placeholder="Email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                      <input className="inline-input" style={{ flex:1 }} type="password" placeholder="Password" value={invitePassword} onChange={e => setInvitePassword(e.target.value)} />
                      <button className="btn btn-primary btn-sm" onClick={handleInviteUser} disabled={saving || !inviteEmail || !invitePassword}>
                        {saving ? "…" : "Add"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit user display_name modal (when not inline) */}
      {editingUser && !companies.find(c => c.id === selected?.id) && null}
    </div>
  );
}

// ─── VEHICLE REGISTRY (ACCOUNT MANAGER) ───────────────────────
function AMVehicleStatusBadge({ status }) {
  const s = status || "Active";
  const map = {
    "Active":          { bg:"var(--green-dim)", color:"var(--green)", border:"rgba(16,185,129,0.22)" },
    "Retired":         { bg:"var(--raised)",    color:"var(--dim)",   border:"var(--border)"          },
    "Not Road Worthy": { bg:"var(--amber-dim)", color:"var(--amber)", border:"rgba(245,158,11,0.22)"  },
  };
  const st = map[s] || map["Active"];
  return (
    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
      {s}
    </span>
  );
}

function AMVehicleRegistry({ amDisplayName }) {
  const [vehicles, setVehicles]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [statusFilter, setStatusFilter]   = useState("Active");
  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch]               = useState("");
  const [selected, setSelected]   = useState(null);
  const [srHistory, setSrHistory] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [form, setForm] = useState({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Active" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
    // RLS scopes both queries to AM's assigned companies automatically
    const [{ data: vehs }, { data: cos }] = await Promise.all([
      supabase.from("vehicles").select("*").order("vehicle_id"),
      supabase.from("companies").select("id, name").order("name"),
    ]);
    setVehicles(vehs || []);
    setCompanies(cos || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const companiesMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

  const filtered = vehicles
    .filter(v => statusFilter === "all" ? true : v.status === statusFilter)
    .filter(v => !companyFilter || v.company_id === companyFilter)
    .filter(v => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (v.vehicle_id || "").toLowerCase().includes(q) ||
        (v.vin || "").toLowerCase().includes(q) ||
        (v.vehicle_make || "").toLowerCase().includes(q) ||
        (v.vehicle_model || "").toLowerCase().includes(q) ||
        (v.vehicle_year || "").toLowerCase().includes(q) ||
        (v.license_plate || "").toLowerCase().includes(q) ||
        (companiesMap[v.company_id] || "").toLowerCase().includes(q)
      );
    });

  const counts = {
    Active:        vehicles.filter(v => v.status === "Active").length,
    Retired:       vehicles.filter(v => v.status === "Retired").length,
    notRoadWorthy: vehicles.filter(v => v.status === "Not Road Worthy").length,
    total:         vehicles.length,
  };

  const fmt = d => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const fv  = (k, val) => setForm(p => ({ ...p, [k]: val }));

  const openAdd = () => {
    setEditVehicle(null);
    setForm({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Active" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (v, e) => {
    if (e) e.stopPropagation();
    setEditVehicle(v);
    setForm({ company_id: v.company_id, vehicle_id: v.vehicle_id, vin: v.vin || "", vehicle_make: v.vehicle_make || "", vehicle_model: v.vehicle_model || "", vehicle_year: v.vehicle_year || "", license_plate: v.license_plate || "", notes: v.notes || "", status: v.status || "Active" });
    setError("");
    setShowForm(true);
  };

  const openDetail = async (v) => {
    setSelected(v);
    setSrHistory([]);
    setSrLoading(true);
    const { data } = await supabase.from("service_requests")
      .select("id, request_number, service_type, status, created_at, mileage")
      .eq("vehicle_registry_id", v.id)
      .order("created_at", { ascending: false });
    setSrHistory(data || []);
    setSrLoading(false);
  };

  const handleSave = async () => {
    if (!form.company_id || !form.vehicle_id.trim()) { setError("Company and Vehicle ID are required."); return; }
    setSaving(true); setError("");
    if (editVehicle) {
      const { error: err } = await supabase.from("vehicles").update({
        vehicle_id:    form.vehicle_id.trim(),
        vin:           form.vin.trim() || null,
        vehicle_make:  form.vehicle_make.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        vehicle_year:  form.vehicle_year.trim() || null,
        license_plate: form.license_plate.trim() || null,
        notes:         form.notes.trim() || null,
        status:        form.status,
      }).eq("id", editVehicle.id);
      setSaving(false);
      if (err) { setError(err.code === "23505" ? "A vehicle with this ID already exists for this company." : err.message); return; }
      if (form.status !== editVehicle.status) {
        const { data: { session } } = await supabase.auth.getSession();
        await supabase.from("vehicle_status_logs").insert({
          vehicle_id:      editVehicle.id,
          old_status:      editVehicle.status,
          new_status:      form.status,
          changed_by_id:   session?.user?.id,
          changed_by_name: amDisplayName || session?.user?.email,
        });
      }
      setSuccess("Vehicle updated.");
    } else {
      const { error: err } = await supabase.from("vehicles").insert({
        company_id:    form.company_id,
        vehicle_id:    form.vehicle_id.trim(),
        vin:           form.vin.trim() || null,
        vehicle_make:  form.vehicle_make.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        vehicle_year:  form.vehicle_year.trim() || null,
        license_plate: form.license_plate.trim() || null,
        notes:         form.notes.trim() || null,
        status:        form.status,
      });
      setSaving(false);
      if (err) { setError(err.code === "23505" ? "A vehicle with this ID already exists for this company." : err.message); return; }
      setSuccess("Vehicle added to registry.");
    }
    setShowForm(false);
    setEditVehicle(null);
    load();
  };

  const handleStatusChange = async (v, newStatus, e) => {
    e.stopPropagation();
    if (newStatus === v.status) return;
    if (!window.confirm(`Change "${v.vehicle_id}" status to ${newStatus}?`)) { load(); return; }
    const { error: err } = await supabase.from("vehicles").update({ status: newStatus }).eq("id", v.id);
    if (err) { setError(err.message); return; }
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from("vehicle_status_logs").insert({
      vehicle_id:      v.id,
      old_status:      v.status,
      new_status:      newStatus,
      changed_by_id:   session?.user?.id,
      changed_by_name: amDisplayName || session?.user?.email,
    });
    setSuccess(`Status updated to ${newStatus}.`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Vehicle Registry</div>
          <div className="page-sub">View and manage fleet vehicles for your assigned companies</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><IcoPlus /> Add Vehicle</button>
        </div>
      </div>

      {error   && <div className="error-box"   style={{ marginBottom:10 }}>{error}</div>}
      {success && <div className="success-box" style={{ marginBottom:10 }}>{success}</div>}

      <div className="toolbar" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div className="filters">
          {[["Active","Active"],["Retired","Retired"],["Not Road Worthy","Not Road Worthy"],["all","All"]].map(([id, label]) => (
            <button key={id} className={`filter-btn ${statusFilter===id?"active":""}`} onClick={() => setStatusFilter(id)}>
              {label} ({id === "Active" ? counts.Active : id === "Retired" ? counts.Retired : id === "Not Road Worthy" ? counts.notRoadWorthy : counts.total})
            </button>
          ))}
          {companyFilter && (
            <span className="filter-chip">{companiesMap[companyFilter] || companyFilter}<span className="filter-chip-x" onClick={() => setCompanyFilter("")}>×</span></span>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: companyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vehicle ID, VIN, make…" style={{ padding:"5px 12px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:220, outline:"none" }} />
        </div>
      </div>

      {loading ? <div className="loading-row">Loading vehicles…</div> : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{search || companyFilter ? "No vehicles match your filters." : statusFilter !== "all" ? `No ${statusFilter} vehicles.` : "No vehicles in registry yet."}</h3>
          {!search && !companyFilter && companies.length > 0 && <button className="btn btn-primary" style={{ marginTop:14 }} onClick={openAdd}><IcoPlus /> Add Vehicle</button>}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Company</th>
                <th>Year / Make / Model</th>
                <th>VIN</th>
                <th>License Plate</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} onClick={() => openDetail(v)} style={{ opacity: v.status === "Retired" ? 0.55 : 1 }}>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:900, fontSize:15, textTransform:"uppercase", color:"var(--white)" }}>{v.vehicle_id}</span>
                  </td>
                  <td style={{ fontSize:13 }}>
                    <span className="clickable-val" onClick={e => { e.stopPropagation(); setCompanyFilter(v.company_id); }}>{companiesMap[v.company_id] || "—"}</span>
                  </td>
                  <td style={{ fontSize:12, color:"var(--soft)" }}>{[v.vehicle_year, v.vehicle_make, v.vehicle_model].filter(Boolean).join(" ") || "—"}</td>
                  <td className="mono" style={{ fontSize:11 }}>{v.vin || "—"}</td>
                  <td style={{ fontSize:12 }}>{v.license_plate || "—"}</td>
                  <td><AMVehicleStatusBadge status={v.status} /></td>
                  <td style={{ textAlign:"right" }}>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end", alignItems:"center" }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-ghost btn-sm" onClick={e => openEdit(v, e)}>Edit</button>
                      <select
                        value={v.status}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleStatusChange(v, e.target.value, e)}
                        style={{ fontSize:11, padding:"3px 6px", borderRadius:5, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--soft)", cursor:"pointer" }}
                      >
                        <option value="Active">Active</option>
                        <option value="Retired">Retired</option>
                        <option value="Not Road Worthy">Not Road Worthy</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DETAIL MODAL ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth:600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>{selected.vehicle_id}</h3>
                <div className="modal-head-sub">{companiesMap[selected.company_id] || "—"} · {[selected.vehicle_year, selected.vehicle_make, selected.vehicle_model].filter(Boolean).join(" ") || "No vehicle details"}</div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px 20px", fontSize:13, marginBottom:20 }}>
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>VIN</div><div className="mono" style={{ fontSize:12 }}>{selected.vin || "—"}</div></div>
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>License Plate</div><div>{selected.license_plate || "—"}</div></div>
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Year</div><div>{selected.vehicle_year || "—"}</div></div>
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Make</div><div>{selected.vehicle_make || "—"}</div></div>
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Model</div><div>{selected.vehicle_model || "—"}</div></div>
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Status</div><div><AMVehicleStatusBadge status={selected.status} /></div></div>
                {selected.notes && <div style={{ gridColumn:"1/-1" }}><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Notes</div><div style={{ fontSize:12, color:"var(--body)" }}>{selected.notes}</div></div>}
              </div>

              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--snow)", marginBottom:10 }}>Service Request History</div>
              {srLoading ? (
                <div style={{ color:"var(--muted)", fontSize:13 }}>Loading…</div>
              ) : srHistory.length === 0 ? (
                <div style={{ color:"var(--muted)", fontSize:13 }}>No service requests linked to this vehicle yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>SR #</th><th>Service</th><th>Status</th><th>Mileage</th><th>Date</th></tr></thead>
                    <tbody>
                      {srHistory.map(r => (
                        <tr key={r.id} style={{ cursor:"default" }}>
                          <td><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)" }}>SR-{r.request_number}</span></td>
                          <td style={{ fontSize:12 }}>{r.service_type || "—"}</td>
                          <td><span style={{ fontSize:11, textTransform:"uppercase", fontWeight:700, color: r.status==="completed"?"var(--green)":r.status==="in_progress"?"var(--blue)":r.status==="cancelled"?"var(--red)":"var(--muted)" }}>{r.status}</span></td>
                          <td style={{ fontSize:12, color:"var(--soft)" }}>{r.mileage ? Number(r.mileage).toLocaleString() : "—"}</td>
                          <td style={{ fontSize:11, color:"var(--muted)", whiteSpace:"nowrap" }}>{fmt(r.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); openEdit(selected); }}>Edit Vehicle</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth:520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{editVehicle ? "Edit Vehicle" : "Add Vehicle"}</h3>
                <div className="modal-head-sub">{editVehicle ? `${companiesMap[editVehicle.company_id] || ""} · ${editVehicle.vehicle_id}` : "Add a new vehicle to the registry"}</div>
              </div>
              <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field">
                <label>Company *</label>
                {editVehicle ? (
                  <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:13, color:"var(--soft)" }}>{companiesMap[editVehicle.company_id] || "—"}</div>
                ) : (
                  <select value={form.company_id} onChange={e => fv("company_id", e.target.value)}>
                    <option value="">— Select Company —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div className="field">
                  <label>Vehicle ID / Unit # *</label>
                  <input value={form.vehicle_id} onChange={e => fv("vehicle_id", e.target.value)} placeholder="UNIT-042" autoFocus={!editVehicle} />
                </div>
                <div className="field">
                  <label>License Plate</label>
                  <input value={form.license_plate} onChange={e => fv("license_plate", e.target.value)} placeholder="ABC-1234" />
                </div>
                <div className="field">
                  <label>Year</label>
                  <input value={form.vehicle_year} onChange={e => fv("vehicle_year", e.target.value)} placeholder="2022" />
                </div>
                <div className="field">
                  <label>Make</label>
                  <input value={form.vehicle_make} onChange={e => fv("vehicle_make", e.target.value)} placeholder="Ford" />
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Model</label>
                  <input value={form.vehicle_model} onChange={e => fv("vehicle_model", e.target.value)} placeholder="F-150" />
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>VIN</label>
                  <input value={form.vin} onChange={e => fv("vin", e.target.value)} placeholder="1HGBH41JXMN109186" className="mono" />
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Status</label>
                  <select value={form.status} onChange={e => fv("status", e.target.value)}>
                    <option value="Active">Active</option>
                    <option value="Retired">Retired</option>
                    <option value="Not Road Worthy">Not Road Worthy</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Notes <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label>
                  <textarea value={form.notes} onChange={e => fv("notes", e.target.value)} placeholder="Any notes about this vehicle…" style={{ height:60 }} />
                </div>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : editVehicle ? "Save Changes" : "Add Vehicle"}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────
function AMAuth({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err || !data?.session) { setError(err?.message || "Invalid credentials."); return; }
    const { data: amData, error: amErr } = await supabase
      .from("account_managers")
      .select("id, display_name")
      .eq("id", data.session.user.id)
      .single();
    if (amErr || !amData) {
      await supabase.auth.signOut();
      setError("Access denied. This account does not have account manager privileges.");
      return;
    }
    onLogin(data.session, amData.display_name || null);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <span>JUR<em>MOB</em>Y</span>
          <span className="portal-tag">Account Manager</span>
        </div>
        <h2>Account Manager Portal</h2>
        <p className="sub">Sign in to manage billing and client accounts</p>
        {error && <div className="error-box">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="manager@company.com" onKeyDown={e => e.key === "Enter" && handleSubmit()} />
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
export default function AccountManagerApp() {
  const [session, setSession]         = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [tab, setTab]                 = useState("billing");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setDisplayName(null);
  };

  const handleNav = (id) => { setTab(id); setSidebarOpen(false); };

  const navItems = [
    { id:"billing",   label:"Billing",          icon:<IcoDollar />   },
    { id:"companies", label:"Companies",         icon:<IcoBuilding /> },
    { id:"vehicles",  label:"Vehicle Registry",  icon:<IcoCar />      },
  ];

  const pageTitle = { billing:"Billing", companies:"Companies", vehicles:"Vehicle Registry" };

  return (
    <>
      <style>{css}</style>
      {!session ? (
        <AMAuth onLogin={(sess, dispName) => { setSession(sess); setDisplayName(dispName); }} />
      ) : (
        <div className="app-shell">
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

          <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
            <div className="sidebar-header">
              <div className="sidebar-logo">JUR<em>MOB</em>Y</div>
              <span className="sidebar-portal-tag">Account Manager</span>
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
              <div className="sidebar-user-email">{displayName || session.user?.email}</div>
              <button className="btn btn-ghost btn-sm" style={{ width:"100%" }} onClick={handleLogout}>Sign Out</button>
            </div>
          </aside>

          <main className="main-area">
            <div className="main-header">
              <button className="menu-btn" onClick={() => setSidebarOpen(o => !o)}><IcoMenu /></button>
              <div className="main-header-title">{pageTitle[tab]}</div>
            </div>
            <div className="main-content">
              {tab === "billing"   && <Billing />}
              {tab === "companies" && <AMCompanies />}
              {tab === "vehicles"  && <AMVehicleRegistry amDisplayName={displayName} />}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
