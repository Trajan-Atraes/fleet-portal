import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, SUPABASE_URL } from "./lib/supabase";
import { SQUARE_APP_ID, SQUARE_LOCATION_ID, loadSquareSDK } from "./lib/square";
import { IcoWrench, IcoPlus, IcoRefresh } from "./components/Icons";
import { servicestolineItems, computeLineItemTotals } from "./components/LineItemsEditor";

// ─── PORTAL-SPECIFIC OVERRIDES (CLIENT — AMBER, SPLIT AUTH, TOPBAR) ──
const css = `
  /* ── Client auth: split-panel layout (overrides shared centered card) ── */
  .auth-wrap { display:grid; grid-template-columns:1.3fr 1fr; height:100dvh; align-items:stretch; }
  .auth-hero {
    background:var(--surface); border-right:1px solid var(--border);
    display:flex; flex-direction:column; justify-content:center; padding:72px 64px;
    position:relative; overflow:hidden; min-height:0;
  }
  .auth-hero::before {
    content:''; position:absolute; width:140%; height:140%; top:-20%; left:-20%;
    background:radial-gradient(ellipse 50% 50% at 50% 50%, rgba(245,158,11,0.09) 0%, transparent 65%);
    pointer-events:none;
    animation:orbDrift 14s ease-in-out infinite;
  }
  @keyframes orbDrift {
    0%   { transform:translate(30%, -10%); }
    25%  { transform:translate(-5%, 20%); }
    50%  { transform:translate(15%, 35%); }
    75%  { transform:translate(35%, 5%); }
    100% { transform:translate(30%, -10%); }
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

  .auth-form-panel { background:var(--base); display:flex; align-items:center; justify-content:center; padding:48px; min-height:0; }
  .auth-card { max-width:340px; padding:0; background:none; border:none; }

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

  /* ── Client uses topbar instead of sidebar ── */
  .app-shell { flex-direction:column; }

  /* ── Topbar ── */
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

  /* ── Content area ── */
  .content-area { flex:1; overflow-y:auto; padding:20px; }

  /* ── Client input bg override ── */
  input, select, textarea { background:var(--raised); }

  /* ── Client modal (narrower, no head border) ── */
  .modal { max-width:500px; }
  @media (min-width:900px) { .modal { max-width:500px; } }
  .modal-head { border-bottom:none; padding-bottom:0; }

  /* ── Client detail grid (narrower label col) ── */
  .detail-grid { grid-template-columns:100px 1fr; row-gap:2px; font-size:13px; }
  .detail-label { height:auto; }
  .detail-value { height:auto; }

  /* ── Client table: no row cursor ── */
  tbody tr:hover td { cursor:default; }

  /* ── Responsive ── */
  @media (max-width:768px) {
    .auth-wrap { grid-template-columns:1fr; min-height:100dvh; }
    .auth-hero { display:none; }
    .auth-form-panel { padding:32px 24px; }
    .auth-card { max-width:360px; padding:0; }
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

// Consolidated billing badge for clients — single badge per SR
function ClientBillingBadge({ lines }) {
  if (!lines || lines.length === 0) return <span style={{ fontSize:11, color:"var(--dim)" }}>—</span>;
  const allApproved = lines.every(l => l.status === "approved" || l.status === "client_billed" || l.status === "paid");
  const s = allApproved
    ? { bg:"rgba(16,185,129,0.12)", color:"#34d399", label:"Approved" }
    : { bg:"rgba(55,79,104,0.25)",  color:"#526a84", label:"Processing" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"0 7px",
      height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      <span style={{ width:4, height:4, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {s.label}
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
    if (err || !data?.session) {
      setError(err?.message || "Invalid email or password.");
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "client" } }).catch(() => {});
      return;
    }
    supabase.rpc("log_auth_event", { p_action: "login_success", p_status: "success", p_metadata: { portal: "client" } }).catch(() => {});
    onLogin(data.session);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <div className="auth-hero-eyebrow">Fleet Maintenance Platform</div>
        <div className="auth-hero-logo">JUR<em>MOB</em>Y</div>
        <div className="auth-hero-sub">Fleet Maintenance</div>
        <p>Submit maintenance requests, track service progress, and manage your entire fleet from one workspace.</p>
        <div className="feature-list">
          <div className="feature-item"><span className="feature-dot"/><span>Real-time request tracking</span></div>
          <div className="feature-item"><span className="feature-dot"/><span>Full service history per vehicle</span></div>
          <div className="feature-item"><span className="feature-dot"/><span>Multi-vehicle fleet support</span></div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-card-logo">
            <span>JUR<span>MOB</span>Y</span>
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

          <div style={{ marginTop:32, fontSize:10, color:"var(--dim)", textAlign:"center", letterSpacing:"0.04em" }}>
            &copy; {new Date().getFullYear()} Jurmoby &middot; v{__APP_VERSION__}
          </div>
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

// ─── MY VEHICLES ─────────────────────────────────────────────
function VehicleStatusBadge({ status }) {
  const map = {
    "Road Worthy":   { bg:"var(--green-dim)", color:"#34d399", border:"rgba(16,185,129,0.22)" },
    Retired:         { bg:"var(--red-dim)",   color:"#f87171", border:"rgba(239,68,68,0.22)"  },
    "Not Road Worthy": { bg:"rgba(245,158,11,0.12)", color:"#fbbf24", border:"rgba(245,158,11,0.22)" },
  };
  const s = map[status] || map["Road Worthy"];
  return (
    <span className="badge" style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}` }}>
      <span className="badge-dot" style={{ background:s.color }} />
      {status}
    </span>
  );
}

