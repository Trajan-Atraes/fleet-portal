import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";
import { STATUS_OPTIONS, STATUS_LABELS } from "../lib/constants";
import { LineInvoiceBadges } from "../components/StatusBadge";
import NotesLog from "../components/NotesLog";
import { PartsSummary } from "../components/ServiceLinesEditor";

// ─── ICONS (local copies needed in this file) ─────────────────
const IcoRefresh  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoPlus     = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoChevron  = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;

function StatusBadge({ status }) {
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

// ─── REQUEST MODAL ───────────────────────────────────────────
function RequestModal({ request, onClose, onUpdate, onDelete, adminDisplayName, linesInvoiceData, companiesMap }) {
  const [status, setStatus] = useState(request.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("service_requests").delete().eq("id", request.id);
    setDeleting(false);
    if (error) { alert("Delete failed: " + error.message); return; }
    onDelete();
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("service_requests").update({
      status,
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
            <span className="detail-label">DSP</span>
            <span className="detail-value">{companiesMap[request.company_id] || "—"}</span>
            <span className="detail-label">Invoice</span>
            <span className="detail-value"><LineInvoiceBadges linesInvoiceData={linesInvoiceData} /></span>
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

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Parts Used</div>
            <PartsSummary srId={request.id} />
          </div>

          <hr className="divider" />

          <div className="field">
            <label>Update Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <NotesLog srId={request.id} currentUserName={adminDisplayName || "Admin"} isAdmin={true} />

          {saved && <div className="success-box">Saved successfully</div>}

          {confirmDelete && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10, fontSize:13, color:"var(--body)" }}>
              <strong style={{ color:"#ef4444" }}>Delete this service request?</strong> This will also permanently delete all linked invoices. This cannot be undone.
            </div>
          )}

          <div style={{ display:"flex", gap:8, justifyContent:"space-between", alignItems:"center" }}>
            <div>
              {!confirmDelete
                ? <button className="btn btn-ghost" style={{ color:"#ef4444", borderColor:"rgba(239,68,68,0.35)" }} onClick={() => setConfirmDelete(true)}>Delete Record</button>
                : <div style={{ display:"flex", gap:6 }}>
                    <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
                    <button className="btn" style={{ background:"#ef4444", color:"#fff" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Confirm Delete"}</button>
                  </div>
              }
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
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
  const [registryVehicle, setRegistryVehicle] = useState(null);  // null=not looked up, false=not found, obj=found
  const [saveToRegistry, setSaveToRegistry] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => setCompanies(data || []));
  }, []);

  const f = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (["vin", "mileage"].includes(k)) setDuplicateWarning(null);
  };

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
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>New Service Request</h3>
            <div className="modal-head-sub">Create a request on behalf of a client</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}

          {duplicateWarning && duplicateWarning.length > 0 && (
            <div style={{ background:"var(--amber-dim)", border:"1px solid rgba(245,158,11,0.35)", borderRadius:6, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontWeight:700, color:"var(--amber)", fontSize:13, marginBottom:6 }}>⚠ Possible Duplicate Request</div>
              <div style={{ fontSize:12, color:"var(--body)", marginBottom:6 }}>
                An active service request with the same VIN and mileage already exists:
              </div>
              {duplicateWarning.map(sr => (
                <div key={sr.id} style={{ fontSize:12, color:"var(--soft)", marginBottom:2 }}>
                  SR-{sr.request_number} — <span style={{ textTransform:"capitalize" }}>{sr.status.replace("_", " ")}</span>
                </div>
              ))}
              <div style={{ fontSize:12, color:"var(--muted)", marginTop:8 }}>
                Click <strong>Submit Anyway</strong> to create this request, or edit the VIN or mileage to dismiss.
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
              <option value="">— Select DSP —</option>
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

// ─── SORT HELPERS ────────────────────────────────────────────
const SR_URGENCY_ORDER = { high:0, medium:1, low:2 };
const SR_STATUS_ORDER  = { pending:0, in_progress:1, completed:2, cancelled:3 };
const SR_INVOICE_ORDER = { draft:0, submitted:1, approved:2, rejected:3, client_billed:4, paid:5 };

const IcoSortAsc     = () => <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>;
const IcoSortDesc    = () => <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoSortNeutral = () => <svg width="8" height="10" viewBox="0 0 10 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{opacity:0.3}}><polyline points="2 5 5 2 8 5"/><polyline points="2 9 5 12 8 9"/></svg>;

function SortTh({ col, label, sortCol, sortDir, onSort }) {
  const active = sortCol === col;
  return (
    <th onClick={() => onSort(col)} style={{ cursor:"pointer", userSelect:"none", whiteSpace:"nowrap" }}>
      <span style={{ display:"inline-flex", alignItems:"center", gap:4 }}>
        {label}
        {active ? (sortDir === "asc" ? <IcoSortAsc /> : <IcoSortDesc />) : <IcoSortNeutral />}
      </span>
    </th>
  );
}

function worstInvoiceOrder(linesInvoiceMap, srId) {
  const lines = linesInvoiceMap[srId] || [];
  if (!lines.length) return 99;
  return Math.min(...lines.map(l => SR_INVOICE_ORDER[l.status] ?? 99));
}

function sortSRRows(rows, col, dir, companiesMap, linesInvoiceMap) {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let va, vb;
    if (col === "created_at" || col === "updated_at") {
      va = a[col] ? new Date(a[col]).getTime() : -Infinity;
      vb = b[col] ? new Date(b[col]).getTime() : -Infinity;
      return m * (va - vb);
    }
    if (col === "request_number")  return m * ((Number(a.request_number)||0) - (Number(b.request_number)||0));
    if (col === "company")         { va = (companiesMap[a.company_id]||"").toLowerCase(); vb = (companiesMap[b.company_id]||"").toLowerCase(); return m * va.localeCompare(vb); }
    if (col === "urgency")         { va = SR_URGENCY_ORDER[a.urgency]??99; vb = SR_URGENCY_ORDER[b.urgency]??99; return m*(va-vb); }
    if (col === "status")          { va = SR_STATUS_ORDER[a.status]??99; vb = SR_STATUS_ORDER[b.status]??99; return m*(va-vb); }
    if (col === "invoice_status")  { va = worstInvoiceOrder(linesInvoiceMap, a.id); vb = worstInvoiceOrder(linesInvoiceMap, b.id); return m*(va-vb); }
    va = (a[col]||"").toLowerCase(); vb = (b[col]||"").toLowerCase();
    return m * va.localeCompare(vb);
  });
}

