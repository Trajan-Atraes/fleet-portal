import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { IcoRefresh, IcoChevron } from "../components/Icons";

// ─── CONSTANTS ───────────────────────────────────────────────
const PAGE_SIZE = 25;
const CATEGORIES = ["ALL", "AUTH", "DATA", "ADMIN", "SYSTEM"];
const ACTION_OPTIONS = [
  "ALL", "INSERT", "UPDATE", "DELETE",
  "login_success", "login_failure", "logout",
  "user_create", "password_change",
];
const TABLE_OPTIONS = [
  "ALL", "auth", "service_requests", "invoices", "service_lines",
  "vehicles", "admins", "mechanics", "account_managers",
  "account_manager_companies", "company_users",
];

const CATEGORY_META = {
  AUTH:   { color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.22)", icon: "🔐" },
  DATA:   { color: "#3b82f6", bg: "rgba(59,130,246,0.10)",  border: "rgba(59,130,246,0.22)", icon: "📊" },
  ADMIN:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)",  border: "rgba(245,158,11,0.22)", icon: "⚙️" },
  SYSTEM: { color: "#6b7280", bg: "rgba(107,114,128,0.10)", border: "rgba(107,114,128,0.22)", icon: "🖥" },
};

const SEVERITY_META = {
  critical: { color: "#ef4444", bg: "rgba(239,68,68,0.10)", border: "rgba(239,68,68,0.22)" },
  warning:  { color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "rgba(245,158,11,0.22)" },
  info:     { color: "#3b82f6", bg: "rgba(59,130,246,0.10)", border: "rgba(59,130,246,0.22)" },
};

const ACTION_COLOR = {
  INSERT: "#10b981", UPDATE: "#3b82f6", DELETE: "#ef4444",
  login_success: "#10b981", login_failure: "#ef4444", logout: "#6b7280",
  user_create: "#8b5cf6", password_change: "#f59e0b",
};