function MyVehicles({ company }) {
  const [vehicles, setVehicles] = useState([]);
  const [groups, setGroups]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [srHistory, setSrHistory] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    const [{ data: vehs }, { data: grps }] = await Promise.all([
      supabase.from("vehicles").select("*").eq("company_id", company.id).order("vehicle_id", { ascending: true }),
      supabase.from("vehicle_groups").select("*").eq("company_id", company.id).order("sort_order").order("name"),
    ]);
    setVehicles(vehs || []);
    setGroups(grps || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [company?.id]);

  const toggleGroup = (key) => setCollapsedGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const openDetail = async (v) => {
    setSelected(v);
    setSrHistory([]);
    setSrLoading(true);
    const { data } = await supabase.from("service_requests")
      .select("id, request_number, status, created_at, mileage, updated_by_name, estimated_completion, service_lines(line_letter, service_name, is_completed)")
      .eq("vehicle_registry_id", v.id)
      .order("created_at", { ascending: false });
    setSrHistory(data || []);
    setSrLoading(false);
  };

  const fmtVDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  };

  const counts = {
    total:  vehicles.length,
    active: vehicles.filter(v => v.status === "Road Worthy").length,
    retired: vehicles.filter(v => v.status === "Retired").length,
    nrw:    vehicles.filter(v => v.status === "Not Road Worthy").length,
  };

  const filtered = vehicles.filter(v => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return [v.vehicle_id, v.vin, v.vehicle_make, v.vehicle_model, v.license_plate]
        .some(f => f && f.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">My Vehicles</div>
          <div className="page-sub">Fleet vehicles registered to {company?.name}</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      <div className="stats-row stats-4" style={{ maxWidth:480 }}>
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{counts.total}</div></div>
        <div className="stat-card"><div className="stat-label">Road Worthy</div><div className="stat-value c-green">{counts.active}</div></div>
        <div className="stat-card"><div className="stat-label">Retired</div><div className="stat-value c-red">{counts.retired}</div></div>
        <div className="stat-card"><div className="stat-label">Not Road Worthy</div><div className="stat-value c-amber">{counts.nrw}</div></div>
      </div>

      <div className="toolbar">
        <div className="filters">
          {[["all","All"],["Road Worthy","Road Worthy"],["Retired","Retired"],["Not Road Worthy","NRW"]].map(([val,lbl]) => (
            <button key={val} className={`filter-btn ${statusFilter === val ? "active" : ""}`} onClick={() => setStatusFilter(val)}>
              {lbl} ({val === "all" ? counts.total : val === "Road Worthy" ? counts.active : val === "Retired" ? counts.retired : counts.nrw})
            </button>
          ))}
        </div>
        <input className="search-input" placeholder="Search vehicles…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="loading-row">Loading vehicles…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{vehicles.length === 0 ? "No vehicles registered" : "No vehicles match"}</h3>
          <p>{vehicles.length === 0 ? "Your company has no vehicles in the registry yet. Contact your administrator." : "Try changing the filter or search term."}</p>
        </div>
      ) : (() => {
        // Build grouped sections
        const groupedSections = groups.map(g => ({
          key: g.id,
          name: g.name,
          vehicles: filtered.filter(v => v.group_id === g.id),
        }));
        const unassigned = filtered.filter(v => !v.group_id);
        if (unassigned.length > 0) groupedSections.push({ key: "__unassigned", name: "Unassigned", vehicles: unassigned });
        // If no groups exist at all, show flat list
        const showFlat = groups.length === 0;

        const renderTable = (vehs) => (
          <div className="table-wrap" style={{ maxWidth:1350 }}>
            <table>
              <thead>
                <tr>
                  <th>Unit #</th>
                  <th>VIN</th>
                  <th>Vehicle</th>
                  <th>License Plate</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehs.map(v => (
                  <tr key={v.id} onClick={() => openDetail(v)} style={{ cursor:"pointer" }}>
                    <td style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase" }}>{v.vehicle_id}</td>
                    <td className="mono">{v.vin || "—"}</td>
                    <td>{[v.vehicle_year, v.vehicle_make, v.vehicle_model].filter(Boolean).join(" ") || "—"}</td>
                    <td className="mono">{v.license_plate || "—"}</td>
                    <td><VehicleStatusBadge status={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

        return showFlat ? renderTable(filtered) : (
          <div>
            {groupedSections.filter(s => s.vehicles.length > 0).map(section => (
              <div key={section.key} style={{ marginBottom:16 }}>
                <button
                  onClick={() => toggleGroup(section.key)}
                  style={{
                    display:"flex", alignItems:"center", gap:8, background:"none", border:"none",
                    cursor:"pointer", padding:"6px 0", width:"100%", textAlign:"left",
                  }}
                >
                  <span style={{ fontSize:10, color:"var(--muted)", transition:"transform 0.15s", transform: collapsedGroups[section.key] ? "rotate(-90deg)" : "rotate(0deg)" }}>▼</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--snow)" }}>{section.name}</span>
                  <span style={{ fontSize:10, color:"var(--dim)", fontWeight:400 }}>({section.vehicles.length})</span>
                </button>
                {!collapsedGroups[section.key] && renderTable(section.vehicles)}
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── VEHICLE DETAIL MODAL ── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth:640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>{selected.vehicle_id}</h3>
                <div className="modal-head-sub">{[selected.vehicle_year, selected.vehicle_make, selected.vehicle_model].filter(Boolean).join(" ") || "No vehicle details"}</div>
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
              </div>

              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--snow)", marginBottom:10 }}>Service History</div>
              {srLoading ? (
                <div style={{ color:"var(--muted)", fontSize:13 }}>Loading…</div>
              ) : srHistory.length === 0 ? (
                <div style={{ color:"var(--muted)", fontSize:13 }}>No service requests for this vehicle yet.</div>
              ) : (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>SR #</th><th>Date</th><th>Services</th><th>Status</th><th>Mileage</th><th>Est. Completion</th></tr></thead>
                    <tbody>
                      {srHistory.map(r => {
                        const svcNames = (r.service_lines || []).map(l => l.service_name).filter(Boolean).join(", ");
                        return (
                          <tr key={r.id} style={{ cursor:"default" }}>
                            <td><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)" }}>{r.request_number}</span></td>
                            <td style={{ fontSize:11, color:"var(--body)", whiteSpace:"nowrap" }}>{fmtVDate(r.created_at)}</td>
                            <td style={{ fontSize:12, maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{svcNames || "—"}</td>
                            <td><StatusBadge status={r.status} /></td>
                            <td style={{ fontSize:12, color:"var(--soft)" }}>{r.mileage ? Number(r.mileage).toLocaleString() : "—"}</td>
                            <td style={{ fontSize:11, color: r.estimated_completion ? "var(--body)" : "var(--dim)", whiteSpace:"nowrap" }}>{r.estimated_completion ? new Date(r.estimated_completion + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Photo upload helpers ────────────────────────────────────
const PHOTO_BUCKET = "note-attachments";
const PHOTO_MAX_SIZE = 50 * 1024 * 1024;
const PHOTO_ALLOWED_MIME = new Set(["image/jpeg","image/jpg","image/png","image/heic","image/heif","video/mp4","video/quicktime"]);
const PHOTO_ALLOWED_EXT = new Set([".jpg",".jpeg",".png",".heic",".heif",".mp4",".mov"]);

function validatePhoto(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  if (!PHOTO_ALLOWED_MIME.has(file.type) && !PHOTO_ALLOWED_EXT.has(ext))
    return `"${file.name}" is not supported. Allowed: JPG, PNG, HEIC, MP4, MOV.`;
  if (file.size > PHOTO_MAX_SIZE)
    return `"${file.name}" exceeds the 50 MB limit.`;
  return null;
}

function isHeicPhoto(file) {
  const ext = "." + file.name.split(".").pop().toLowerCase();
  return file.type === "image/heic" || file.type === "image/heif" || ext === ".heic" || ext === ".heif";
}

async function convertHeicPhoto(file) {
  const { default: heic2any } = await import("heic2any");
  const blob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.85 });
  const result = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([result], newName, { type: "image/jpeg" });
}

// ─── REQUEST FORM ─────────────────────────────────────────────
function RequestForm({ session, company, displayName, onSuccess }) {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [form, setForm] = useState({
    vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"",
    vehicle_year:"", description:"",
  });
  const [vehicleRegistryId, setVehicleRegistryId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);

  // Photo state
  const [pendingPhotos, setPendingPhotos] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const fileInputRef = useRef(null);

  // Fetch active company vehicles for dropdown
  useEffect(() => {
    if (!company?.id) return;
    supabase.from("vehicles").select("*")
      .eq("company_id", company.id)
      .eq("status", "Road Worthy")
      .order("vehicle_id", { ascending: true })
      .then(({ data }) => setVehicles(data || []));
  }, [company?.id]);

  const handleVehicleSelect = (vId) => {
    setSelectedVehicleId(vId);
    if (!vId) {
      setForm(f => ({ ...f, vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"" }));
      setVehicleRegistryId(null);
      return;
    }
    const v = vehicles.find(x => x.id === vId);
    if (v) {
      setForm(f => ({
        ...f,
        vehicle_id: v.vehicle_id || "",
        vin: v.vin || "",
        vehicle_make: v.vehicle_make || "",
        vehicle_model: v.vehicle_model || "",
        vehicle_year: v.vehicle_year || "",
      }));
      setVehicleRegistryId(v.id);
    }
  };

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    const newEntries = [];
    for (const raw of files) {
      const err = validatePhoto(raw);
      if (err) { setError(err); continue; }
      let file = raw;
      if (isHeicPhoto(raw)) {
        try { file = await convertHeicPhoto(raw); } catch { setError(`Could not convert "${raw.name}".`); continue; }
      }
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      newEntries.push({ id: Math.random().toString(36).slice(2, 10), name: file.name, type: file.type, file, previewUrl });
    }
    if (newEntries.length) setPendingPhotos(prev => [...prev, ...newEntries]);
  };

  const removePhoto = (id) => {
    setPendingPhotos(prev => {
      const entry = prev.find(f => f.id === id);
      if (entry?.previewUrl) URL.revokeObjectURL(entry.previewUrl);
      return prev.filter(f => f.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (!selectedVehicleId || !form.description) {
      setError("Please select a vehicle and describe the issue."); return;
    }
    setLoading(true); setError("");

    const { data: sr, error: err } = await supabase.from("service_requests").insert({
      vehicle_id: form.vehicle_id,
      vin: form.vin,
      vehicle_make: form.vehicle_make,
      vehicle_model: form.vehicle_model,
      vehicle_year: form.vehicle_year,
      description: form.description,
      vehicle_registry_id: vehicleRegistryId,
      client_id: session.user.id,
      company_id: company.id,
      status: "pending",
    }).select("id").single();

    if (err) { setLoading(false); setError(err.message); return; }

    // Upload photos if any
    if (pendingPhotos.length > 0 && sr?.id) {
      try {
        setUploadProgress({});
        // Create note first
        const { data: note } = await supabase.from("sr_notes").insert({
          sr_id: sr.id,
          author_id: session.user.id,
          author_name: displayName || session.user.email || "Client",
          body: "Photos attached with service request",
          attachments: [],
          client_visible: true,
        }).select("id").single();

        if (note) {
          const attachments = [];
          for (const entry of pendingPhotos) {
            const path = `notes/${sr.id}/${note.id}/${entry.name}`;
            const { error: upErr } = await supabase.storage.from(PHOTO_BUCKET).upload(path, entry.file, {
              cacheControl: "3600", upsert: false,
              onUploadProgress: (p) => {
                setUploadProgress(prev => ({ ...prev, [entry.id]: Math.round((p.loaded / p.total) * 100) }));
              },
            });
            if (!upErr) attachments.push({ path, filename: entry.name, type: entry.type, size: entry.file.size });
          }
          if (attachments.length > 0) {
            await supabase.from("sr_notes").update({ attachments }).eq("id", note.id);
          }
        }
      } catch {
        // Photos failed but SR was created — don't block success
      }
    }

    setLoading(false);
    setSuccess(true);
    setSelectedVehicleId("");
    setVehicleRegistryId(null);
    setForm({ vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", description:"" });
    pendingPhotos.forEach(p => { if (p.previewUrl) URL.revokeObjectURL(p.previewUrl); });
    setPendingPhotos([]);
    setUploadProgress({});
    setTimeout(() => { setSuccess(false); onSuccess(); }, 2000);
  };

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId);

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

      <div className="card">
        <div className="form-grid">
          <div className="field full">
            <label>Select Vehicle <span style={{color:"var(--red)"}}>*</span></label>
            <select value={selectedVehicleId} onChange={e => handleVehicleSelect(e.target.value)}>
              <option value="">— Choose a vehicle —</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_id}{v.vehicle_year || v.vehicle_make || v.vehicle_model ? ` — ${[v.vehicle_year, v.vehicle_make, v.vehicle_model].filter(Boolean).join(" ")}` : ""}{v.vin ? ` (${v.vin})` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedVehicle && (
            <div className="full" style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 14px", marginBottom:4 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Selected Vehicle</div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:900, textTransform:"uppercase", color:"var(--white)" }}>{selectedVehicle.vehicle_id}</div>
              <div style={{ fontSize:12, color:"var(--soft)", marginTop:2 }}>
                {[selectedVehicle.vehicle_year, selectedVehicle.vehicle_make, selectedVehicle.vehicle_model].filter(Boolean).join(" ") || "—"}
                {selectedVehicle.vin && <span style={{ marginLeft:12, fontFamily:"monospace", fontSize:11, color:"var(--muted)" }}>VIN: {selectedVehicle.vin}</span>}
                {selectedVehicle.license_plate && <span style={{ marginLeft:12, fontSize:11, color:"var(--muted)" }}>Plate: {selectedVehicle.license_plate}</span>}
              </div>
            </div>
          )}

          <div className="field full">
            <label>Issue Description <span style={{color:"var(--red)"}}>*</span></label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe the issue — symptoms, when it started, warning lights, etc." />
          </div>

          {/* ── Add Photos ─────────────────────────────────── */}
          <div className="field full">
            <label>Photos / Videos</label>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>
              Attach photos or videos of the issue (JPG, PNG, HEIC, MP4, MOV — max 50 MB each)
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,video/mp4,video/quicktime,.heic,.heif" multiple
              style={{ display:"none" }} onChange={handleFileSelect} />

            {pendingPhotos.length > 0 && (
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                {pendingPhotos.map(entry => (
                  <div key={entry.id} style={{ position:"relative", display:"inline-block", flexShrink:0 }}>
                    {entry.previewUrl ? (
                      <img src={entry.previewUrl} alt={entry.name}
                        style={{ width:72, height:72, objectFit:"cover", borderRadius:4, border:"1px solid var(--border)", display:"block" }} />
                    ) : (
                      <div style={{
                        width:72, height:72, borderRadius:4, border:"1px solid var(--border)",
                        background:"var(--surface)", display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:9, color:"var(--muted)", textAlign:"center", padding:4,
                      }}>
                        {entry.name.split(".").pop().toUpperCase()}
                      </div>
                    )}
                    {uploadProgress[entry.id] != null && uploadProgress[entry.id] < 100 && (
                      <>
                        <div style={{ position:"absolute", bottom:0, left:0, right:0, height:4, background:"rgba(0,0,0,0.45)", borderRadius:"0 0 4px 4px" }}>
                          <div style={{ height:"100%", background:"var(--accent)", borderRadius:"0 0 4px 4px", width:`${uploadProgress[entry.id]}%`, transition:"width 0.15s" }} />
                        </div>
                        <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.3)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <span style={{ fontSize:9, color:"#fff" }}>{uploadProgress[entry.id]}%</span>
                        </div>
                      </>
                    )}
                    {!loading && (
                      <button onClick={() => removePhoto(entry.id)} title="Remove"
                        style={{
                          position:"absolute", top:-6, right:-6, width:16, height:16,
                          borderRadius:"50%", background:"#ef4444", border:"none",
                          cursor:"pointer", color:"#fff", fontSize:11, padding:0,
                          display:"flex", alignItems:"center", justifyContent:"center", lineHeight:1, zIndex:1,
                        }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileInputRef.current?.click()} disabled={loading}
              style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
              </svg>
              Add Photos
            </button>
          </div>
        </div>
        <div style={{ display:"flex", justifyContent:"flex-end", marginTop:4 }}>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? (pendingPhotos.length > 0 ? "Uploading…" : "Submitting…") : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT SR DETAIL MODAL ──────────────────────────────────
function ClientSRModal({ request, onClose }) {
  const [notes, setNotes]     = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [downloadableInvoices, setDownloadableInvoices] = useState([]);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!request?.id) return;
    setLoadingNotes(true);
    supabase.from("sr_notes")
      .select("id, body, author_name, created_at, client_visible")
      .eq("sr_id", request.id)
      .eq("client_visible", true)
      .order("created_at", { ascending: true })
      .then(({ data }) => { setNotes(data || []); setLoadingNotes(false); });

    // Fetch invoices eligible for client PDF download:
    // approved status, has line_items, linked service line is complete
    supabase.from("invoices")
      .select("id, status, line_items, service_line_id, service_lines(line_letter, is_completed)")
      .eq("service_request_id", request.id)
      .eq("status", "approved")
      .eq("is_incognito", false)
      .not("line_items", "is", null)
      .then(({ data }) => {
        const eligible = (data || []).filter(inv => {
          if (!inv.line_items) return false;
          const li = inv.line_items;
          const hasItems = Array.isArray(li) ? li.length > 0 : (li.services && li.services.length > 0);
          if (!hasItems) return false;
          return inv.service_lines?.is_completed === true;
        });
        eligible.sort((a, b) => (a.service_lines?.line_letter || "").localeCompare(b.service_lines?.line_letter || ""));
        setDownloadableInvoices(eligible);
      });
  }, [request?.id]);

  const handleDownloadPdf = async (invoiceId) => {
    setDownloading(invoiceId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) { setDownloading(null); return; }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) { setDownloading(null); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match ? match[1] : `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
    setDownloading(null);
  };

  if (!request) return null;

  const fmtDate = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth:540 }} onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{request.request_number}</h3>
            <div className="modal-head-sub">{fmtDate(request.created_at)}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Vehicle block */}
          <div className="vehicle-block">
            <div className="vehicle-block-eyebrow">Vehicle</div>
            <div className="vehicle-block-id">{request.vehicle_id}</div>
            <div className="vehicle-block-meta">
              {[request.vehicle_year, request.vehicle_make, request.vehicle_model].filter(Boolean).join(" ") || "—"}
              {request.vin && <span style={{ marginLeft:12, fontFamily:"monospace", fontSize:11 }}>VIN: {request.vin}</span>}
            </div>
          </div>

          {/* Detail grid */}
          <div className="detail-grid">
            <div className="detail-label">Vehicle Status</div>
            <div className="detail-value">{request.vehicles?.status ? <VehicleStatusBadge status={request.vehicles.status} /> : <span style={{ color:"var(--dim)" }}>—</span>}</div>
            <div className="detail-label">Service Status</div>
            <div className="detail-value"><StatusBadge status={request.status} /></div>
            <div className="detail-label">Est. Completion</div>
            <div className="detail-value" style={{ fontSize:12 }}>
              {request.estimated_completion
                ? new Date(request.estimated_completion + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
                : <span style={{ color:"var(--dim)" }}>Not set</span>}
            </div>
            {request.mileage && <>
              <div className="detail-label">Mileage</div>
              <div className="detail-value" style={{ fontFamily:"monospace", fontSize:12 }}>{Number(request.mileage).toLocaleString()} mi</div>
            </>}
          </div>

          {/* Downloadable invoices */}
          {downloadableInvoices.length > 0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Invoices</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {downloadableInvoices.map(inv => (
                  <button key={inv.id} className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf(inv.id)}
                    disabled={downloading === inv.id}
                    style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {downloading === inv.id ? "Generating…" : `${request.request_number}-${inv.service_lines?.line_letter || "?"}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Customer description */}
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Your Description</div>
          <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 14px", fontSize:12, color:"var(--body)", lineHeight:1.6, whiteSpace:"pre-wrap", marginBottom:16 }}>
            {request.description || "—"}
          </div>

          {/* Client-visible notes */}
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Service Notes</div>
          <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, maxHeight:260, overflowY:"auto", padding:"6px 0" }}>
            {loadingNotes ? (
              <div style={{ padding:"12px 14px", fontSize:12, color:"var(--dim)", textAlign:"center" }}>Loading…</div>
            ) : notes.length === 0 ? (
              <div style={{ padding:"12px 14px", fontSize:12, color:"var(--dim)", textAlign:"center" }}>No service notes yet.</div>
            ) : (
              notes.map(note => (
                <div key={note.id} style={{ padding:"8px 12px", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                    <span style={{ fontSize:11, fontWeight:600, color:"var(--snow)" }}>{note.author_name}</span>
                    <span style={{ fontSize:10, color:"var(--muted)" }}>{fmtDate(note.created_at)}</span>
                  </div>
                  {note.body && <div style={{ fontSize:12, color:"var(--body)", lineHeight:1.55, whiteSpace:"pre-wrap" }}>{note.body}</div>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD ───────────────────────────────────────────────
function Dashboard({ session, company, switchToForm }) {
  const [requests, setRequests]         = useState([]);
  const [linesInvoiceMap, setLinesInvoiceMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");
  const [selectedSR, setSelectedSR]     = useState(null);

  const load = async () => {
    if (!company?.id) return;
    setLoading(true);
    const [{ data: srs }, { data: invs }] = await Promise.all([
      supabase.from("service_requests").select("*, vehicles!vehicle_registry_id(status)")
        .eq("company_id", company.id).is("archived_at", null)
        .order("created_at", { ascending: false }),
      supabase.from("invoices")
        .select("service_request_id, status, service_line_id, service_lines(line_letter)")
        .eq("company_id", company.id).is("archived_at", null),
    ]);
    setRequests(srs || []);

    // Build map: sr_id → [{line_letter, status}] sorted by letter
    const map = {};
    for (const inv of (invs || [])) {
      const srId = inv.service_request_id;
      if (!srId || !inv.service_lines?.line_letter) continue;
      if (!map[srId]) map[srId] = [];
      map[srId].push({ line_letter: inv.service_lines.line_letter, status: inv.status });
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => a.line_letter.localeCompare(b.line_letter));
    }
    setLinesInvoiceMap(map);
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

      <div className="stats-row stats-4" style={{ maxWidth:480 }}>
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
                <th>SR #</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>VIN</th>
                <th>Vehicle Status</th>
                <th>Mileage</th>
                <th>Billing Status</th>
                <th>Service Status</th>
                <th>Est. Completion</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setSelectedSR(r)} style={{ cursor:"pointer" }}>
                  <td style={{ color:"var(--muted)", fontSize:11, fontFamily:"monospace", whiteSpace:"nowrap" }}>
                    {r.request_number}
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
                  <td>{r.vehicles?.status ? <VehicleStatusBadge status={r.vehicles.status} /> : <span style={{ color:"var(--dim)", fontSize:11 }}>—</span>}</td>
                  <td style={{ fontSize:12, color:"var(--soft)", fontFamily:"monospace" }}>
                    {r.mileage ? Number(r.mileage).toLocaleString() + " mi" : "—"}
                  </td>
                  <td><ClientBillingBadge lines={linesInvoiceMap[r.id]} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize:11, color: r.estimated_completion ? "var(--soft)" : "var(--dim)", whiteSpace:"nowrap" }}>
                    {r.estimated_completion
                      ? new Date(r.estimated_completion + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSR && <ClientSRModal request={selectedSR} onClose={() => setSelectedSR(null)} />}
    </div>
  );
}

// ─── CLIENT INVOICE DETAIL MODAL (READ-ONLY) ─────────────────
function ClientInvoiceModal({ invoice, onClose, onPayNow, onDownloadPdf, downloading }) {
  const li = invoice.line_items || {};
  const lineItems = servicestolineItems(li);
  const settings = li.settings || { taxType: "pct", taxValue: "0", discountType: "none", discountValue: "0" };
  const totals = computeLineItemTotals(lineItems, settings);

  const lineLetter = invoice.service_lines?.line_letter;
  const reqNum = invoice.service_requests?.request_number;
  const refNum = reqNum
    ? `${reqNum}${lineLetter ? `-${lineLetter}` : ""}`
    : null;
  const dueDate = new Date(new Date(invoice.billed_at || invoice.created_at).getTime() + 30 * 86400000);
  const isPaid = invoice.status === "paid";

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 780 }}>
        <div className="modal-head">
          <div>
            <h3>Invoice {refNum || ""}</h3>
            <div className="modal-head-sub">
              {[invoice.vehicle_id, [invoice.vehicle_year, invoice.vehicle_make, invoice.vehicle_model].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}
              {isPaid && " · Paid"}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {/* Due date */}
          {!isPaid && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Due {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}
          {isPaid && invoice.updated_at && (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 14 }}>
              Paid {new Date(invoice.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </div>
          )}

          {/* Line items table */}
          <div style={{ overflowX: "auto", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--muted)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Service</th>
                  <th style={{ textAlign: "left", padding: "6px 8px", color: "var(--muted)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>Description</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--muted)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", width: 50 }}>Qty</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--muted)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", width: 70 }}>Rate</th>
                  <th style={{ textAlign: "right", padding: "6px 8px", color: "var(--muted)", fontWeight: 600, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", width: 80 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.filter(li => li.service || li.description || parseFloat(li.rate)).map((item, i) => {
                  const qty = parseFloat(item.qty) || 0;
                  const rate = parseFloat(item.rate) || 0;
                  return (
                    <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "8px", color: "var(--text)", fontWeight: 600 }}>{item.service || "—"}</td>
                      <td style={{ padding: "8px", color: "var(--body)" }}>{item.description || "—"}</td>
                      <td style={{ padding: "8px", color: "var(--body)", textAlign: "right" }}>{qty}</td>
                      <td style={{ padding: "8px", color: "var(--body)", textAlign: "right" }}>${rate.toFixed(2)}</td>
                      <td style={{ padding: "8px", color: "var(--text)", textAlign: "right", fontWeight: 600 }}>${(qty * rate).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div style={{ background: "var(--plate)", border: "1px solid var(--border)", borderRadius: 5, padding: "12px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--body)", marginBottom: 6 }}>
              <span>Subtotal</span>
              <span>${totals.itemsTotal.toFixed(2)}</span>
            </div>
            {totals.discountAmt > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--body)", marginBottom: 6 }}>
                <span>Discount</span>
                <span>-${totals.discountAmt.toFixed(2)}</span>
              </div>
            )}
            {totals.taxAmt > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--body)", marginBottom: 6 }}>
                <span>Tax{settings.taxType === "pct" ? ` (${settings.taxValue}%)` : ""}</span>
                <span>${totals.taxAmt.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--snow)" }}>Total</span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, fontWeight: 900, color: "var(--accent)" }}>${totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={onClose}>Close</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onDownloadPdf(invoice.id)}
              disabled={downloading === invoice.id}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}
            >
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {downloading === invoice.id ? "Generating…" : "Download PDF"}
            </button>
            {!isPaid && (
              <button className="btn btn-primary" onClick={() => onPayNow(invoice)} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Pay Now
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CLIENT PAYMENTS ──────────────────────────────────────────
function Payments({ session, company }) {
  const [invoices,   setInvoices]   = useState([]);
  const [savedCards, setSavedCards]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null); // invoice being paid
  const [payMethod,  setPayMethod]  = useState("new"); // "new" or card id
  const [cardRef,    setCardRef]    = useState(null);
  const [cardReady,  setCardReady]  = useState(false);
  const [sdkError,   setSdkError]   = useState("");
  const [processing, setProcessing] = useState(false);
  const [payError,   setPayError]   = useState("");
  const [paidId,     setPaidId]     = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardRef,  setAddCardRef]  = useState(null);
  const [addCardReady, setAddCardReady] = useState(false);
  const [addCardErr,  setAddCardErr]  = useState("");
  const [savingCard,  setSavingCard]  = useState(false);
  const [removingId,  setRemovingId]  = useState(null);
  const [paidInvoices, setPaidInvoices] = useState([]);
  const [downloading, setDownloading] = useState(null);
  const [viewInvoice, setViewInvoice] = useState(null);
  const cardUid = useRef(`sq-pay-${(session?.user?.id||"").slice(0,8)}`).current;
  const addCardUid = useRef(`sq-add-${(session?.user?.id||"").slice(0,8)}`).current;

  const load = async () => {
    setLoading(true);
    const [{ data: invs }, { data: cards }, { data: paid }] = await Promise.all([
      supabase.from("invoices").select("*, service_lines(line_letter, service_name), service_requests(request_number)")
        .eq("company_id", company.id).eq("status", "client_billed").eq("is_incognito", false).is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("customer_cards").select("*").eq("user_id", session.user.id).order("created_at"),
      supabase.from("invoices").select("*, service_lines(line_letter, service_name), service_requests(request_number)")
        .eq("company_id", company.id).eq("status", "paid").eq("is_incognito", false).is("archived_at", null).order("updated_at", { ascending: false }),
    ]);
    setInvoices(invs || []);
    setSavedCards(cards || []);
    setPaidInvoices(paid || []);
    setLoading(false);
  };

  const handleDownloadPdf = async (invoiceId) => {
    setDownloading(invoiceId);
    try {
      const { data: { session: sess } } = await supabase.auth.getSession();
      const jwt = sess?.access_token;
      if (!jwt) { setDownloading(null); return; }
      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`PDF error: ${err.error || res.status}`);
        setDownloading(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const disp = res.headers.get("Content-Disposition") || "";
      const match = disp.match(/filename="([^"]+)"/);
      a.href = url;
      a.download = match ? match[1] : `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {}
    setDownloading(null);
  };

  useEffect(() => { load(); }, [company?.id]);

  // Mount Square card form when paying with new card
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!selected || payMethod !== "new" || mountedRef.current) return;
    mountedRef.current = true;
    setCardReady(false); setSdkError(""); setCardRef(null);
    if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
      setSdkError("Payment system is not configured. Please contact support.");
      return;
    }
    loadSquareSDK()
      .then(async (Square) => {
        const payments = Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        // Small delay to ensure DOM element is mounted
        await new Promise(r => setTimeout(r, 100));
        await card.attach(`#${cardUid}`);
        setCardRef(card);
        setCardReady(true);
      })
      .catch(e => { console.error("Square pay form error:", e); setSdkError(e?.message || "Failed to load payment form. Check your connection."); });
    return () => { mountedRef.current = false; };
  }, [selected, payMethod]);

  // Mount Square card form for "Add Payment Method"
  const addMountedRef = useRef(false);
  useEffect(() => {
    if (!showAddCard || addMountedRef.current) return;
    addMountedRef.current = true;
    setAddCardReady(false); setAddCardErr(""); setAddCardRef(null);
    if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
      setAddCardErr("Payment system is not configured. Please contact support.");
      return;
    }
    loadSquareSDK()
      .then(async (Square) => {
        const payments = Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card = await payments.card();
        await new Promise(r => setTimeout(r, 100));
        await card.attach(`#${addCardUid}`);
        setAddCardRef(card);
        setAddCardReady(true);
      })
      .catch(e => { console.error("Square add card error:", e); setAddCardErr(e?.message || "Failed to load card form. Check your connection."); });
    return () => { addMountedRef.current = false; };
  }, [showAddCard]);

  const handleSaveCard = async () => {
    if (!addCardRef) return;
    setAddCardErr(""); setSavingCard(true);
    try {
      const result = await addCardRef.tokenize();
      if (result.status !== "OK") {
        setAddCardErr(result.errors?.[0]?.message || "Card error. Please check your details.");
        setSavingCard(false);
        return;
      }
      const { data: { session: sess } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/save-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sess.access_token}` },
        body: JSON.stringify({ source_id: result.token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setAddCardErr(body.error || "Failed to save card."); setSavingCard(false); return; }
      setSavedCards(prev => [...prev, body.card]);
      setShowAddCard(false); setSavingCard(false); addMountedRef.current = false;
      setAddCardRef(null); setAddCardReady(false);
    } catch {
      setAddCardErr("Failed to save card — check your connection.");
      setSavingCard(false);
    }
  };

  const handleRemoveCard = async (cardId) => {
    setRemovingId(cardId);
    try {
      const { data: { session: sess } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/remove-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sess.access_token}` },
        body: JSON.stringify({ card_id: cardId }),
      });
      if (res.ok) setSavedCards(prev => prev.filter(c => c.id !== cardId));
    } catch { /* silent */ }
    setRemovingId(null);
  };

  const handlePay = async () => {
    const usingSaved = payMethod !== "new";
    setPayError(""); setProcessing(true);
    try {
      let sourceId, customerId;
      if (usingSaved) {
        const card = savedCards.find(c => c.id === payMethod);
        if (!card) { setPayError("Selected card not found."); setProcessing(false); return; }
        sourceId = card.square_card_id;
        customerId = card.square_customer_id;
      } else {
        if (!cardRef) return;
        const result = await cardRef.tokenize();
        if (result.status !== "OK") {
          setPayError(result.errors?.[0]?.message || "Card error. Please check your details.");
          setProcessing(false);
          return;
        }
        sourceId = result.token;
      }
      const { data: { session: sess } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-square-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${sess.access_token}` },
        body: JSON.stringify({
          invoice_id: selected.id,
          source_id: sourceId,
          ...(customerId ? { customer_id: customerId } : {}),
          payment_method: usingSaved ? "card_on_file" : "card",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setPayError(body.error || "Payment failed."); setProcessing(false); return; }
      setPaidId(selected.id);
      setPaidInvoices(prev => [{ ...selected, status: "paid", updated_at: new Date().toISOString() }, ...prev]);
      setSelected(null);
      setProcessing(false);
      setInvoices(prev => prev.filter(i => i.id !== selected.id));
    } catch {
      setPayError("Payment failed — check your connection and try again.");
      setProcessing(false);
    }
  };

  const closeModal = () => {
    if (processing) return;
    setSelected(null); setPayMethod("new");
    mountedRef.current = false;
    setCardRef(null); setCardReady(false); setSdkError(""); setPayError("");
  };

  const closeAddCard = () => {
    if (savingCard) return;
    setShowAddCard(false); addMountedRef.current = false;
    setAddCardRef(null); setAddCardReady(false); setAddCardErr("");
  };

  const BRAND_LABELS = { VISA:"Visa", MASTERCARD:"MasterCard", AMERICAN_EXPRESS:"Amex", DISCOVER:"Discover", DISCOVER_DINERS:"Diners", JCB:"JCB", CHINA_UNIONPAY:"UnionPay" };
  const brandLabel = (b) => BRAND_LABELS[b] || b || "Card";

  const canPaySaved = payMethod !== "new";

  return (
    <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 20px" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.04em", color:"var(--snow)" }}>Invoices &amp; Payments</div>
        <div style={{ fontSize:12, color:"var(--muted)", marginTop:2 }}>Invoices requiring payment from your account</div>
      </div>

      {paidId && (
        <div className="success-box" style={{ marginBottom:16 }}>
          Payment received. Thank you!
        </div>
      )}

      {/* Saved Payment Methods */}
      <div style={{ background:"var(--raised)", border:"1px solid var(--border)", borderRadius:6, padding:"16px 20px", marginBottom:20 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: savedCards.length ? 12 : 0 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)" }}>Payment Methods</div>
          <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => setShowAddCard(true)}>+ Add Card</button>
        </div>
        {savedCards.length === 0 ? (
          <div style={{ fontSize:12, color:"var(--dim)", padding:"4px 0" }}>No saved payment methods. Add a card for faster checkout.</div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {savedCards.map(card => (
              <div key={card.id} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between", gap:12,
                background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"8px 14px",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--text)" }}>{brandLabel(card.card_brand)}</span>
                  <span style={{ fontSize:13, color:"var(--body)", fontFamily:"monospace" }}>•••• {card.last_four}</span>
                  {card.exp_month && card.exp_year && (
                    <span style={{ fontSize:11, color:"var(--dim)" }}>Exp {String(card.exp_month).padStart(2,"0")}/{String(card.exp_year).slice(-2)}</span>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize:10, color:"var(--dim)" }}
                  onClick={() => handleRemoveCard(card.id)}
                  disabled={removingId === card.id}
                >
                  {removingId === card.id ? "Removing…" : "Remove"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoice list */}
      {loading ? (
        <div className="loading-row">Loading invoices…</div>
      ) : invoices.length === 0 ? (
        <div className="empty-state">
          <h3>No outstanding invoices</h3>
          <p>You have no invoices requiring payment at this time.</p>
        </div>
      ) : (
        <div>
          {invoices.map(inv => {
            const total = Number(inv.total || 0);
            const dueDate = new Date(new Date(inv.created_at).getTime() + 30 * 24 * 60 * 60 * 1000);
            return (
              <div key={inv.id} style={{
                background:"var(--raised)", border:"1px solid var(--border)", borderRadius:6,
                padding:"16px 20px", marginBottom:10, display:"flex",
                alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap",
                cursor:"pointer",
              }} onClick={() => setViewInvoice(inv)}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4, flexWrap:"wrap" }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase", color:"var(--white)" }}>{inv.vehicle_id || "—"}</span>
                    {(inv.vehicle_make || inv.vehicle_model) && (
                      <span style={{ fontSize:12, color:"var(--muted)" }}>{[inv.vehicle_year, inv.vehicle_make, inv.vehicle_model].filter(Boolean).join(" ")}</span>
                    )}
                  </div>
                  <div style={{ fontSize:12, color:"var(--body)" }}>{inv.service_lines?.service_name || inv.service_type || "Service"}</div>
                  <div style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>Due {dueDate.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:24, fontWeight:900, color:"var(--accent)" }}>${total.toFixed(2)}</span>
                  <button
                    className="btn btn-primary"
                    onClick={e => { e.stopPropagation(); setPaidId(null); setPayMethod(savedCards.length ? savedCards[0].id : "new"); setSelected(inv); }}
                    style={{ display:"inline-flex", alignItems:"center", gap:6 }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    Pay Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment History */}
      {paidInvoices.length > 0 && (
        <div style={{ marginTop:28 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:10 }}>Payment History</div>
          <div>
            {paidInvoices.map(inv => {
              const total = Number(inv.total || 0);
              const lineLetter = inv.service_lines?.line_letter;
              const paidDate = inv.updated_at ? new Date(inv.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "—";
              return (
                <div key={inv.id} style={{
                  background:"var(--raised)", border:"1px solid var(--border)", borderRadius:6,
                  padding:"14px 20px", marginBottom:8, display:"flex",
                  alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap",
                  cursor:"pointer",
                }} onClick={() => setViewInvoice(inv)}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:3, flexWrap:"wrap" }}>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase", color:"var(--white)" }}>{inv.vehicle_id || "—"}</span>
                      {lineLetter && <span style={{ fontSize:12, color:"var(--muted)", fontFamily:"monospace" }}>Line {lineLetter}</span>}
                      <span className="badge" style={{ background:"rgba(34,197,94,0.15)", color:"#4ade80", fontSize:10, fontWeight:600, padding:"2px 8px", borderRadius:4 }}>Paid</span>
                    </div>
                    <div style={{ fontSize:12, color:"var(--body)" }}>{inv.service_lines?.service_name || inv.service_type || "Service"}</div>
                    <div style={{ fontSize:11, color:"var(--dim)", marginTop:2 }}>Paid {paidDate}</div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:"var(--soft)" }}>${total.toFixed(2)}</span>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={e => { e.stopPropagation(); handleDownloadPdf(inv.id); }}
                      disabled={downloading === inv.id}
                      style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:11 }}
                    >
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {downloading === inv.id ? "Generating…" : "PDF"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pay Invoice modal */}
      {selected && (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal" style={{ maxWidth:460 }}>
            <div className="modal-head">
              <div>
                <h3>Pay Invoice</h3>
                <div className="modal-head-sub">{company?.name} · {selected.vehicle_id || "—"} · ${Number(selected.total || 0).toFixed(2)}</div>
              </div>
              <button className="modal-close" onClick={closeModal} disabled={processing}>×</button>
            </div>
            <div className="modal-body">
              {/* Payment method selector */}
              {savedCards.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <label>Payment Method</label>
                  <select
                    className="inline-input"
                    style={{ width:"100%", padding:"8px 10px", fontSize:13 }}
                    value={payMethod}
                    onChange={e => { setPayMethod(e.target.value); mountedRef.current = false; setCardRef(null); setCardReady(false); }}
                  >
                    {savedCards.map(c => (
                      <option key={c.id} value={c.id}>{brandLabel(c.card_brand)} •••• {c.last_four}{c.exp_month && c.exp_year ? ` (${String(c.exp_month).padStart(2,"0")}/${String(c.exp_year).slice(-2)})` : ""}</option>
                    ))}
                    <option value="new">Enter new card</option>
                  </select>
                </div>
              )}

              {/* New card form — only when "new" selected or no saved cards */}
              {payMethod === "new" && (
                <div style={{ marginBottom:14 }}>
                  <label>Card Details</label>
                  {sdkError ? (
                    <div className="error-box">{sdkError}</div>
                  ) : (
                    <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 12px" }}>
                      <div id={cardUid} style={{ minHeight:89 }} />
                      {!cardReady && !sdkError && <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>Loading secure payment form…</div>}
                    </div>
                  )}
                  <div style={{ fontSize:10, color:"var(--muted)", marginTop:6 }}>
                    Card data is processed securely by Square and never touches our servers.
                  </div>
                </div>
              )}

              <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"var(--muted)" }}>Total Due</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:22, fontWeight:900, color:"var(--accent)" }}>${Number(selected.total || 0).toFixed(2)}</span>
                </div>
              </div>

              {payError && <div className="error-box">{payError}</div>}

              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button className="btn btn-ghost" onClick={closeModal} disabled={processing}>Cancel</button>
                <button
                  className="btn btn-primary"
                  onClick={handlePay}
                  disabled={processing || (payMethod === "new" && (!cardReady || !!sdkError))}
                >
                  {processing ? "Processing…" : `Pay $${Number(selected.total || 0).toFixed(2)}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Card modal */}
      {showAddCard && (
        <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && closeAddCard()}>
          <div className="modal" style={{ maxWidth:440 }}>
            <div className="modal-head">
              <div>
                <h3>Add Payment Method</h3>
                <div className="modal-head-sub">Save a card for faster checkout</div>
              </div>
              <button className="modal-close" onClick={closeAddCard} disabled={savingCard}>×</button>
            </div>
            <div className="modal-body">
              {addCardErr ? (
                <div className="error-box" style={{ marginBottom:14 }}>{addCardErr}</div>
              ) : null}
              <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 12px", marginBottom:14 }}>
                <div id={addCardUid} style={{ minHeight:89 }} />
                {!addCardReady && !addCardErr && <div style={{ fontSize:12, color:"var(--muted)", marginTop:6 }}>Loading secure card form…</div>}
              </div>
              <div style={{ fontSize:10, color:"var(--muted)", marginBottom:14 }}>
                Your card is stored securely with Square. We never see or store your full card number.
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button className="btn btn-ghost" onClick={closeAddCard} disabled={savingCard}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSaveCard} disabled={savingCard || !addCardReady}>
                  {savingCard ? "Saving…" : "Save Card"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail modal */}
      {viewInvoice && (
        <ClientInvoiceModal
          invoice={viewInvoice}
          onClose={() => setViewInvoice(null)}
          onPayNow={inv => { setViewInvoice(null); setPaidId(null); setPayMethod(savedCards.length ? savedCards[0].id : "new"); setSelected(inv); }}
          onDownloadPdf={handleDownloadPdf}
          downloading={downloading}
        />
      )}
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────
export default function App() {
  const navigate = useNavigate();
  const [session, setSession]           = useState(null);
  const [company, setCompany]           = useState(null);
  const [displayName, setDisplayName]   = useState(null);
  const [isBillingUser, setIsBillingUser] = useState(false);
  const [tab, setTab]                   = useState("dashboard");
  const [noCompany, setNoCompany]       = useState(false);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const handleLogin = async (sess) => {
    const uid = sess.user.id;
    const [{ data: adminRow }, { data: amRow }, { data: mechRow }] = await Promise.all([
      supabase.from("admins").select("id").eq("id", uid).maybeSingle(),
      supabase.from("account_managers").select("id").eq("id", uid).maybeSingle(),
      supabase.from("mechanics").select("id").eq("id", uid).maybeSingle(),
    ]);
    if (adminRow) { navigate("/admin"); return; }
    if (amRow)    { navigate("/account-manager"); return; }
    if (mechRow)  { navigate("/mechanic"); return; }

    // Client flow
    setSession(sess);
    setLoadingCompany(true);

    const { data: cuData } = await supabase
      .from("company_users").select("company_id, display_name, is_billing_user").eq("user_id", uid).limit(1);

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
    setIsBillingUser(!!cuData[0].is_billing_user);
    setLoadingCompany(false);
    setTab("dashboard");
  };

  // Auto-redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (sess) handleLogin(sess);
    });
  }, []);

  const handleLogout = async () => {
    supabase.rpc("log_auth_event", { p_action: "logout", p_status: "success", p_metadata: { portal: "client" } }).catch(() => {});
    await supabase.auth.signOut();
    window.location.href = "/";
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
                <button className={`topbar-tab ${tab === "vehicles" ? "active" : ""}`} onClick={() => setTab("vehicles")}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="22" height="18" rx="2"/><path d="M1 9h22"/><path d="M9 21V9"/></svg> My Vehicles
                </button>
                {isBillingUser && (
                  <button className={`topbar-tab ${tab === "payments" ? "active" : ""}`} onClick={() => setTab("payments")}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Payments
                  </button>
                )}
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
            {tab === "dashboard" && <Dashboard session={session} company={company} switchToForm={() => setTab("new")} />}
            {tab === "vehicles"  && <MyVehicles company={company} />}
            {tab === "payments"  && <Payments session={session} company={company} />}
            {tab === "new"       && <RequestForm session={session} company={company} displayName={displayName} onSuccess={() => setTab("dashboard")} />}
          </div>
        </div>
      ) : null}
    </>
  );
}