// ─── ALL REQUESTS ─────────────────────────────────────────────
export default function AllRequests({ adminDisplayName }) {
  const [requests, setRequests]         = useState([]);
  const [companiesMap, setCompaniesMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]                   = useState("");
  const [showNewRequest, setShowNewRequest]   = useState(false);
  const [linesInvoiceMap, setLinesInvoiceMap] = useState({}); // sr_id → [{line_letter, status}]
  const [srNamesMap, setSrNamesMap]           = useState({}); // sr_id → "Brake Job / Oil Change"
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const load = async () => {
    setLoading(true);
    const [{ data }, { data: cos }, { data: invs }] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name"),
      supabase.from("invoices").select("service_request_id, status, service_line_id, service_lines(line_letter, service_name)"),
    ]);
    const map = {};
    (cos || []).forEach(c => { map[c.id] = c.name; });
    setCompaniesMap(map);
    setRequests(data || []);
    const imap = {};
    const nmap = {}; // sr_id → Set of service names
    (invs || []).forEach(i => {
      if (!i.service_request_id) return;
      if (!imap[i.service_request_id]) imap[i.service_request_id] = [];
      imap[i.service_request_id].push({ line_letter: i.service_lines?.line_letter || "?", status: i.status });
      const sn = i.service_lines?.service_name;
      if (sn) {
        if (!nmap[i.service_request_id]) nmap[i.service_request_id] = new Set();
        nmap[i.service_request_id].add(sn);
      }
    });
    // Convert Sets to display strings
    const namesMap = {};
    for (const [k, v] of Object.entries(nmap)) namesMap[k] = [...v].join(" / ");
    setLinesInvoiceMap(imap);
    setSrNamesMap(namesMap);
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
    const srNames = srNamesMap[r.id] || r.service_type || "";
    const matchService = !serviceFilter || srNames.split(" / ").includes(serviceFilter);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      `sr-${r.request_number}`.includes(q) ||
      String(r.request_number).includes(q) ||
      r.vehicle_id?.toLowerCase().includes(q) ||
      srNames.toLowerCase().includes(q) ||
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
                <SortTh col="created_at"     label="Date"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="updated_at"     label="Last Updated" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="request_number" label="SR #"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="company"        label="Company"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="vehicle_id"     label="Vehicle"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="vin"            label="VIN"          sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="service_type"   label="Service"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="urgency"        label="Urgency"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="status"         label="Status"       sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="invoice_status" label="Invoice"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="updated_by_name" label="Updated By"  sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortSRRows(filtered, sortCol, sortDir, companiesMap, linesInvoiceMap).map(r => (
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
                    {(() => {
                      const names = srNamesMap[r.id] || r.service_type || null;
                      if (!names) return <span style={{ color:"var(--muted)" }}>—</span>;
                      // Each name is independently clickable to set the filter
                      return names.split(" / ").map((n, i, arr) => (
                        <span key={n}>
                          <span className="clickable-val" onClick={e => { e.stopPropagation(); setServiceFilter(n); }}>{n}</span>
                          {i < arr.length - 1 && <span style={{ color:"var(--dim)", margin:"0 4px" }}>/</span>}
                        </span>
                      ));
                    })()}
                  </td>
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
          onUpdate={() => { load(); setSelected(null); }}
          onDelete={() => { load(); setSelected(null); }}
          adminDisplayName={adminDisplayName}
          linesInvoiceData={linesInvoiceMap[selected.id]} companiesMap={companiesMap} />
      )}

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onCreated={() => { setShowNewRequest(false); load(); }} />
      )}
    </div>
  );
}