// ─── SCOPED STYLES ──────────────────────────────────────────
const css = `
  .audit-page { animation: slideUp 0.25s ease; }

  /* ── stat cards with glow accent ── */
  .audit-stat {
    background: var(--raised); border: 1px solid var(--border); border-radius: 6px;
    padding: 16px 18px; position: relative; overflow: hidden;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .audit-stat:hover { border-color: var(--rim); }
  .audit-stat::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .audit-stat-icon {
    width: 32px; height: 32px; border-radius: 6px; display: flex;
    align-items: center; justify-content: center; font-size: 14px; margin-bottom: 10px;
  }
  .audit-stat-val {
    font-family: 'Barlow Condensed', sans-serif; font-size: 28px;
    font-weight: 900; line-height: 1; color: var(--white); margin-bottom: 3px;
  }
  .audit-stat-label {
    font-size: 10px; font-weight: 600; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--muted);
  }

  /* ── alerts banner ── */
  .audit-alerts-bar {
    background: rgba(239,68,68,0.06); border: 1px solid rgba(239,68,68,0.18);
    border-radius: 6px; margin-bottom: 16px; overflow: hidden;
    transition: all 0.2s;
  }
  .audit-alerts-header {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    cursor: pointer; user-select: none;
  }
  .audit-alerts-header:hover { background: rgba(239,68,68,0.04); }
  .audit-alert-count {
    font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #fca5a5;
  }
  .audit-alert-row {
    display: flex; align-items: center; gap: 10px; padding: 8px 14px;
    border-top: 1px solid rgba(239,68,68,0.10); font-size: 12px; color: var(--body);
    transition: background 0.15s;
  }
  .audit-alert-row:hover { background: rgba(239,68,68,0.04); }

  /* ── filter bar ── */
  .audit-filters {
    display: flex; gap: 6px; flex-wrap: wrap; align-items: center; margin-bottom: 14px;
  }
  .audit-filter-select {
    font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 0 10px; height: 28px; border-radius: 4px;
    background: var(--raised); border: 1px solid var(--border); color: var(--body);
    cursor: pointer; outline: none; transition: border-color 0.15s;
  }
  .audit-filter-select:hover { border-color: var(--rim); }
  .audit-filter-select:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }
  .audit-search {
    font-family: 'Barlow', sans-serif; font-size: 12px;
    padding: 0 10px; height: 28px; border-radius: 4px; width: 180px;
    background: var(--raised); border: 1px solid var(--border);
    color: var(--text); outline: none; transition: border-color 0.15s;
  }
  .audit-search::placeholder { color: var(--dim); }
  .audit-search:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }
  .audit-date {
    font-family: 'Barlow', sans-serif; font-size: 11px;
    padding: 0 8px; height: 28px; border-radius: 4px;
    background: var(--raised); border: 1px solid var(--border);
    color: var(--body); outline: none; transition: border-color 0.15s;
  }
  .audit-date:focus { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-dim); }

  /* ── compliance report panel ── */
  .audit-report-panel {
    background: var(--raised); border: 1px solid var(--border); border-radius: 6px;
    padding: 14px 16px; margin-bottom: 14px; display: flex;
    align-items: center; gap: 10px; flex-wrap: wrap;
    animation: slideUp 0.2s ease;
  }

  /* ── table ── */
  .audit-table-wrap {
    background: var(--raised); border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden;
  }
  .audit-table { width: 100%; border-collapse: collapse; }
  .audit-table thead tr { background: var(--surface); }
  .audit-table th {
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase; color: var(--soft);
    padding: 0 14px; height: 32px; text-align: left; white-space: nowrap;
    border-bottom: 1px solid var(--border);
  }
  .audit-table td {
    padding: 0 14px; height: 38px; font-size: 12px;
    border-bottom: 1px solid rgba(28,45,66,0.6); vertical-align: middle; color: var(--body);
  }
  .audit-table tbody tr { cursor: pointer; transition: background 0.12s; }
  .audit-table tbody tr:hover td { background: rgba(255,255,255,0.03); }
  .audit-table tbody tr:last-child td { border-bottom: none; }
  .audit-table tbody tr.expanded td { background: rgba(245,158,11,0.03); border-bottom-color: transparent; }

  /* ── expanded detail row ── */
  .audit-detail-cell {
    background: var(--surface); padding: 16px 18px;
    border-bottom: 2px solid var(--border);
  }
  .audit-detail-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
    margin-bottom: 14px; font-size: 11px;
  }
  .audit-detail-label {
    font-size: 9px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--dim); margin-bottom: 2px;
  }
  .audit-detail-val { font-family: monospace; font-size: 11px; color: var(--body); word-break: break-all; }

  /* ── diff viewer ── */
  .audit-diff-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
  .audit-diff-pane {
    border-radius: 5px; padding: 12px; margin: 0;
    white-space: pre-wrap; word-break: break-all;
    font-family: monospace; font-size: 10px; line-height: 1.6;
    max-height: 320px; overflow: auto;
  }
  .audit-diff-pane.before {
    background: rgba(239,68,68,0.05); border: 1px solid rgba(239,68,68,0.12);
    color: #fca5a5;
  }
  .audit-diff-pane.after {
    background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.12);
    color: #6ee7b7;
  }
  .audit-diff-label {
    font-size: 9px; font-weight: 700; letter-spacing: 0.14em;
    text-transform: uppercase; margin-bottom: 6px; display: flex;
    align-items: center; gap: 6px;
  }
  .audit-diff-dot { width: 6px; height: 6px; border-radius: 50%; }

  /* ── badge components ── */
  .audit-badge {
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 3px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px;
    font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    white-space: nowrap;
  }
  .audit-action-badge {
    font-family: 'Barlow Condensed', sans-serif; font-size: 10px;
    font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 2px 7px; border-radius: 3px;
  }

  /* ── pagination ── */
  .audit-pagination {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 14px; padding: 0 2px;
  }
  .audit-page-info {
    font-size: 11px; color: var(--muted);
    font-family: 'Barlow Condensed', sans-serif; letter-spacing: 0.06em;
  }
  .audit-page-btns { display: flex; gap: 6px; }

  /* ── responsive ── */
  @media (max-width: 768px) {
    .audit-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .audit-diff-wrap { grid-template-columns: 1fr; }
    .audit-detail-grid { grid-template-columns: 1fr; }
    .audit-filters { gap: 4px; }
    .audit-search { width: 140px; }
  }
`;

