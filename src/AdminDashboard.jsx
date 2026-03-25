import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── ICONS ───────────────────────────────────────────────────
const IcoWrench   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const IcoBuilding = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>;
const IcoUsers    = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
const IcoRefresh  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoPlus     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoChevron  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoDollar   = () => <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
const IcoSparkle  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>;
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
    background:var(--accent-dim); color:var(--accent); border:1px solid var(--accent-rim);
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
  .badge.pending     { background:rgba(139,92,246,0.12); color:#a78bfa; border:1px solid rgba(139,92,246,0.22); }
  .badge.pending .badge-dot     { background:#a78bfa; }
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

const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const STATUS_LABELS  = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };

function StatusBadge({ status }) {
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function InvoiceBillingBadge({ status }) {
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

// ─── REQUEST MODAL ───────────────────────────────────────────
function RequestModal({ request, onClose, onUpdate, adminDisplayName, invoiceStatus, companiesMap }) {
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes]   = useState(request.notes || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("service_requests").update({
      status, notes,
      updated_at:       new Date().toISOString(),
      updated_by_id:    null,
      updated_by_name:  adminDisplayName || "Admin",
      updated_by_email: session?.user?.email || "",
    }).eq("id", request.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => { setSaved(false); onUpdate(); }, 1200); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>SR-{request.request_number} — Request Detail</h3>
            <div className="modal-head-sub">
              {new Date(request.created_at).toLocaleDateString("en-US", { weekday:"short", month:"long", day:"numeric", year:"numeric" })}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
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

          <div className="detail-grid">
            <span className="detail-label">Service</span>
            <span className="detail-value">{request.service_type}</span>
            <span className="detail-label">VIN</span>
            <span className="detail-value mono">{request.vin || "—"}</span>
            <span className="detail-label">Urgency</span>
            <span className="detail-value"><span className={`urg ${request.urgency}`}>{request.urgency?.toUpperCase()}</span></span>
            <span className="detail-label">Updated At</span>
            <span className="detail-value" style={{fontSize:12}}>
              {request.updated_at ? new Date(request.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(request.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
            </span>
            <span className="detail-label">Company</span>
            <span className="detail-value">{companiesMap[request.company_id] || "—"}</span>
            <span className="detail-label">Invoice</span>
            <span className="detail-value"><InvoiceBillingBadge status={invoiceStatus} /></span>
            {request.updated_by_name && <>
              <span className="detail-label">Updated By</span>
              <span className="detail-value" style={{fontSize:12}}>
                {request.updated_by_name}
                {request.updated_by_email && <span style={{color:"var(--muted)", marginLeft:6}}>{request.updated_by_email}</span>}
              </span>
            </>}
          </div>

          {request.description && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Description</div>
              <div style={{ background:"var(--plate)", borderRadius:5, padding:"10px 12px", fontSize:13, color:"var(--body)", lineHeight:1.6, border:"1px solid var(--border)" }}>{request.description}</div>
            </div>
          )}

          <hr className="divider" />

          <div className="field">
            <label>Update Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Internal Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add notes visible only to your team…" />
          </div>

          {saved && <div className="success-box">Saved successfully</div>}

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NEW REQUEST MODAL (ADMIN) ────────────────────────────────
function NewRequestModal({ onClose, onCreated }) {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    company_id:"", vehicle_id:"", vin:"",
    vehicle_make:"", vehicle_model:"", vehicle_year:"", mileage:"",
    service_type:"", urgency:"medium", description:"",
  });
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [scanning, setScanning]         = useState("");
  const [scanResult, setScanResult]     = useState(null);
  const [scanError, setScanError]       = useState("");
  // registry state
  const [lookingUp, setLookingUp]           = useState(false);
  const [registryVehicle, setRegistryVehicle] = useState(null);  // null=not looked up, false=not found, obj=found
  const [saveToRegistry, setSaveToRegistry] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Reset registry state whenever company or vehicle_id changes
  const handleCompanyChange = (val) => {
    f("company_id", val);
    setRegistryVehicle(null);
    setSaveToRegistry(false);
  };
  const handleVehicleIdChange = (val) => {
    f("vehicle_id", val);
    setRegistryVehicle(null);
    setSaveToRegistry(false);
  };

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
    if (!fileRef.current) return;
    fileRef.current.value = "";
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
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/scan-vin-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session.access_token}` },
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
  };

  const handleSave = async () => {
    if (!form.company_id || !form.vehicle_id || !form.service_type || !form.urgency) {
      setError("Company, Vehicle ID, Service Type, and Urgency are required."); return;
    }
    if (registryVehicle && registryVehicle.status === "Retired") {
      setError("This vehicle is retired and cannot be assigned to a new service request."); return;
    }
    setSaving(true); setError("");

    let vehicleRegistryId = registryVehicle ? registryVehicle.id : null;

    // Optionally save new vehicle to registry
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

    const { data: { session } } = await supabase.auth.getSession();
    const { error: err } = await supabase.from("service_requests").insert({
      client_id:           session?.user?.id,
      company_id:          form.company_id,
      vehicle_id:          form.vehicle_id,
      vin:                 form.vin || null,
      vehicle_make:        form.vehicle_make,
      vehicle_model:       form.vehicle_model,
      vehicle_year:        form.vehicle_year,
      mileage:             form.mileage ? parseInt(form.mileage) : null,
      service_type:        form.service_type,
      urgency:             form.urgency,
      description:         form.description,
      status:              "pending",
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
            <div className="modal-head-sub">Create a request on behalf of a client</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}

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
            <label>Company *</label>
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

          <div className="form-grid">
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
          <div className="form-grid">
            <div className="field">
              <label>Service Type *</label>
              <select value={form.service_type} onChange={e => f("service_type", e.target.value)}>
                <option value="">— Select —</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Urgency *</label>
              <select value={form.urgency} onChange={e => f("urgency", e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} placeholder="Describe the issue…" />
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Creating…" : "Create Request"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ALL REQUESTS ─────────────────────────────────────────────
function AllRequests({ adminDisplayName }) {
  const [requests, setRequests]         = useState([]);
  const [companiesMap, setCompaniesMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]                   = useState("");
  const [showNewRequest, setShowNewRequest]   = useState(false);
  const [invoiceStatusMap, setInvoiceStatusMap] = useState({}); // sr_id → invoice status

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: cos }, { data: invs }] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
      supabase.from("invoices").select("service_request_id, status"),
    ]);
    const map = {};
    (cos || []).forEach(c => { map[c.id] = c.name; });
    setCompaniesMap(map);
    setRequests(data || []);
    const imap = {};
    (invs || []).forEach(i => { if (i.service_request_id) imap[i.service_request_id] = i.status; });
    setInvoiceStatusMap(imap);
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
    const matchService = !serviceFilter || r.service_type === serviceFilter;
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
    return matchStatus && matchService && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Service Requests</div>
          <div className="page-sub">View, filter, and update all client requests</div>
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
          {serviceFilter && (
            <span className="filter-chip">
              {serviceFilter}
              <span className="filter-chip-x" onClick={() => setServiceFilter("")}>×</span>
            </span>
          )}
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
                  <td style={{ fontSize:13 }}>
                    <span className="clickable-val" onClick={e => { e.stopPropagation(); setServiceFilter(r.service_type); }}>{r.service_type}</span>
                  </td>
                  <td><span className={`urg ${r.urgency}`}>{r.urgency}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td><InvoiceBillingBadge status={invoiceStatusMap[r.id]} /></td>
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
        <RequestModal request={selected} onClose={() => setSelected(null)}
          onUpdate={() => { load(); setSelected(null); }} adminDisplayName={adminDisplayName}
          invoiceStatus={invoiceStatusMap[selected.id]} companiesMap={companiesMap} />
      )}

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onCreated={() => { setShowNewRequest(false); load(); }} />
      )}
    </div>
  );
}

// ─── COMPANIES ────────────────────────────────────────────────
function Companies() {
  const [companies, setCompanies]   = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState({ name:"", email:"", phone:"", address:"" });
  const [inviteEmail, setInviteEmail]       = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  const [accountManagers, setAccountManagers] = useState([]);
  const [amAssignments, setAmAssignments]     = useState([]); // { account_manager_id, company_id }
  const [amSelect, setAmSelect]               = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: cos }, { data: cus }, { data: ams }, { data: amc }] = await Promise.all([
      supabase.from("companies").select("*").order("name"),
      supabase.from("company_users").select("*"),
      supabase.from("account_managers").select("id, email, display_name").order("email"),
      supabase.from("account_manager_companies").select("account_manager_id, company_id"),
    ]);
    setCompanies(cos || []);
    setUsers(cus || []);
    setAccountManagers(ams || []);
    setAmAssignments(amc || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateCompany = async () => {
    if (!form.name) { setError("Company name is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("companies").insert(form);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess("Company created.");
    setForm({ name:"", email:"", phone:"", address:"" });
    setShowForm(false);
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
    await supabase.from("company_users").delete().eq("user_id", userId).eq("company_id", companyId);
    load();
  };

  const handleAssignAM = async (companyId) => {
    if (!amSelect) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_manager_companies")
      .insert({ account_manager_id: amSelect, company_id: companyId });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setAmSelect("");
    load();
  };

  const handleRemoveAM = async (amId, companyId) => {
    setError(""); setSuccess("");
    await supabase.from("account_manager_companies")
      .delete().eq("account_manager_id", amId).eq("company_id", companyId);
    load();
  };

  const companyUserCount = id => users.filter(u => u.company_id === id).length;
  const companyAMCount   = id => amAssignments.filter(a => a.company_id === id).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Companies</div>
          <div className="page-sub">Manage client companies and their portal users</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><IcoPlus /> New Company</>}
        </button>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-title">New Company</div>
          <div className="form-grid">
            <div className="field"><label>Company Name *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Acme Fleet Co." /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="contact@acme.com" /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="(702) 555-0100" /></div>
            <div className="field"><label>Address</label><input value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} placeholder="123 Main St, Las Vegas, NV" /></div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateCompany} disabled={saving}>{saving ? "Saving…" : "Create Company"}</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-row">Loading…</div> : companies.length === 0 ? (
        <div className="empty-state">
          <h3>No companies yet</h3>
          <p>Create your first company above.</p>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map(c => (
            <div key={c.id}
              className={`company-card ${selected?.id === c.id ? "selected" : ""}`}
              onClick={() => { if (selected?.id !== c.id) { setAmSelect(""); setError(""); setSuccess(""); } setSelected(selected?.id === c.id ? null : c); }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div className="company-name">{c.name}</div>
                  <div className="company-meta">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                    {c.address && <div>{c.address}</div>}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <div className="company-user-count">{companyUserCount(c.id)} user{companyUserCount(c.id) !== 1 ? "s" : ""}</div>
                  {companyAMCount(c.id) > 0 && <div style={{ fontSize:10, color:"#a78bfa", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"0.08em" }}>{companyAMCount(c.id)} acct mgr{companyAMCount(c.id) !== 1 ? "s" : ""}</div>}
                </div>
              </div>

              {selected?.id === c.id && (
                <div className="company-expanded" onClick={e => e.stopPropagation()}>
                  <div className="expanded-label">Users</div>

                  {users.filter(u => u.company_id === c.id).length === 0 ? (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>No users linked yet.</div>
                  ) : (
                    users.filter(u => u.company_id === c.id).map(u => (
                      <div key={u.id} className="user-row">
                        <span className="user-id-text">{u.user_id}</span>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(u.user_id, c.id)}>Remove</button>
                      </div>
                    ))
                  )}

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

                  <div style={{ marginTop:14, borderTop:"1px solid var(--rim)", paddingTop:12 }}>
                    <div className="expanded-label" style={{ marginBottom:6, color:"#a78bfa" }}>Account Managers</div>
                    {amAssignments.filter(a => a.company_id === c.id).length === 0 ? (
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>No account managers assigned.</div>
                    ) : (
                      amAssignments.filter(a => a.company_id === c.id).map(a => {
                        const am = accountManagers.find(m => m.id === a.account_manager_id);
                        return (
                          <div key={a.account_manager_id} className="user-row">
                            <span style={{ fontSize:12 }}>{am ? (am.display_name || am.email) : a.account_manager_id}</span>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAM(a.account_manager_id, c.id)}>Remove</button>
                          </div>
                        );
                      })
                    )}
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <select className="inline-input" style={{ flex:1 }} value={amSelect} onChange={e => setAmSelect(e.target.value)}>
                        <option value="">— Assign Account Manager —</option>
                        {accountManagers
                          .filter(am => !amAssignments.some(a => a.account_manager_id === am.id && a.company_id === c.id))
                          .map(am => <option key={am.id} value={am.id}>{am.display_name || am.email}</option>)
                        }
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssignAM(c.id)} disabled={saving || !amSelect}>
                        {saving ? "…" : "Assign"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MECHANICS ────────────────────────────────────────────────
function Mechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name:"", email:"", password:"" });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("mechanics").select("id, email, name, display_name, created_at").order("created_at", { ascending: false });
    setMechanics(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError("All fields are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-mechanic`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${form.name} (${form.email}) created as mechanic.`);
    setForm({ name:"", email:"", password:"" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} as a mechanic? This will revoke their portal access.`)) return;
    const { error: err } = await supabase.from("mechanics").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSuccess(`${name} removed.`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mechanics</div>
          <div className="page-sub">Manage mechanic accounts with access to service requests</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><IcoPlus /> New Mechanic</>}
        </button>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-title">New Mechanic Account</div>
          <div className="form-grid-3">
            <div className="field"><label>Full Name *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
            <div className="field"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="jane@company.com" /></div>
            <div className="field"><label>Password *</label><input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create Mechanic"}</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-row">Loading…</div> : mechanics.length === 0 ? (
        <div className="empty-state">
          <h3>No mechanics yet</h3>
          <p>Create your first mechanic account above.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mechanics.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight:600 }}>{m.display_name || m.name}</td>
                  <td style={{ color:"var(--soft)", fontSize:12 }}>{m.email}</td>
                  <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>
                    {new Date(m.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </td>
                  <td style={{ textAlign:"right" }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── BILLING CONSTANTS ────────────────────────────────────────
const SUBMISSION_TARGETS = ["auto_integrate", "wheel", "client"];
const TARGET_LABELS = { auto_integrate: "Auto Integrate", wheel: "Wheel", client: "Client" };
const INVOICE_STATUSES = ["draft", "submitted", "approved", "rejected", "client_billed", "paid"];
const INVOICE_STATUS_LABELS = {
  draft: "Draft", submitted: "Submitted", approved: "Approved",
  rejected: "Rejected", client_billed: "Client Billed", paid: "Paid",
};
const HARD_FLOOR  = 185;   // minimum labor rate $/hr
const DEFAULT_RATE = 220;  // default starting labor rate $/hr
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
          { label:"Floor",      val:`$${Number(intel.floor_price).toFixed(2)}`,                                                           color:"#34d399" },
          { label:"Ceiling",    val:intel.ceiling_price ? `$${Number(intel.ceiling_price).toFixed(2)}` : "—",                             color:"#f87171" },
          { label:"Suggested",  val:`$${Number(intel.suggested_price).toFixed(2)}`,                                                       color:"var(--accent)" },
          { label:"Confidence", val:intel.confidence,                                                                                     color:confColor[intel.confidence] || "#526a84" },
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
  const servicesTotal  = services.reduce((s, svc) => s + svcTotals(svc).total, 0);
  const discountAmt    = form.discountType === "flat" ? (parseFloat(form.discountValue)||0)
                       : form.discountType === "pct"  ? servicesTotal * (parseFloat(form.discountValue)||0) / 100
                       : 0;
  const afterDiscount  = Math.max(servicesTotal - discountAmt, 0);
  const taxAmt         = form.taxType === "pct"
                       ? afterDiscount * (parseFloat(form.taxValue)||0) / 100
                       : parseFloat(form.taxValue) || 0;
  const grandTotal     = afterDiscount + taxAmt;

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
      const res  = await fetch(`${SUPABASE_URL}/functions/v1/get-ai-estimate`, {
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

      {/* Link to service request */}
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

      {/* Vehicle & service */}
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

      {/* Price intelligence */}
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

      {/* Services */}
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
          const lr = Math.max(parseFloat(svc.labor_rate) || DEFAULT_RATE, HARD_FLOOR);
          return (
            <div key={si} className="service-card">
              {/* Service header */}
              <div className="service-card-header">
                <span className="service-card-num">Service {si + 1}</span>
                <input className="inline-input" style={{ flex:1 }} placeholder="Service name (e.g. Brake Replacement)" value={svc.name} onChange={e => updateService(si,"name",e.target.value)} />
                {services.length > 1 && (
                  <button className="btn btn-danger btn-sm" style={{ fontSize:11 }} onClick={() => removeService(si)}>Remove</button>
                )}
              </div>

              {/* Labor */}
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

              {/* Parts */}
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

        {/* Discount + Tax + Grand Total */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"start", marginTop:4 }}>
          <div>
            {/* Discount */}
            <div style={{ marginBottom:10 }}>
              <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Discount</label>
              <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                {[["none","None"],["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                  <button key={val} onClick={() => f("discountType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.discountType===val ? "var(--accent)" : "var(--raised)", color: form.discountType===val ? "#000" : "var(--muted)", marginRight:-1 }}>{label}</button>
                ))}
              </div>
              {form.discountType !== "none" && (
                <input type="number" min="0" step={form.discountType==="pct"?"0.1":"0.01"} value={form.discountValue} onChange={e => f("discountValue",e.target.value)} placeholder={form.discountType==="pct"?"0.0":"0.00"} style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:28, fontSize:12, color:"var(--text)", outline:"none", width:"100%", fontFamily:"'Barlow',sans-serif" }} />
              )}
            </div>
            {/* Tax */}
            <div>
              <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Tax</label>
              <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                {[["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                  <button key={val} onClick={() => f("taxType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.taxType===val ? "var(--accent)" : "var(--raised)", color: form.taxType===val ? "#000" : "var(--muted)", marginRight:-1 }}>{label}</button>
                ))}
              </div>
              <input type="number" min="0" step={form.taxType==="pct"?"0.1":"0.01"} value={form.taxValue} onChange={e => f("taxValue",e.target.value)} placeholder={form.taxType==="pct"?"0.0":"0.00"} style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:28, fontSize:12, color:"var(--text)", outline:"none", width:"100%", fontFamily:"'Barlow',sans-serif" }} />
            </div>
          </div>
          {/* Breakdown */}
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

      {/* Notes */}
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
    // Newest format: object with { services, settings }
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
    // Previous format: array of objects with a `parts` key
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
    // Old flat format or empty — convert to single service
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
  const servicesTotal  = services.reduce((s, svc) => s + svcTotals(svc).total, 0);
  const discountAmt    = form.discountType === "flat" ? (parseFloat(form.discountValue)||0)
                       : form.discountType === "pct"  ? servicesTotal * (parseFloat(form.discountValue)||0) / 100
                       : 0;
  const afterDiscount  = Math.max(servicesTotal - discountAmt, 0);
  const taxAmt         = form.taxType === "pct"
                       ? afterDiscount * (parseFloat(form.taxValue)||0) / 100
                       : parseFloat(form.taxValue) || 0;
  const total          = afterDiscount + taxAmt;

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

          {/* Vehicle & service */}
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
              <input value={form.vin} onChange={e => f("vin",e.target.value)} placeholder="1HGBH41JXMN109186" />
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

          {/* Services */}
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

          {/* Discount + Tax + Grand Total */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, alignItems:"start", marginBottom:14 }}>
            <div>
              <div style={{ marginBottom:10 }}>
                <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>Discount</label>
                <div style={{ display:"flex", gap:0, marginBottom:6 }}>
                  {[["none","None"],["flat","$ Flat"],["pct","% Pct"]].map(([val,label]) => (
                    <button key={val} onClick={() => f("discountType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.discountType===val ? "var(--accent)" : "var(--raised)", color: form.discountType===val ? "#000" : "var(--muted)", marginRight:-1 }}>{label}</button>
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
                    <button key={val} onClick={() => f("taxType",val)} style={{ padding:"0 10px", height:28, border:"1px solid var(--border)", cursor:"pointer", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.08em", background: form.taxType===val ? "var(--accent)" : "var(--raised)", color: form.taxType===val ? "#000" : "var(--muted)", marginRight:-1 }}>{label}</button>
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

          {/* Status */}
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

          {saved  && <div className="success-box">Saved.</div>}

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
  const [view, setView]           = useState("list");   // "list" | "builder"
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [targetFilter, setTargetFilter]   = useState("");
  const [search, setSearch]               = useState("");

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
    .filter(i => !targetFilter || i.submission_target === targetFilter)
    .filter(i => {
      if (!search) return true;
      const q = search.toLowerCase().replace(/^sr-/i, "");
      const srNum = i.service_request_id ? String(requestsMap[i.service_request_id] || "") : "";
      return (
        srNum.includes(q) ||
        (companiesMap[i.company_id] || "").toLowerCase().includes(q) ||
        (i.vehicle_id || "").toLowerCase().includes(q) ||
        (i.vin || "").toLowerCase().includes(q) ||
        (i.vehicle_make || "").toLowerCase().includes(q) ||
        (i.vehicle_model || "").toLowerCase().includes(q) ||
        (i.vehicle_year || "").toLowerCase().includes(q) ||
        (i.service_type || "").toLowerCase().includes(q) ||
        (TARGET_LABELS[i.submission_target] || i.submission_target || "").toLowerCase().includes(q)
      );
    });

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

      <div className="toolbar" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
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
          {search && (
            <span className="filter-chip">
              "{search}"
              <span className="filter-chip-x" onClick={() => setSearch("")}>×</span>
            </span>
          )}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search SR#, company, vehicle, VIN…"
          style={{ padding:"5px 12px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:240, outline:"none", flexShrink:0 }}
        />
      </div>

      {loading ? <div className="loading-row">Loading invoices…</div> : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{search ? `No results for "${search}"` : `No invoices${filter!=="all"?` (${filter})`:""}`}</h3>
          <p>{search ? "Try a different search term or clear the filter." : "Create your first invoice to get started."}</p>
          {!search && <button className="btn btn-primary" style={{ marginTop:14 }} onClick={() => setView("builder")}><IcoPlus /> New Invoice</button>}
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

// ─── VEHICLE REGISTRY ─────────────────────────────────────────
function VehicleStatusBadge({ status }) {
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

function VehicleRegistry({ adminDisplayName }) {
  const [vehicles, setVehicles]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]               = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter]   = useState("Active");
  const [selected, setSelected]   = useState(null);
  const [srHistory, setSrHistory] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [statusLogs, setStatusLogs] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [form, setForm] = useState({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Active" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const load = async () => {
    setLoading(true);
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
    setStatusLogs([]);
    const [{ data: srs }, { data: logs }] = await Promise.all([
      supabase.from("service_requests")
        .select("id, request_number, service_type, status, created_at, mileage")
        .eq("vehicle_registry_id", v.id)
        .order("created_at", { ascending: false }),
      supabase.from("vehicle_status_logs")
        .select("*")
        .eq("vehicle_id", v.id)
        .order("changed_at", { ascending: false }),
    ]);
    setSrHistory(srs || []);
    setStatusLogs(logs || []);
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
          changed_by_name: adminDisplayName || session?.user?.email,
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
      changed_by_name: adminDisplayName || session?.user?.email,
    });
    setSuccess(`Status updated to ${newStatus}.`);
    load();
  };

  const fv = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Vehicle Registry</div>
          <div className="page-sub">Manage fleet vehicles — auto-populates service request forms</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><IcoPlus /> Add Vehicle</button>
        </div>
      </div>

      <div className="stats-row stats-4">
        <div className="stat-card"><div className="stat-label">Total Vehicles</div><div className="stat-value">{counts.total}</div></div>
        <div className="stat-card"><div className="stat-label">Active</div><div className="stat-value c-green">{counts.Active}</div></div>
        <div className="stat-card"><div className="stat-label">Retired</div><div className="stat-value" style={{ color:"var(--dim)" }}>{counts.Retired}</div></div>
        <div className="stat-card"><div className="stat-label">Not Road Worthy</div><div className="stat-value" style={{ color:"var(--amber)" }}>{counts.notRoadWorthy}</div></div>
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
          <h3>{search || companyFilter ? "No vehicles match your filters." : "No vehicles in registry yet."}</h3>
          {!search && !companyFilter && <><p>Add vehicles so mechanics can auto-populate service request forms.</p><button className="btn btn-primary" style={{ marginTop:14 }} onClick={openAdd}><IcoPlus /> Add Vehicle</button></>}
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
                  <td><VehicleStatusBadge status={v.status} /></td>
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
                <div><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Status</div><div><VehicleStatusBadge status={selected.status} /></div></div>
                {selected.notes && <div style={{ gridColumn:"1/-1" }}><div style={{ color:"var(--muted)", fontSize:10, fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:2 }}>Notes</div><div style={{ fontSize:12, color:"var(--body)" }}>{selected.notes}</div></div>}
              </div>

              {statusLogs.length > 0 && (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--snow)", marginBottom:8 }}>Status History</div>
                  {statusLogs.map(log => (
                    <div key={log.id} style={{ display:"flex", alignItems:"center", gap:8, fontSize:12, marginBottom:5, color:"var(--body)" }}>
                      <span style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{new Date(log.changed_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}</span>
                      {log.old_status && <><VehicleStatusBadge status={log.old_status} /><span style={{ color:"var(--dim)" }}>→</span></>}
                      <VehicleStatusBadge status={log.new_status} />
                      {log.changed_by_name && <span style={{ color:"var(--muted)", fontSize:11 }}>by {log.changed_by_name}</span>}
                    </div>
                  ))}
                </div>
              )}

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

// ─── USER MANAGEMENT ──────────────────────────────────────────
function UserTypeBadge({ type }) {
  const styles = {
    admin:           { bg:"rgba(245,158,11,0.12)",  color:"#fbbf24", label:"Admin"          },
    mechanic:        { bg:"rgba(13,148,136,0.12)",  color:"#2dd4bf", label:"Mechanic"       },
    client:          { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Client"         },
    account_manager: { bg:"rgba(139,92,246,0.12)",  color:"#a78bfa", label:"Acct Manager"   },
  };
  const s = styles[type] || styles.client;
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

function UserManagement() {
  const [mechanics, setMechanics]           = useState([]);
  const [admins, setAdmins]                 = useState([]);
  const [companyUsers, setCompanyUsers]     = useState([]);
  const [companies, setCompanies]           = useState([]);
  const [accountManagers, setAccountManagers] = useState([]);
  const [amCompanies, setAmCompanies]       = useState([]); // { account_manager_id, company_id }
  const [loading, setLoading]               = useState(true);

  // add modal: null | "mechanic" | "company_user" | "account_manager"
  const [addModal, setAddModal]   = useState(null);
  const [mechForm, setMechForm]   = useState({ name:"", email:"", password:"" });
  const [userForm, setUserForm]   = useState({ email:"", password:"", company_id:"" });
  const [amForm, setAmForm]       = useState({ email:"", password:"", display_name:"" });

  // edit modal: null | { type:"mechanic"|"company_user"|"admin"|"account_manager", record }
  const [editModal, setEditModal]                 = useState(null);
  const [editName, setEditName]                   = useState("");
  const [editCompanyId, setEditCompanyId]         = useState("");
  const [editDisplayName, setEditDisplayName]     = useState("");
  const [editAssignCompanyId, setEditAssignCompanyId] = useState("");

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [amSearch,   setAmSearch]   = useState("");
  const [mechSearch, setMechSearch] = useState("");
  const [cuSearch,   setCuSearch]   = useState("");
  const [adminSearch,setAdminSearch]= useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: mechs }, { data: adms }, { data: cus }, { data: cos }, { data: ams }, { data: amc }] = await Promise.all([
      supabase.from("mechanics").select("id, email, name, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("admins").select("id, email, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("company_users").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("account_managers").select("id, email, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("account_manager_companies").select("account_manager_id, company_id"),
    ]);
    setMechanics(mechs || []);
    setAdmins(adms || []);
    setCompanyUsers(cus || []);
    setCompanies(cos || []);
    setAccountManagers(ams || []);
    setAmCompanies(amc || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const companiesMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

  const handleCreateMechanic = async () => {
    if (!mechForm.name || !mechForm.email || !mechForm.password) { setError("All fields are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-mechanic`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ name: mechForm.name, email: mechForm.email, password: mechForm.password }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${mechForm.name} (${mechForm.email}) created as mechanic.`);
    setMechForm({ name:"", email:"", password:"" });
    setAddModal(null);
    load();
  };

  const handleSaveMechName = async (id) => {
    if (!editName.trim()) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("mechanics").update({
      name: editName.trim(),
      display_name: editDisplayName.trim() || null,
    }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditName("");
    setEditDisplayName("");
    setSuccess("Mechanic updated.");
    load();
  };

  const handleRemoveMechanic = async (id, name) => {
    if (!window.confirm(`Remove ${name} as a mechanic? This will revoke their portal access.`)) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("mechanics").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSuccess(`${name} removed.`);
    load();
  };

  const handleCreateAccountManager = async () => {
    if (!amForm.email || !amForm.password) { setError("Email and password are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-account-manager-user`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
        body: JSON.stringify({ email: amForm.email, password: amForm.password, display_name: amForm.display_name || undefined }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); return; }
      setSuccess(`${amForm.email} created as Account Manager.`);
      setAmForm({ email:"", password:"", display_name:"" });
      setAddModal(null);
      load();
    } catch (e) {
      setError(e.message || "Unexpected error creating account manager.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAMDisplayName = async (id) => {
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_managers")
      .update({ display_name: editDisplayName.trim() || null }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditDisplayName("");
    setSuccess("Account Manager updated.");
    load();
  };

  const handleRemoveAccountManager = async (id, label) => {
    if (!window.confirm(`Remove ${label} as an Account Manager? This will revoke their portal access.`)) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_managers").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSuccess(`${label} removed.`);
    load();
  };

  const handleAssignCompanyToAM = async (amId) => {
    if (!editAssignCompanyId) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_manager_companies")
      .insert({ account_manager_id: amId, company_id: editAssignCompanyId });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditAssignCompanyId("");
    load();
  };

  const handleUnassignCompanyFromAM = async (amId, companyId) => {
    setError(""); setSuccess("");
    await supabase.from("account_manager_companies")
      .delete().eq("account_manager_id", amId).eq("company_id", companyId);
    load();
  };

  const handleCreateCompanyUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.company_id) { setError("All fields are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ email: userForm.email, password: userForm.password, company_id: userForm.company_id }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${userForm.email} added to ${companiesMap[userForm.company_id]}.`);
    setUserForm({ email:"", password:"", company_id:"" });
    setAddModal(null);
    load();
  };

  const handleReassignCompany = async (userId) => {
    if (!editCompanyId) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("company_users").update({
      company_id: editCompanyId,
      display_name: editDisplayName.trim() || null,
    }).eq("user_id", userId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditCompanyId("");
    setEditDisplayName("");
    setSuccess("User updated.");
    load();
  };

  const handleRemoveCompanyUser = async (userId, companyId) => {
    if (!window.confirm("Remove this user from their company? This will revoke their client portal access.")) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("company_users").delete().eq("user_id", userId).eq("company_id", companyId);
    if (err) { setError(err.message); return; }
    setSuccess("User removed.");
    load();
  };

  const fmt = d => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

  const handleSaveAdminDisplayName = async (id) => {
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("admins").update({ display_name: editDisplayName.trim() || null }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditDisplayName("");
    setSuccess("Display name updated.");
    load();
  };

  const openEdit = (type, record) => {
    setError(""); setSuccess("");
    if (type === "mechanic")         { setEditName(record.name); setEditDisplayName(record.display_name || ""); }
    if (type === "company_user")     { setEditCompanyId(record.company_id); setEditDisplayName(record.display_name || ""); }
    if (type === "admin")            { setEditDisplayName(record.display_name || ""); }
    if (type === "account_manager")  { setEditDisplayName(record.display_name || ""); setEditAssignCompanyId(""); }
    setEditModal({ type, record });
  };

  const q = s => s.toLowerCase();
  const filteredAMs    = accountManagers.filter(am => q(am.display_name || "").includes(q(amSearch))   || q(am.email).includes(q(amSearch)));
  const filteredMechs  = mechanics.filter(m  => q(m.display_name || "").includes(q(mechSearch)) || q(m.name  || "").includes(q(mechSearch)) || q(m.email).includes(q(mechSearch)));
  const filteredCUs    = companyUsers.filter(u  => q(u.display_name || "").includes(q(cuSearch))    || q(u.user_id || "").includes(q(cuSearch)) || q(companiesMap[u.company_id] || "").includes(q(cuSearch)));
  const filteredAdmins = admins.filter(a  => q(a.display_name || "").includes(q(adminSearch)) || q(a.email).includes(q(adminSearch)));

  const SectionHeader = ({ label, count, children }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--snow)" }}>
        {label} <span style={{ color:"var(--muted)", fontWeight:400 }}>({count})</span>
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-sub">Manage mechanic, client, account manager, and admin accounts across all portals</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      <div className="stats-row stats-5">
        <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{admins.length + mechanics.length + companyUsers.length + accountManagers.length}</div></div>
        <div className="stat-card"><div className="stat-label">Admins</div><div className="stat-value c-amber">{admins.length}</div></div>
        <div className="stat-card"><div className="stat-label">Mechanics</div><div className="stat-value" style={{ color:"#2dd4bf" }}>{mechanics.length}</div></div>
        <div className="stat-card"><div className="stat-label">Client Users</div><div className="stat-value c-blue">{companyUsers.length}</div></div>
        <div className="stat-card"><div className="stat-label">Acct Managers</div><div className="stat-value" style={{ color:"#a78bfa" }}>{accountManagers.length}</div></div>
      </div>

      {error   && <div className="error-box"   style={{ marginBottom:10 }}>{error}</div>}
      {success && <div className="success-box" style={{ marginBottom:10 }}>{success}</div>}

      {loading ? <div className="loading-row">Loading users…</div> : (
        <>

          {/* ── ACCOUNT MANAGERS ── */}
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="Account Managers" count={amSearch ? `${filteredAMs.length}/${accountManagers.length}` : accountManagers.length}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input value={amSearch} onChange={e => setAmSearch(e.target.value)} placeholder="Search…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:160, outline:"none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => { setAddModal("account_manager"); setError(""); setSuccess(""); setAmForm({ email:"", password:"", display_name:"" }); }}>
                  <IcoPlus /> Add Account Manager
                </button>
              </div>
            </SectionHeader>
            {accountManagers.length === 0 ? (
              <div className="empty-state"><p>No account managers yet.</p></div>
            ) : filteredAMs.length === 0 ? (
              <div className="empty-state"><p>No results for "{amSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredAMs.map(am => {
                      const assigned = amCompanies.filter(a => a.account_manager_id === am.id);
                      return (
                        <tr key={am.id} style={{ cursor:"default" }}>
                          <td>
                            <div style={{ fontWeight:600, fontSize:13 }}>{am.display_name || am.email}</div>
                            {am.display_name && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{am.email}</div>}
                          </td>
                          <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(139,92,246,0.12)", color:"#a78bfa", border:"1px solid rgba(139,92,246,0.22)" }}>Acct Manager</span></td>
                          <td style={{ fontSize:12, color:"var(--soft)" }}>{assigned.length === 0 ? <span style={{ color:"var(--muted)" }}>No companies</span> : <span>{assigned.length} {assigned.length === 1 ? "company" : "companies"}</span>}</td>
                          <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(am.created_at)}</td>
                          <td style={{ textAlign:"right" }}>
                            <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEdit("account_manager", am)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAccountManager(am.id, am.display_name || am.email)}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── MECHANICS ── */}
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="Mechanics" count={mechSearch ? `${filteredMechs.length}/${mechanics.length}` : mechanics.length}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input value={mechSearch} onChange={e => setMechSearch(e.target.value)} placeholder="Search…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:160, outline:"none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => { setAddModal("mechanic"); setError(""); setSuccess(""); setMechForm({ name:"", email:"", password:"" }); }}>
                  <IcoPlus /> Add Mechanic
                </button>
              </div>
            </SectionHeader>
            {mechanics.length === 0 ? (
              <div className="empty-state"><p>No mechanics yet.</p></div>
            ) : filteredMechs.length === 0 ? (
              <div className="empty-state"><p>No results for "{mechSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredMechs.map(m => (
                      <tr key={m.id} style={{ cursor:"default" }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{m.display_name || m.name}</div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{m.email}</div>
                        </td>
                        <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(45,212,191,0.12)", color:"#2dd4bf", border:"1px solid rgba(45,212,191,0.22)" }}>Mechanic</span></td>
                        <td style={{ fontSize:12, color:"var(--muted)" }}>—</td>
                        <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(m.created_at)}</td>
                        <td style={{ textAlign:"right" }}>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit("mechanic", m)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMechanic(m.id, m.name)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── COMPANY USERS ── */}
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="Company Users" count={cuSearch ? `${filteredCUs.length}/${companyUsers.length}` : companyUsers.length}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input value={cuSearch} onChange={e => setCuSearch(e.target.value)} placeholder="Search name or company…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:180, outline:"none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => { setAddModal("company_user"); setError(""); setSuccess(""); setUserForm({ email:"", password:"", company_id:"" }); }}>
                  <IcoPlus /> Add Company User
                </button>
              </div>
            </SectionHeader>
            {companyUsers.length === 0 ? (
              <div className="empty-state"><p>No company users yet.</p></div>
            ) : filteredCUs.length === 0 ? (
              <div className="empty-state"><p>No results for "{cuSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredCUs.map(u => (
                      <tr key={u.id} style={{ cursor:"default" }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.display_name || <span className="mono" style={{ fontSize:11, fontWeight:400 }}>{u.user_id}</span>}</div>
                          {u.display_name && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }} className="mono">{u.user_id}</div>}
                        </td>
                        <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(96,165,250,0.12)", color:"#60a5fa", border:"1px solid rgba(96,165,250,0.22)" }}>Client</span></td>
                        <td style={{ fontSize:12, color:"var(--soft)" }}>{companiesMap[u.company_id] || <span style={{ color:"var(--muted)" }}>—</span>}</td>
                        <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(u.created_at)}</td>
                        <td style={{ textAlign:"right" }}>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit("company_user", u)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveCompanyUser(u.user_id, u.company_id)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── ADMINS ── */}
          <div>
            <SectionHeader label="Admins" count={adminSearch ? `${filteredAdmins.length}/${admins.length}` : admins.length}>
              <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="Search…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:160, outline:"none" }} />
            </SectionHeader>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>Admin accounts are managed directly via SQL — see CLAUDE.md. Display name is editable here.</div>
            {admins.length === 0 ? (
              <div className="empty-state"><p>No admins found.</p></div>
            ) : filteredAdmins.length === 0 ? (
              <div className="empty-state"><p>No results for "{adminSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredAdmins.map(a => (
                      <tr key={a.id} style={{ cursor:"default" }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{a.display_name || a.email}</div>
                          {a.display_name && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{a.email}</div>}
                        </td>
                        <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(245,158,11,0.12)", color:"var(--accent)", border:"1px solid rgba(245,158,11,0.22)" }}>Admin</span></td>
                        <td style={{ fontSize:12, color:"var(--muted)" }}>—</td>
                        <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(a.created_at)}</td>
                        <td style={{ textAlign:"right" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit("admin", a)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

      {/* ── ADD MECHANIC MODAL ── */}
      {addModal === "mechanic" && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>New Mechanic</h3>
                <div className="modal-head-sub">Create a mechanic account and grant portal access</div>
              </div>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field"><label>Full Name *</label><input value={mechForm.name} onChange={e => setMechForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" autoFocus /></div>
              <div className="field"><label>Email *</label><input type="email" value={mechForm.email} onChange={e => setMechForm(f=>({...f,email:e.target.value}))} placeholder="jane@company.com" /></div>
              <div className="field"><label>Password *</label><input type="password" value={mechForm.password} onChange={e => setMechForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreateMechanic} disabled={saving}>{saving ? "Creating…" : "Create Mechanic"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ACCOUNT MANAGER MODAL ── */}
      {addModal === "account_manager" && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>New Account Manager</h3>
                <div className="modal-head-sub">Create an account manager account and grant portal access</div>
              </div>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field"><label>Email *</label><input type="email" value={amForm.email} onChange={e => setAmForm(f=>({...f,email:e.target.value}))} placeholder="manager@company.com" autoFocus /></div>
              <div className="field"><label>Password *</label><input type="password" value={amForm.password} onChange={e => setAmForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
              <div className="field"><label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label><input value={amForm.display_name} onChange={e => setAmForm(f=>({...f,display_name:e.target.value}))} placeholder="e.g. Sarah K." /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreateAccountManager} disabled={saving}>{saving ? "Creating…" : "Create Account Manager"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD COMPANY USER MODAL ── */}
      {addModal === "company_user" && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>New Company User</h3>
                <div className="modal-head-sub">Create a client account and link to a company</div>
              </div>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field"><label>Email *</label><input type="email" value={userForm.email} onChange={e => setUserForm(f=>({...f,email:e.target.value}))} placeholder="user@company.com" autoFocus /></div>
              <div className="field"><label>Password *</label><input type="password" value={userForm.password} onChange={e => setUserForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
              <div className="field">
                <label>Company *</label>
                <select value={userForm.company_id} onChange={e => setUserForm(f=>({...f,company_id:e.target.value}))}>
                  <option value="">— Select Company —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreateCompanyUser} disabled={saving}>{saving ? "Creating…" : "Create User"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{editModal.type === "mechanic" ? "Edit Mechanic" : editModal.type === "admin" ? "Edit Admin" : editModal.type === "account_manager" ? "Edit Account Manager" : "Edit Company User"}</h3>
                <div className="modal-head-sub">{editModal.record.email || editModal.record.user_id}</div>
              </div>
              <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              {editModal.type === "mechanic" && (
                <>
                  <div className="field">
                    <label>Full Name *</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditModal(null); }} />
                  </div>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of name)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder={editName || "e.g. Jake M."} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={editModal.record.email} disabled style={{ opacity:0.5 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveMechName(editModal.record.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </>
              )}
              {editModal.type === "company_user" && (
                <>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of user ID)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder="e.g. Acme Driver" autoFocus />
                  </div>
                  <div className="field">
                    <label>Company *</label>
                    <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)}>
                      <option value="">— Select Company —</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>User ID</label>
                    <input value={editModal.record.user_id} disabled style={{ opacity:0.5, fontFamily:"monospace", fontSize:12 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleReassignCompany(editModal.record.user_id)} disabled={saving || !editCompanyId}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </>
              )}
              {editModal.type === "admin" && (
                <>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of email)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder={editModal.record.email} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditModal(null); }} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={editModal.record.email} disabled style={{ opacity:0.5 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveAdminDisplayName(editModal.record.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </>
              )}
              {editModal.type === "account_manager" && (
                <>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of email)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder={editModal.record.email} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditModal(null); }} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={editModal.record.email} disabled style={{ opacity:0.5 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveAMDisplayName(editModal.record.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                  <div style={{ borderTop:"1px solid var(--rim)", marginTop:16, paddingTop:14 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#a78bfa", marginBottom:8 }}>Assigned Companies</div>
                    {amCompanies.filter(a => a.account_manager_id === editModal.record.id).length === 0 ? (
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>No companies assigned yet.</div>
                    ) : (
                      amCompanies.filter(a => a.account_manager_id === editModal.record.id).map(a => (
                        <div key={a.company_id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:13 }}>{companiesMap[a.company_id] || a.company_id}</span>
                          <button className="btn btn-danger btn-sm" onClick={() => handleUnassignCompanyFromAM(editModal.record.id, a.company_id)}>Remove</button>
                        </div>
                      ))
                    )}
                    <div style={{ display:"flex", gap:6, marginTop:8 }}>
                      <select style={{ flex:1, background:"var(--surface-2)", border:"1px solid var(--rim)", borderRadius:5, color:"var(--snow)", padding:"6px 8px", fontSize:13 }}
                        value={editAssignCompanyId} onChange={e => setEditAssignCompanyId(e.target.value)}>
                        <option value="">— Add Company —</option>
                        {companies.filter(c => !amCompanies.some(a => a.account_manager_id === editModal.record.id && a.company_id === c.id))
                          .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssignCompanyToAM(editModal.record.id)} disabled={saving || !editAssignCompanyId}>{saving ? "…" : "Add"}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

  const handleNav = (id) => { setTab(id); setSidebarOpen(false); };

  const navItems = [
    { id:"requests",  label:"Service Requests", icon:<IcoWrench /> },
    { id:"companies", label:"Companies",        icon:<IcoBuilding /> },
    { id:"mechanics", label:"Mechanics",        icon:<IcoUsers /> },
    { id:"billing",   label:"Billing",          icon:<IcoDollar /> },
    { id:"vehicles",  label:"Vehicle Registry", icon:<IcoCar /> },
    { id:"users",     label:"User Management",  icon:<IcoUserCog /> },
  ];

  const pageTitle = { requests:"Service Requests", companies:"Companies", mechanics:"Mechanics", billing:"Billing", vehicles:"Vehicle Registry", users:"User Management" };

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
              {tab === "billing"   && <Billing />}
              {tab === "vehicles"  && <VehicleRegistry adminDisplayName={adminDisplayName} />}
              {tab === "users"    && <UserManagement />}
            </div>
          </main>
        </div>
      )}
    </>
  );
}
