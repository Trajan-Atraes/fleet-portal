import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./lib/supabase";
import NotesLog from "./components/NotesLog";
import ServiceLinesEditor from "./components/ServiceLinesEditor";
import { SvcPreviewCell } from "./components/StatusBadge";
import BarcodeScanner from "./components/BarcodeScanner";
import { IcoWrench, IcoRefresh, IcoChevron, IcoPlus, IcoMenu, IcoBarcode } from "./components/Icons";

// ─── PORTAL-SPECIFIC OVERRIDES (MECHANIC — TEAL BADGE) ──────
const css = `
  /* ── Mechanic portal tag (teal) ── */
  .auth-logo .portal-tag {
    background:rgba(13,148,136,0.15); color:#2dd4bf;
    border:1px solid rgba(13,148,136,0.35);
  }
  .sidebar-portal-tag {
    margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
    background:rgba(13,148,136,0.15); color:#2dd4bf; border:1px solid rgba(13,148,136,0.35);
    border-radius:3px; padding:2px 6px;
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
function UpdateModal({ request, mechanic, companiesMap, linesInvoiceData, onClose, onUpdate, onSilentRefresh }) {
  const [serviceLines,  setServiceLines]  = useState([]);
  const [loadingLines,  setLoadingLines]  = useState(true);
  const [vehicleStatus, setVehicleStatus] = useState(null);
  const [mileage, setMileage] = useState(request.mileage != null ? String(request.mileage) : "");
  const [savingMileage, setSavingMileage] = useState(false);
  const [mileageSaved, setMileageSaved] = useState(false);
  const [pendingNoteFiles, setPendingNoteFiles] = useState(0);
  const [showUnsentWarning, setShowUnsentWarning] = useState(false);
  const noteRef = useRef(null);

  const guardedClose = () => {
    if (pendingNoteFiles > 0) { setShowUnsentWarning(true); return; }
    onClose();
  };

  const handleSendAndClose = async () => {
    await noteRef.current?.submit();
    onClose();
  };

  const handleMileageSave = async () => {
    setSavingMileage(true);
    const { error } = await supabase.from("service_requests").update({
      mileage: mileage ? parseInt(mileage) : null,
      updated_by_id:    mechanic.id,
      updated_by_name:  mechanic.display_name || mechanic.name,
      updated_by_email: mechanic.email,
    }).eq("id", request.id);
    setSavingMileage(false);
    if (!error) { setMileageSaved(true); setTimeout(() => setMileageSaved(false), 1500); onUpdate(); }
  };

  useEffect(() => {
    if (request.vehicle_registry_id) {
      supabase.from("vehicles").select("status").eq("id", request.vehicle_registry_id).maybeSingle()
        .then(({ data }) => { if (data) setVehicleStatus(data.status); });
    }
    setLoadingLines(true);
    supabase.from("service_lines")
      .select("id, line_letter, service_name, notes, parts, is_completed, updated_by_name")
      .eq("sr_id", request.id)
      .order("line_letter")
      .then(({ data }) => { setServiceLines(data || []); setLoadingLines(false); });
  }, [request.id, request.vehicle_registry_id]);

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && guardedClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>{request.request_number} — Service Request</h3>
            <div className="modal-head-sub">
              {new Date(request.created_at).toLocaleDateString("en-US", { weekday:"short", month:"long", day:"numeric", year:"numeric" })}
            </div>
          </div>
          <button className="modal-close" onClick={guardedClose}>×</button>
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

          {/* Detail grid */}
          <div className="detail-grid">
            <span className="detail-label">DSP</span>
            <span className="detail-value">{companiesMap[request.company_id] || "—"}</span>
            <span className="detail-label">VIN</span>
            <span className="detail-value mono">{request.vin || "—"}</span>
            <span className="detail-label">Service Status</span>
            <span className="detail-value"><StatusBadge status={request.status} /></span>
            <span className="detail-label">Updated At</span>
            <span className="detail-value" style={{fontSize:12}}>
              {request.updated_at ? new Date(request.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(request.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
            </span>
            <span className="detail-label">Billing Status</span>
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

          {/* Mileage */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:14 }}>
            <div className="field" style={{ flex:"0 0 auto", marginBottom:0 }}>
              <label>Mileage</label>
              <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Enter current mileage" style={{ width:180 }} />
            </div>
            <button className="btn btn-primary" style={{ height:34, fontSize:12, padding:"0 14px" }} onClick={handleMileageSave} disabled={savingMileage || String(request.mileage ?? "") === mileage}>
              {savingMileage ? "Saving…" : mileageSaved ? "Saved ✓" : "Update"}
            </button>
          </div>

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
              editorName={mechanic.display_name || mechanic.name}
              srStatus={request.status}
              onSaved={() => onSilentRefresh ? onSilentRefresh() : onUpdate()}
              onSubmitted={() => { onUpdate(); guardedClose(); }}
            />
          )}

          {/* Vehicle Status Toggle — required step */}
          {request.vehicle_registry_id && (
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", background: vehicleStatus === "Not Road Worthy" ? "var(--amber-dim)" : vehicleStatus === "Road Worthy" ? "var(--green-dim)" : "var(--plate)", border:`1px solid ${vehicleStatus === "Not Road Worthy" ? "rgba(245,158,11,0.35)" : vehicleStatus === "Road Worthy" ? "rgba(16,185,129,0.22)" : "var(--border)"}`, borderRadius:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:"0.1em", textTransform:"uppercase", flexShrink:0 }}>Vehicle Status</span>
              <div style={{ display:"flex", gap:0 }}>
                {[["Road Worthy","var(--green)"],["Not Road Worthy","var(--amber)"]].map(([val,clr]) => (
                  <button key={val} onClick={async () => {
                    if (vehicleStatus === val) return;
                    await supabase.from("vehicles").update({ status: val }).eq("id", request.vehicle_registry_id);
                    await supabase.from("vehicle_status_logs").insert({
                      vehicle_id: request.vehicle_registry_id, old_status: vehicleStatus, new_status: val,
                      changed_by_id: mechanic.id, changed_by_name: mechanic.display_name || mechanic.name,
                    });
                    setVehicleStatus(val);
                  }} style={{
                    padding:"4px 12px", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.06em",
                    border:"1px solid var(--border)", cursor: vehicleStatus === val ? "default" : "pointer", marginRight:-1,
                    background: vehicleStatus === val ? clr : "var(--raised)", color: vehicleStatus === val ? "#000" : "var(--muted)",
                  }}>{val}</button>
                ))}
              </div>
              {!vehicleStatus && (
                <span style={{ fontSize:10, color:"var(--red)", fontWeight:600 }}>Required — select vehicle status</span>
              )}
            </div>
          )}

          <hr className="divider" />

          {/* Notes log */}
          <NotesLog ref={noteRef} srId={request.id} currentUserName={mechanic.display_name || mechanic.name} isAdmin={false} onPendingFilesChange={setPendingNoteFiles} />

          {showUnsentWarning && (
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"10px 14px", marginTop:10, fontSize:13, color:"var(--body)" }}>
              <strong style={{ color:"var(--accent)" }}>You have {pendingNoteFiles} unsent photo(s).</strong> Send them before closing?
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowUnsentWarning(false)}>Go Back</button>
                <button className="btn btn-primary btn-sm" onClick={handleSendAndClose}>Send and Close</button>
              </div>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:14 }}>
            <button className="btn btn-ghost" onClick={guardedClose}>Close</button>
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
    description:"",
  });
  const [saving, setSaving]             = useState(false);
  const [error, setError]               = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null); // null=unchecked, []|[...]=checked
  const [registryVehicle, setRegistryVehicle] = useState(null);
  const [companyVehicles, setCompanyVehicles] = useState([]);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
  }, []);

  // Fetch vehicles when company changes
  useEffect(() => {
    if (!form.company_id) { setCompanyVehicles([]); return; }
    supabase.from("vehicles").select("id, vehicle_id, vin, vehicle_make, vehicle_model, vehicle_year, license_plate, status")
      .eq("company_id", form.company_id).neq("status", "Retired").order("vehicle_id")
      .then(({ data }) => setCompanyVehicles(data || []));
  }, [form.company_id]);

  const f = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (["vin", "mileage"].includes(k)) setDuplicateWarning(null);
  };

  const handleCompanyChange = (val) => { f("company_id", val); setRegistryVehicle(null); setForm(p => ({ ...p, company_id: val, vehicle_id: "", vin: "", vehicle_make: "", vehicle_model: "", vehicle_year: "" })); setDuplicateWarning(null); };

  const handleVehicleSelect = (vehicleId) => {
    if (!vehicleId) { setRegistryVehicle(null); setForm(p => ({ ...p, vehicle_id: "", vin: "", vehicle_make: "", vehicle_model: "", vehicle_year: "" })); setDuplicateWarning(null); return; }
    const veh = companyVehicles.find(v => v.id === vehicleId);
    if (!veh) return;
    setRegistryVehicle(veh);
    setForm(p => ({
      ...p,
      vehicle_id: veh.vehicle_id,
      vin: veh.vin || "",
      vehicle_make: veh.vehicle_make || "",
      vehicle_model: veh.vehicle_model || "",
      vehicle_year: veh.vehicle_year || "",
    }));
    setDuplicateWarning(null);
  };

  const handleSave = async () => {
    if (!form.company_id || !registryVehicle) {
      setError("Company and Vehicle are required. Select a vehicle from the dropdown."); return;
    }
    setSaving(true); setError("");

    // Block mechanics from creating multiple active SRs for the same vehicle
    {
      const { data: activeSRs } = await supabase
        .from("service_requests")
        .select("id, request_number, status")
        .eq("company_id", form.company_id)
        .eq("vehicle_id", form.vehicle_id.trim())
        .in("status", ["pending", "in_progress"]);
      if (activeSRs && activeSRs.length > 0) {
        const srList = activeSRs.map(sr => `${sr.request_number}`).join(", ");
        setError(`This vehicle already has an active service request (${srList}). Please update the existing request instead of creating a new one.`);
        setSaving(false);
        return;
      }
    }

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

    const vehicleRegistryId = registryVehicle.id;

    const { error: err } = await supabase.from("service_requests").insert({
      client_id:           mechanic.id,
      company_id:          form.company_id,
      vehicle_id:          form.vehicle_id,
      vin:                 form.vin || null,
      vehicle_make:        form.vehicle_make,
      vehicle_model:       form.vehicle_model,
      vehicle_year:        form.vehicle_year,
      mileage:             form.mileage ? parseInt(form.mileage) : null,
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

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
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
                  {sr.request_number} — <span style={{ textTransform:"capitalize" }}>{sr.status.replace("_", " ")}</span>
                </div>
              ))}
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>
                Click <strong>Submit Anyway</strong> to create this request, or edit the VIN, service type, or mileage to dismiss.
              </div>
            </div>
          )}

          <div className="field">
            <label>DSP *</label>
            <select value={form.company_id} onChange={e => handleCompanyChange(e.target.value)}>
              <option value="">— Select Company —</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Vehicle selection — dropdown only (mechanics cannot create vehicles) */}
          <div className="field">
            <label>Vehicle *</label>
            <select value={registryVehicle?.id || ""} onChange={e => handleVehicleSelect(e.target.value)} disabled={!form.company_id}>
              <option value="">{!form.company_id ? "— Select a DSP first —" : companyVehicles.length === 0 ? "— No vehicles registered —" : "— Select Vehicle —"}</option>
              {companyVehicles.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vehicle_id}{v.vehicle_year || v.vehicle_make ? ` — ${[v.vehicle_year, v.vehicle_make, v.vehicle_model].filter(Boolean).join(" ")}` : ""}{v.status === "Not Road Worthy" ? " (NRW)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Registry match banner */}
          {registryVehicle && registryVehicle.status === "Not Road Worthy" && (
            <div style={{ background:"var(--amber-dim)", border:"1px solid rgba(245,158,11,0.35)", borderRadius:6, padding:"8px 12px", marginBottom:12, display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
              <span style={{ color:"var(--amber)", fontWeight:700 }}>⚠ Not Road Worthy</span>
              <span style={{ color:"var(--body)" }}>— vehicle is marked Not Road Worthy, proceed with caution</span>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div className="field">
              <label>VIN</label>
              <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)", fontFamily:"monospace" }}>{form.vin || "—"}</div>
            </div>
            <div className="field">
              <label>Year</label>
              <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{form.vehicle_year || "—"}</div>
            </div>
            <div className="field">
              <label>Make</label>
              <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{form.vehicle_make || "—"}</div>
            </div>
            <div className="field">
              <label>Model</label>
              <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:12, color:"var(--soft)" }}>{form.vehicle_model || "—"}</div>
            </div>
            {registryVehicle?.license_plate && (
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
            <label>Mechanic Diagnostic</label>
            <textarea value={form.description} onChange={e => f("description", e.target.value)} placeholder="Describe your diagnostic findings…" />
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

function truncateWords(str, max) {
  if (!str || str.length <= max) return { short: str || "", full: str || "", truncated: false };
  const cut = str.lastIndexOf(" ", max);
  const short = (cut > 0 ? str.slice(0, cut) : str.slice(0, max)) + "…";
  return { short, full: str, truncated: true };
}

// ─── MECHANIC SCAN RESULT (READ-ONLY) ────────────────────────
function MechanicScanResult({ barcode, onClose }) {
  const [status, setStatus]   = useState("loading");
  const [matches, setMatches] = useState([]);
  const [fuzzy, setFuzzy]     = useState([]);

  useEffect(() => {
    const lookup = async () => {
      const { data: exact } = await supabase.from("inventory_items")
        .select("id, name, sku, part_number, barcode, category, unit, quantity_on_hand, reorder_threshold, suppliers(name)")
        .eq("barcode", barcode);
      const found = exact || [];
      if (found.length >= 1) { setMatches(found); setStatus("found"); return; }
      // Fuzzy
      if (barcode.length >= 4) {
        const prefix = barcode.slice(0, -1);
        const { data: similar } = await supabase.from("inventory_items")
          .select("id, name, sku, part_number, barcode, category, unit, quantity_on_hand, reorder_threshold, suppliers(name)")
          .like("barcode", `${prefix}%`)
          .limit(5);
        if (similar && similar.length > 0) { setFuzzy(similar); setStatus("fuzzy"); return; }
      }
      setStatus("no_match");
    };
    lookup();
  }, [barcode]);

  const CATS = { parts: "Parts", fluids: "Fluids", shop_supplies: "Shop Supplies", tools_equipment: "Tools & Equipment" };

  const ItemRow = ({ item }) => {
    return (
      <div style={{ background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
        <div style={{ fontSize: 13, color: "var(--white)", fontWeight: 600 }}>{item.name}</div>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
          {item.sku ? `SKU: ${item.sku}` : "No SKU"}
          {item.part_number ? ` · Part #: ${item.part_number}` : ""}
          {item.suppliers?.name ? ` · ${item.suppliers.name}` : ""}
          {` · ${item.unit}`}
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(7,11,17,0.82)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "24px 28px", width: "100%", maxWidth: 440 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--white)" }}>Scan Result</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ fontSize: 12, color: "var(--body)", marginBottom: 16 }}>
          Barcode: <strong style={{ color: "var(--white)", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em" }}>{barcode}</strong>
        </div>

        {status === "loading" && <div style={{ fontSize: 12, color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>Looking up barcode…</div>}

        {status === "no_match" && (
          <div>
            <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 8 }}>No inventory item found for this barcode.</div>
            <div style={{ fontSize: 12, color: "var(--dim)" }}>Contact an admin to add this item to inventory.</div>
          </div>
        )}

        {status === "found" && (
          <div>
            {matches.every(m => !m.name) ? (
              <div style={{ background: "var(--accent-dim)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, padding: "12px 16px" }}>
                <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 4 }}>Incomplete Item</div>
                <div style={{ fontSize: 12, color: "var(--body)" }}>This barcode is in the inventory but the item appears to be incomplete. Contact an admin to finish adding this item.</div>
              </div>
            ) : (
              <>
                {matches.length > 1 && <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>Multiple SKUs share this barcode:</div>}
                {matches.map(m => m.name ? <ItemRow key={m.id} item={m} /> : (
                  <div key={m.id} style={{ background: "var(--accent-dim)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--accent)" }}>Incomplete item (no name) — contact an admin</div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{m.sku ? `SKU: ${m.sku}` : "No SKU"}{m.barcode ? ` · Barcode: ${m.barcode}` : ""}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {status === "fuzzy" && (
          <div>
            <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 8 }}>No exact match. Similar barcode(s) found:</div>
            {fuzzy.map(m => <ItemRow key={m.id} item={m} />)}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
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
  const [showScanner, setShowScanner]         = useState(false);
  const [scanResult, setScanResult]           = useState(null);
  const [linesInvoiceMap, setLinesInvoiceMap] = useState({}); // sr_id → [{line_letter, status}]
  const [srNamesMap, setSrNamesMap]           = useState({}); // sr_id → "Brake Job / Oil Change"
  const [srServicesMap, setSrServicesMap]     = useState({}); // sr_id → {short, full, truncated}

  // Silent refresh — updates data without showing loading state (used by auto-save)
  const silentRefresh = async () => {
    const [{ data }, { data: cos }, { data: invs }] = await Promise.all([
      supabase.from("service_requests").select("*").is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
      supabase.from("invoices").select("service_request_id, status, service_line_id, service_lines(line_letter, service_name)").eq("is_incognito", false).is("archived_at", null),
    ]);
    const map = {};
    (cos || []).forEach(c => { map[c.id] = c.name; });
    setCompaniesMap(map);
    setRequests(data || []);
    const imap = {};
    const nmap = {};
    const smap = {};
    (invs || []).forEach(i => {
      if (!i.service_request_id) return;
      if (!imap[i.service_request_id]) imap[i.service_request_id] = [];
      imap[i.service_request_id].push({ line_letter: i.service_lines?.line_letter || "?", status: i.status });
      const sl = i.service_lines;
      if (sl?.service_name) {
        if (!nmap[i.service_request_id]) nmap[i.service_request_id] = new Set();
        nmap[i.service_request_id].add(sl.service_name);
      }
      const text = (sl?.service_name || "").trim();
      if (text) {
        if (!smap[i.service_request_id]) smap[i.service_request_id] = [];
        smap[i.service_request_id].push(`${sl.line_letter || "?"}: ${text}`);
      }
    });
    const namesMap = {};
    for (const [k, v] of Object.entries(nmap)) namesMap[k] = [...v].join(" / ");
    const servMap = {};
    for (const [id, parts] of Object.entries(smap)) {
      const full = parts.join(" · ");
      servMap[id] = truncateWords(full, 55);
    }
    setLinesInvoiceMap(imap);
    setSrNamesMap(namesMap);
    setSrServicesMap(servMap);
  };

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: cos }, { data: invs }] = await Promise.all([
      supabase.from("service_requests").select("*").is("archived_at", null).order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
      supabase.from("invoices").select("service_request_id, status, service_line_id, service_lines(line_letter, service_name)").eq("is_incognito", false).is("archived_at", null),
    ]);
    const map = {};
    (cos || []).forEach(c => { map[c.id] = c.name; });
    setCompaniesMap(map);
    setRequests(data || []);
    const imap = {};
    const nmap = {};
    const smap = {};
    (invs || []).forEach(i => {
      if (!i.service_request_id) return;
      if (!imap[i.service_request_id]) imap[i.service_request_id] = [];
      imap[i.service_request_id].push({ line_letter: i.service_lines?.line_letter || "?", status: i.status });
      const sl = i.service_lines;
      if (sl?.service_name) {
        if (!nmap[i.service_request_id]) nmap[i.service_request_id] = new Set();
        nmap[i.service_request_id].add(sl.service_name);
      }
      const text = (sl?.service_name || "").trim();
      if (text) {
        if (!smap[i.service_request_id]) smap[i.service_request_id] = [];
        smap[i.service_request_id].push(`${sl.line_letter || "?"}: ${text}`);
      }
    });
    const namesMap = {};
    for (const [k, v] of Object.entries(nmap)) namesMap[k] = [...v].join(" / ");
    const servMap = {};
    for (const [id, parts] of Object.entries(smap)) {
      const full = parts.join(" · ");
      servMap[id] = truncateWords(full, 55);
    }
    setLinesInvoiceMap(imap);
    setSrNamesMap(namesMap);
    setSrServicesMap(servMap);
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
      (srNamesMap[r.id] || r.service_type || "").toLowerCase().includes(q) ||
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
          <button className="btn btn-ghost btn-sm" onClick={() => setShowScanner(true)} style={{ display:"inline-flex", alignItems:"center", gap:4 }}><IcoBarcode /> Scan Part</button>
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
                <th>SR #</th>
                <th>Company</th>
                <th>Vehicle</th>
                <th>Service</th>
                <th>Service Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} onClick={() => setSelected(r)}>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {new Date(r.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </td>
                  <td>
                    <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>
                      {r.request_number}
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
                  <td><SvcPreviewCell svc={srServicesMap[r.id]} /></td>
                  <td><StatusBadge status={r.status} /></td>
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
          onUpdate={() => load()}
          onSilentRefresh={() => silentRefresh()} />
      )}

      {showNewRequest && (
        <NewRequestModal
          mechanic={mechanic}
          onClose={() => setShowNewRequest(false)}
          onCreated={() => { setShowNewRequest(false); load(); }} />
      )}

      {showScanner && (
        <BarcodeScanner
          onScan={(code) => { setShowScanner(false); setScanResult(code); }}
          onClose={() => setShowScanner(false)}
        />
      )}
      {scanResult && (
        <MechanicScanResult
          barcode={scanResult}
          onClose={() => setScanResult(null)}
        />
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
    if (err || !data?.session) {
      setError(err?.message || "Invalid credentials.");
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "mechanic" } }).catch(() => {});
      return;
    }
    const { data: mechData, error: mechErr } = await supabase
      .from("mechanics").select("id, email, name, display_name").eq("id", data.session.user.id).single();
    if (mechErr || !mechData) {
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "mechanic", reason: "not_mechanic" } }).catch(() => {});
      await supabase.auth.signOut();
      setError("Access denied. This account does not have mechanic privileges.");
      return;
    }
    supabase.rpc("log_auth_event", { p_action: "login_success", p_status: "success", p_metadata: { portal: "mechanic" } }).catch(() => {});
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
  const navigate = useNavigate();
  const [session, setSession]         = useState(null);
  const [mechanic, setMechanic]       = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [loading, setLoading]         = useState(true);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [hasUpdates, setHasUpdates]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!sess) { navigate("/"); return; }
      const { data: mechRow } = await supabase.from("mechanics")
        .select("id, email, name, display_name").eq("id", sess.user.id).maybeSingle();
      if (!mechRow) { navigate("/"); return; }
      setSession(sess);
      setMechanic(mechRow);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    const mark = () => setHasUpdates(true);
    const channel = supabase.channel("mechanic-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, mark)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_lines" }, mark)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const applyUpdates = () => { setHasUpdates(false); setRefreshKey(k => k + 1); };

  const handleLogout = async () => {
    supabase.rpc("log_auth_event", { p_action: "logout", p_status: "success", p_metadata: { portal: "mechanic" } }).catch(() => {});
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) return <style>{css}</style>;

  return (
    <>
      <style>{css}</style>
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
              {hasUpdates && (
                <button className="btn btn-sm" onClick={applyUpdates} style={{ background:"var(--blue-dim)", color:"#60a5fa", border:"1px solid rgba(59,130,246,0.3)" }}>
                  New updates — click to refresh
                </button>
              )}
            </div>
            <div className="main-content">
              <RequestsView key={refreshKey} mechanic={mechanic} />
            </div>
          </main>
      </div>
    </>
  );
}