// ─── HELPERS ─────────────────────────────────────────────────
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    + " " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
};

const fmtDateFull = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    + " " + dt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" });
};

const friendlyAction = (a) => {
  const map = {
    INSERT: "Created", UPDATE: "Modified", DELETE: "Removed",
    login_success: "Login", login_failure: "Failed Login", logout: "Logout",
    user_create: "User Created", password_change: "Password Changed",
  };
  return map[a] || a;
};

const friendlyTable = (t) => {
  const map = {
    service_requests: "Service Request", invoices: "Invoice", service_lines: "Service Line",
    vehicles: "Vehicle", admins: "Admin", mechanics: "Mechanic",
    account_managers: "Account Mgr", company_users: "Company User",
    account_manager_companies: "AM ↔ Company", auth: "Authentication",
  };
  return map[t] || t;
};

// ─── DIFF VIEWER ─────────────────────────────────────────────
function DiffView({ oldData, newData, action }) {
  if (!oldData && !newData) return <span style={{ color: "var(--dim)", fontSize: 11 }}>No data captured</span>;

  const old = oldData || {};
  const nw = newData || {};

  // For UPDATEs, show only changed fields
  let displayOld = old;
  let displayNew = nw;
  if (action === "UPDATE" && Object.keys(old).length > 0 && Object.keys(nw).length > 0) {
    const changedOld = {};
    const changedNew = {};
    for (const key of Object.keys(nw)) {
      if (JSON.stringify(old[key]) !== JSON.stringify(nw[key])) {
        changedOld[key] = old[key];
        changedNew[key] = nw[key];
      }
    }
    if (Object.keys(changedNew).length > 0) {
      displayOld = changedOld;
      displayNew = changedNew;
    }
  }

  return (
    <div className="audit-diff-wrap">
      {Object.keys(displayOld).length > 0 && (
        <div>
          <div className="audit-diff-label" style={{ color: "#ef4444" }}>
            <span className="audit-diff-dot" style={{ background: "#ef4444" }} />
            {action === "DELETE" ? "Deleted Record" : "Before"}
          </div>
          <pre className="audit-diff-pane before">{JSON.stringify(displayOld, null, 2)}</pre>
        </div>
      )}
      {Object.keys(displayNew).length > 0 && (
        <div>
          <div className="audit-diff-label" style={{ color: "#10b981" }}>
            <span className="audit-diff-dot" style={{ background: "#10b981" }} />
            {action === "INSERT" ? "New Record" : "After"}
          </div>
          <pre className="audit-diff-pane after">{JSON.stringify(displayNew, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

// ─── ALERTS PANEL ────────────────────────────────────────────
function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("audit_alerts")
        .select("*").eq("acknowledged", false)
        .order("created_at", { ascending: false }).limit(50);
      setAlerts(data || []);
      setLoading(false);
    })();
  }, []);

  const acknowledge = async (id) => {
    const sess = (await supabase.auth.getSession()).data.session;
    await supabase.from("audit_alerts").update({
      acknowledged: true, acknowledged_by: sess.user.id, acknowledged_at: new Date().toISOString(),
    }).eq("id", id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const acknowledgeAll = async () => {
    const sess = (await supabase.auth.getSession()).data.session;
    const ids = alerts.map(a => a.id);
    await supabase.from("audit_alerts").update({
      acknowledged: true, acknowledged_by: sess.user.id, acknowledged_at: new Date().toISOString(),
    }).in("id", ids);
    setAlerts([]);
  };

  if (loading || alerts.length === 0) return null;

  return (
    <div className="audit-alerts-bar">
      <div className="audit-alerts-header" onClick={() => setExpanded(e => !e)}>
        <span style={{
          width: 20, height: 20, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(239,68,68,0.15)", fontSize: 10,
        }}>
          <svg width="12" height="12" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </span>
        <span className="audit-alert-count">
          {alerts.length} Unacknowledged Alert{alerts.length !== 1 ? "s" : ""}
        </span>
        <span style={{
          transform: expanded ? "rotate(90deg)" : "rotate(0)", transition: "transform 0.15s",
          color: "#fca5a5", display: "flex", marginLeft: 4,
        }}><IcoChevron /></span>
        <span style={{ flex: 1 }} />
        {expanded && alerts.length > 1 && (
          <button onClick={(e) => { e.stopPropagation(); acknowledgeAll(); }}
            className="btn btn-sm" style={{
              fontSize: 10, background: "rgba(239,68,68,0.12)", color: "#fca5a5",
              border: "1px solid rgba(239,68,68,0.25)", letterSpacing: "0.08em",
            }}>
            Acknowledge All
          </button>
        )}
      </div>
      {expanded && alerts.map(a => {
        const sev = SEVERITY_META[a.severity] || SEVERITY_META.warning;
        return (
          <div key={a.id} className="audit-alert-row">
            <span className="audit-badge" style={{
              background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`,
            }}>{a.severity}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{a.message}</span>
            <span style={{ color: "var(--dim)", fontSize: 10, whiteSpace: "nowrap", fontFamily: "monospace" }}>
              {fmtDate(a.created_at)}
            </span>
            <button onClick={() => acknowledge(a.id)} className="btn btn-sm btn-ghost"
              style={{ fontSize: 9, padding: "3px 10px", minWidth: 40 }}>Ack</button>
          </div>
        );
      })}
    </div>
  );
}

// ─── CSV EXPORT ──────────────────────────────────────────────
function exportToCsv(rows) {
  const headers = ["Timestamp", "User", "Category", "Action", "Resource", "Record ID", "Status", "Old Data", "New Data"];
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push([
      `"${r.changed_at}"`, `"${r.user_email || ""}"`, `"${r.category}"`, `"${r.action}"`,
      `"${r.table_name}"`, `"${r.record_id}"`, `"${r.status}"`,
      `"${JSON.stringify(r.old_data || {}).replace(/"/g, '""')}"`,
      `"${JSON.stringify(r.new_data || {}).replace(/"/g, '""')}"`,
    ].join(","));
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── COMPLIANCE REPORT ───────────────────────────────────────
async function downloadComplianceReport(startDate, endDate) {
  const { data, error } = await supabase.rpc("generate_compliance_report", {
    p_start: startDate, p_end: endDate,
  });
  if (error) { alert("Error generating report: " + error.message); return; }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compliance-report-${startDate.slice(0, 10)}-to-${endDate.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function AdminAuditLog() {
  const [logs, setLogs]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [category, setCategory]     = useState("ALL");
  const [action, setAction]         = useState("ALL");
  const [table, setTable]           = useState("ALL");
  const [search, setSearch]         = useState("");
  const [dateFrom, setDateFrom]     = useState("");
  const [dateTo, setDateTo]         = useState("");

  // Compliance report
  const [showReport, setShowReport] = useState(false);
  const [reportFrom, setReportFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [reportTo, setReportTo]     = useState(() => new Date().toISOString().slice(0, 10));

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let q = supabase.from("audit_logs").select("*", { count: "exact" });

    if (category !== "ALL") q = q.eq("category", category);
    if (action !== "ALL") q = q.eq("action", action);
    if (table !== "ALL") q = q.eq("table_name", table);
    if (search) q = q.ilike("user_email", `%${search}%`);
    if (dateFrom) q = q.gte("changed_at", new Date(dateFrom).toISOString());
    if (dateTo) {
      const end = new Date(dateTo); end.setDate(end.getDate() + 1);
      q = q.lt("changed_at", end.toISOString());
    }

    q = q.order("changed_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    const { data, count } = await q;
    setLogs(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [category, action, table, search, dateFrom, dateTo, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = category !== "ALL" || action !== "ALL" || table !== "ALL" || search || dateFrom || dateTo;
  const resetFilters = () => {
    setCategory("ALL"); setAction("ALL"); setTable("ALL");
    setSearch(""); setDateFrom(""); setDateTo(""); setPage(0);
  };

  // Page-level stats
  const authCount = logs.filter(l => l.category === "AUTH").length;
  const failCount = logs.filter(l => l.status === "failure").length;
  const deleteCount = logs.filter(l => l.action === "DELETE").length;

  return (
    <>
      <style>{css}</style>
      <div className="audit-page">

        {/* ── ALERTS ── */}
        <AlertsPanel />

        {/* ── STATS ROW ── */}
        <div className="audit-stat-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16,
        }}>
          <div className="audit-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--accent), transparent)" }} />
            <div className="audit-stat-icon" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="audit-stat-val">{total.toLocaleString()}</div>
            <div className="audit-stat-label">Total Events</div>
          </div>

          <div className="audit-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #8b5cf6, transparent)" }} />
            <div className="audit-stat-icon" style={{ background: "rgba(139,92,246,0.12)", color: "#a78bfa" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <div className="audit-stat-val" style={{ color: "#a78bfa" }}>{authCount}</div>
            <div className="audit-stat-label">Auth Events</div>
          </div>

          <div className="audit-stat">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, #ef4444, transparent)" }} />
            <div className="audit-stat-icon" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div className="audit-stat-val" style={{ color: "#f87171" }}>{failCount}</div>
            <div className="audit-stat-label">Failures</div>
          </div>

          <div className="audit-stat" style={{ cursor: "pointer" }} onClick={() => setShowReport(r => !r)}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, #10b981, transparent)` }} />
            <div className="audit-stat-icon" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="audit-stat-val" style={{ color: "#34d399", fontSize: 16, letterSpacing: "0.06em" }}>
              {showReport ? "CLOSE" : "EXPORT"}
            </div>
            <div className="audit-stat-label">Compliance</div>
          </div>
        </div>

        {/* ── COMPLIANCE REPORT PANEL ── */}
        {showReport && (
          <div className="audit-report-panel">
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              color: "var(--muted)", whiteSpace: "nowrap",
            }}>Report Period</span>
            <input type="date" className="audit-date" value={reportFrom} onChange={e => setReportFrom(e.target.value)} />
            <span style={{ color: "var(--dim)", fontSize: 11 }}>to</span>
            <input type="date" className="audit-date" value={reportTo} onChange={e => setReportTo(e.target.value)} />
            <button className="btn btn-sm btn-primary" onClick={() => downloadComplianceReport(
              new Date(reportFrom).toISOString(), new Date(new Date(reportTo).setDate(new Date(reportTo).getDate() + 1)).toISOString()
            )}>Download JSON</button>
            <button className="btn btn-sm btn-ghost" onClick={() => exportToCsv(logs)}>Export Page CSV</button>
          </div>
        )}

        {/* ── FILTERS ── */}
        <div className="audit-filters">
          <select className="audit-filter-select" value={category} onChange={e => { setCategory(e.target.value); setPage(0); }}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>)}
          </select>
          <select className="audit-filter-select" value={action} onChange={e => { setAction(e.target.value); setPage(0); }}>
            {ACTION_OPTIONS.map(a => <option key={a} value={a}>{a === "ALL" ? "All Actions" : friendlyAction(a)}</option>)}
          </select>
          <select className="audit-filter-select" value={table} onChange={e => { setTable(e.target.value); setPage(0); }}>
            {TABLE_OPTIONS.map(t => <option key={t} value={t}>{t === "ALL" ? "All Resources" : friendlyTable(t)}</option>)}
          </select>
          <input type="text" className="audit-search" placeholder="Search by email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }} />
          <input type="date" className="audit-date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} />
          <span style={{ color: "var(--dim)", fontSize: 10 }}>to</span>
          <input type="date" className="audit-date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} />
          {hasFilters && (
            <button className="btn btn-sm btn-ghost" onClick={resetFilters} style={{ fontSize: 10 }}>Clear</button>
          )}
          <button className="btn btn-sm btn-ghost" onClick={fetchLogs} title="Refresh" style={{ padding: "5px 8px" }}>
            <IcoRefresh />
          </button>
        </div>

        {/* ── TABLE ── */}
        <div className="audit-table-wrap">
          <table className="audit-table">
            <thead>
              <tr>
                <th style={{ width: 24 }}></th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Category</th>
                <th>Action</th>
                <th>Resource</th>
                <th style={{ width: 90 }}>Record</th>
                <th style={{ width: 60 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--dim)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="20" height="20" fill="none" stroke="var(--dim)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24" style={{ animation: "pulse 1.2s infinite" }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Loading audit trail…</span>
                  </div>
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: 48, color: "var(--dim)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <svg width="20" height="20" fill="none" stroke="var(--dim)" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>No audit events found</span>
                    {hasFilters && <span style={{ fontSize: 10, color: "var(--dim)" }}>Try adjusting your filters</span>}
                  </div>
                </td></tr>
              ) : logs.map(log => {
                const catMeta = CATEGORY_META[log.category] || CATEGORY_META.SYSTEM;
                const actionColor = ACTION_COLOR[log.action] || "var(--muted)";
                const isExpanded = expandedId === log.id;
                return (
                  <>{/* eslint-disable-next-line react/jsx-key */}
                    <tr key={log.id}
                      className={isExpanded ? "expanded" : ""}
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                      <td style={{ textAlign: "center", width: 24 }}>
                        <span style={{
                          display: "inline-flex", transform: isExpanded ? "rotate(90deg)" : "rotate(0)",
                          transition: "transform 0.15s", opacity: 0.35,
                        }}><IcoChevron /></span>
                      </td>
                      <td style={{ whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 11, color: "var(--soft)" }}>
                        {fmtDate(log.changed_at)}
                      </td>
                      <td className="truncate" style={{ maxWidth: 180, fontSize: 11 }}>
                        {log.user_email || <span style={{ color: "var(--dim)" }}>system</span>}
                      </td>
                      <td>
                        <span className="audit-badge" style={{
                          background: catMeta.bg, color: catMeta.color, border: `1px solid ${catMeta.border}`,
                        }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: catMeta.color }} />
                          {log.category}
                        </span>
                      </td>
                      <td>
                        <span className="audit-action-badge" style={{
                          background: `${actionColor}18`, color: actionColor, border: `1px solid ${actionColor}33`,
                        }}>{friendlyAction(log.action)}</span>
                      </td>
                      <td style={{ fontSize: 11 }}>{friendlyTable(log.table_name)}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 10, color: "var(--dim)" }}>
                        {log.record_id?.slice(0, 8)}
                      </td>
                      <td>
                        {log.status === "failure" ? (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            color: "#f87171",
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} />
                            Fail
                          </span>
                        ) : (
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            color: "#34d399",
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`}>
                        <td colSpan={8} className="audit-detail-cell">
                          <div className="audit-detail-grid">
                            <div>
                              <div className="audit-detail-label">Full Record ID</div>
                              <div className="audit-detail-val">{log.record_id}</div>
                            </div>
                            <div>
                              <div className="audit-detail-label">Timestamp</div>
                              <div className="audit-detail-val">{fmtDateFull(log.changed_at)}</div>
                            </div>
                            <div>
                              <div className="audit-detail-label">Changed By (UID)</div>
                              <div className="audit-detail-val">{log.changed_by || "—"}</div>
                            </div>
                            <div>
                              <div className="audit-detail-label">Email</div>
                              <div className="audit-detail-val">{log.user_email || "—"}</div>
                            </div>
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <div style={{ gridColumn: "1 / -1" }}>
                                <div className="audit-detail-label">Metadata</div>
                                <div className="audit-detail-val">{JSON.stringify(log.metadata)}</div>
                              </div>
                            )}
                          </div>
                          <DiffView oldData={log.old_data} newData={log.new_data} action={log.action} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {totalPages > 1 && (
          <div className="audit-pagination">
            <span className="audit-page-info">
              Page {page + 1} of {totalPages} — {total.toLocaleString()} events
            </span>
            <div className="audit-page-btns">
              <button className="btn btn-sm btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                Previous
              </button>
              <button className="btn btn-sm btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
