import { useState } from "react";
import { supabase } from "./lib/supabase";
import AllRequests    from "./tabs/AdminServiceRequests";
import Companies      from "./tabs/AdminCompanies";
import Mechanics      from "./tabs/AdminMechanics";
import Billing        from "./tabs/AdminBilling";
import VehicleRegistry from "./tabs/AdminVehicleRegistry";
import UserManagement from "./tabs/AdminUserManagement";

// ─── ICONS ───────────────────────────────────────────────────
const IcoWrench   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const IcoBuilding = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
const IcoUsers    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoDollar   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const IcoMenu     = () => <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
const IcoUserCog  = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 014-4h4"/><circle cx="19" cy="19" r="2"/><path d="M19 15v2M19 21v.01M15.27 17l1.73-1M21 15.27l1 1.73M23 19h-2M21 22.73l-1-1.73M16 19c0-.34.03-.67.08-1"/></svg>;
const IcoCar      = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h10l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>;

// ─── DESIGN TOKENS (ADMIN — AMBER ACCENT) ────────────────────
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
    background:rgba(80,10,10,0.6); color:#fca5a5; border:1px solid rgba(80,10,10,0.9);
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

  .sidebar {
    width:var(--sidebar-w); background:var(--surface); border-right:1px solid var(--border);
    display:flex; flex-direction:column; flex-shrink:0; height:100%;
  }
  .sidebar-header {
    height:var(--topbar-h); display:flex; align-items:center; padding:0 16px;
    border-bottom:1px solid var(--border); flex-shrink:0;
  }
  .sidebar-logo {
    font-family:'Barlow Condensed',sans-serif; font-size:17px; font-weight:900;
    letter-spacing:0.07em; text-transform:uppercase; color:var(--white);
  }
  .sidebar-logo em { color:var(--accent); font-style:normal; }
  .sidebar-portal-tag {
    margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
    background:rgba(80,10,10,0.6); color:#fca5a5; border:1px solid rgba(80,10,10,0.9);
    border-radius:3px; padding:2px 6px;
  }

  .sidebar-nav { flex:1; padding:8px; display:flex; flex-direction:column; gap:2px; overflow-y:auto; }
  .sidebar-section-label {
    font-size:9px; font-weight:700; letter-spacing:0.22em; text-transform:uppercase;
    color:var(--dim); padding:10px 8px 4px;
  }
  .nav-item {
    display:flex; align-items:center; gap:9px; padding:0 10px; height:32px;
    border-radius:4px; font-family:'Barlow Condensed',sans-serif; font-size:12px;
    font-weight:700; letter-spacing:0.1em; text-transform:uppercase;
    cursor:pointer; border:none; background:transparent; color:var(--muted);
    transition:all 0.15s; width:100%; text-align:left;
  }
  .nav-item:hover { background:var(--raised); color:var(--text); }
  .nav-item.active { background:var(--accent-dim); color:var(--accent); }

  .sidebar-bottom {
    border-top:1px solid var(--border); padding:12px 14px; flex-shrink:0;
  }
  .sidebar-user-name { font-size:12px; font-weight:600; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:2px; }
  .sidebar-user-email { font-size:10px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:8px; }

  /* ── MAIN AREA ── */
  .main-area { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
  .main-header {
    height:var(--topbar-h); background:var(--surface); border-bottom:1px solid var(--border);
    display:flex; align-items:center; justify-content:space-between;
    padding:0 20px; flex-shrink:0;
  }
  .main-header-title {
    font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700;
    text-transform:uppercase; letter-spacing:0.12em; color:var(--snow);
  }
  .main-header-actions { display:flex; align-items:center; gap:8px; }
  .main-content { flex:1; overflow-y:auto; padding:20px; }

  /* ── STATS ── */
  .stats-row { display:grid; gap:10px; margin-bottom:16px; }
  .stats-5 { grid-template-columns:repeat(5,1fr); }
  .stats-4 { grid-template-columns:repeat(4,1fr); }
  .stat-card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:12px 14px; }
  .stat-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); margin-bottom:5px; }
  .stat-value { font-family:'Barlow Condensed',sans-serif; font-size:30px; font-weight:900; color:var(--white); line-height:1; }
  .stat-value.c-amber  { color:var(--accent); }
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
  .urg.medium { color:var(--accent); }
  .urg.high   { color:var(--red); }

  /* ── TOOLBAR ── */
  .toolbar { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; gap:10px; flex-wrap:wrap; }
  .filters { display:flex; gap:5px; flex-wrap:wrap; align-items:center; }
  .filter-btn { font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:0 11px; height:24px; border-radius:3px; cursor:pointer; border:1px solid var(--border); background:transparent; color:var(--muted); transition:all 0.15s; display:flex; align-items:center; }
  .filter-btn:hover { border-color:var(--rim); color:var(--body); }
  .filter-btn.active { background:var(--accent); border-color:var(--accent); color:#000; }
  .filter-chip { display:inline-flex; align-items:center; gap:5px; padding:0 8px; height:24px; border-radius:3px; background:var(--blue-dim); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; font-family:'Barlow Condensed',sans-serif; font-size:11px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; }
  .filter-chip-x { cursor:pointer; opacity:0.7; font-size:15px; line-height:1; margin-left:2px; }
  .filter-chip-x:hover { opacity:1; }
  .clickable-val { cursor:pointer; }
  .clickable-val:hover { color:var(--accent) !important; text-decoration:underline; text-decoration-style:dotted; }

  .search-input { background:var(--raised); border:1px solid var(--border); border-radius:4px; padding:0 10px; height:26px; font-size:12px; color:var(--text); outline:none; width:200px; font-family:'Barlow',sans-serif; }
  .search-input::placeholder { color:var(--dim); }
  .search-input:focus { border-color:var(--rim); }

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
  /* keep old aliases for modal compat */
  .line-item-row { display:grid; grid-template-columns:1fr 60px 90px 80px 28px; gap:6px; margin-bottom:6px; align-items:center; }
  .line-item-row-header { display:grid; grid-template-columns:1fr 60px 90px 80px 28px; gap:6px; margin-bottom:4px; }
  .line-item-header-label { font-size:10px; font-weight:600; letter-spacing:0.18em; text-transform:uppercase; color:var(--muted); }

  /* ── MODAL ── */
  .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.78); display:flex; align-items:center; justify-content:center; z-index:500; padding:20px; animation:fadeIn 0.18s ease; }
  @keyframes fadeIn { from{opacity:0;} to{opacity:1;} }
  .modal { background:var(--raised); border:1px solid var(--border); border-radius:7px; width:100%; max-width:520px; max-height:90vh; overflow-y:auto; }
  @media (min-width:900px) { .modal { max-width:min(83vw,1100px); max-height:88vh; } }
  .modal-head { padding:18px 22px 0; display:flex; align-items:flex-start; justify-content:space-between; position:sticky; top:0; background:var(--raised); z-index:1; padding-bottom:14px; border-bottom:1px solid var(--border); }
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

  /* ── CARD ── */
  .card { background:var(--raised); border:1px solid var(--border); border-radius:5px; padding:18px 20px; margin-bottom:14px; }
  .card-title { font-family:'Barlow Condensed',sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--snow); margin-bottom:14px; }

  /* ── FORM GRID ── */
  .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
  .form-grid-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; }
  .form-grid .full { grid-column:1/-1; }

  /* ── INLINE INPUT (in-row usage) ── */
  .inline-input { background:var(--plate); border:1px solid var(--border); border-radius:4px; padding:0 10px; height:26px; font-size:12px; color:var(--text); outline:none; font-family:'Barlow',sans-serif; }
  .inline-input:focus { border-color:var(--rim); }

  /* ── EMPTY ── */
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
  .user-id-text { font-family:monospace; font-size:11px; color:var(--soft); }

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
    .company-grid { grid-template-columns:1fr; }
    .form-grid { grid-template-columns:1fr; }
    .form-grid-3 { grid-template-columns:1fr; }
  }

  @media (max-width:900px) {
    .stats-5 { grid-template-columns:repeat(3,1fr); }
    .company-grid { grid-template-columns:1fr; }
    .main-content { padding:14px; }
  }
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
    if (err || !data?.session) { setError(err?.message || "Invalid credentials."); return; }
    const { data: adminData, error: adminErr } = await supabase.from("admins").select("id, display_name").eq("id", data.session.user.id).single();
    if (adminErr || !adminData) {
      await supabase.auth.signOut();
      setError("Access denied. This account does not have admin privileges.");
      return;
    }
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
  const [session, setSession]             = useState(null);
  const [adminDisplayName, setAdminDisplayName] = useState(null);
  const [tab, setTab]                     = useState("requests");
  const [sidebarOpen, setSidebarOpen]     = useState(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setAdminDisplayName(null);
  };

  const handleNav = (id) => { setTab(id); if (window.innerWidth <= 768) setSidebarOpen(false); };

  const navItems = [
    { id:"requests",  label:"Service Requests", icon:<IcoWrench /> },
    { id:"companies", label:"DSPs",              icon:<IcoBuilding /> },
    { id:"mechanics", label:"Mechanics",        icon:<IcoUsers /> },
    { id:"billing",   label:"Billing",          icon:<IcoDollar /> },
    { id:"vehicles",  label:"Vehicle Registry", icon:<IcoCar /> },
    { id:"users",     label:"User Management",  icon:<IcoUserCog /> },
  ];

  const pageTitle = { requests:"Service Requests", companies:"DSPs", mechanics:"Mechanics", billing:"Billing", vehicles:"Vehicle Registry", users:"User Management" };

  return (
    <>
      <style>{css}</style>
      {!session ? (
        <AdminAuth onLogin={(sess, dispName) => { setSession(sess); setAdminDisplayName(dispName); }} />
      ) : (
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
              <div className="main-header-title">{pageTitle[tab]}</div>
            </div>
            <div className="main-content">
              {tab === "requests"  && <AllRequests adminDisplayName={adminDisplayName} />}
              {tab === "companies" && <Companies />}
              {tab === "mechanics" && <Mechanics />}
              {tab === "billing"   && <Billing adminDisplayName={adminDisplayName} />}
              {tab === "vehicles"  && <VehicleRegistry adminDisplayName={adminDisplayName} />}
              {tab === "users"    && <UserManagement onAdminDisplayNameChange={setAdminDisplayName} />}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
