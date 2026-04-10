import { useState, useEffect, useRef } from "react";
import { supabase, SUPABASE_URL } from "../lib/supabase";
import { STATUS_OPTIONS, STATUS_LABELS, ssGet, ssSet } from "../lib/constants";
import { StatusBadge, LineInvoiceBadges, SvcPreviewCell } from "../components/StatusBadge";
import NotesLog from "../components/NotesLog";
import ServiceLinesEditor, { PartsSummary } from "../components/ServiceLinesEditor";
import { IcoRefresh, IcoPlus, IcoChevron, IcoSortAsc, IcoSortDesc, IcoSortNeutral } from "../components/Icons";

// ─── REQUEST MODAL ───────────────────────────────────────────
function RequestModal({ request, onClose, onUpdate, onDelete, adminDisplayName, linesInvoiceData, companiesMap, scrollToPartsLine }) {
  const [status, setStatus] = useState(request.status);
  const [estimatedCompletion, setEstimatedCompletion] = useState(request.estimated_completion || "");
  const [mileage, setMileage] = useState(request.mileage != null ? String(request.mileage) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const mouseDownOnOverlay = useRef(false);
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

  const [serviceLines,  setServiceLines]  = useState([]);
  const [loadingLines,  setLoadingLines]  = useState(true);
  const [vehicleStatus, setVehicleStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingLines(true);
    supabase.from("service_lines")
      .select("id, line_letter, service_name, notes, parts, is_completed, parts_ordered, updated_by_name")
      .eq("sr_id", request.id)
      .order("line_letter")
      .then(({ data }) => { if (!cancelled) { setServiceLines(data || []); setLoadingLines(false); } });
    if (request.vehicle_registry_id) {
      supabase.from("vehicles").select("status").eq("id", request.vehicle_registry_id).maybeSingle()
        .then(({ data }) => { if (!cancelled && data) setVehicleStatus(data.status); });
    }
    return () => { cancelled = true; };
  }, [request.id, request.vehicle_registry_id]);

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from("service_requests").delete().eq("id", request.id);
    setDeleting(false);
    if (error) { setError("Delete failed: " + error.message); return; }
    onDelete();
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("service_requests").update({
      status,
      mileage: mileage ? parseInt(mileage) : null,
      estimated_completion: estimatedCompletion || null,
      updated_by_id:    null,
      updated_by_name:  adminDisplayName || "Admin",
      updated_by_email: session?.user?.email || "",
    }).eq("id", request.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => { setSaved(false); onUpdate(); }, 1200); }
  };

  return (
    <div className="modal-overlay"
      onMouseDown={e => { mouseDownOnOverlay.current = e.target === e.currentTarget; }}
      onClick={e => { if (e.target === e.currentTarget && mouseDownOnOverlay.current) guardedClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>{request.request_number} — Request Detail</h3>
            <div className="modal-head-sub">
              {new Date(request.created_at).toLocaleDateString("en-US", { weekday:"short", month:"long", day:"numeric", year:"numeric" })}
            </div>
          </div>
          <button className="modal-close" onClick={guardedClose}>×</button>
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
            <span className="detail-label">VIN</span>
            <span className="detail-value mono">{request.vin || "—"}</span>
            <span className="detail-label">Updated At</span>
            <span className="detail-value" style={{fontSize:12}}>
              {request.updated_at ? new Date(request.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(request.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
            </span>
            <span className="detail-label">DSP</span>
            <span className="detail-value">{companiesMap[request.company_id] || "—"}</span>
            <span className="detail-label">Billing Status</span>
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
            <>
              <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--accent)", marginBottom:6 }}>
                Customer Reported Issue
              </div>
              <div style={{ background:"var(--plate)", borderRadius:5, padding:"10px 12px", fontSize:13, color:"var(--body)", lineHeight:1.6, border:"1px solid rgba(245,158,11,0.2)", marginBottom:14 }}>{request.description}</div>
            </>
          )}

          {/* Mileage */}
          <div className="field" style={{ marginBottom:14 }}>
            <label>Mileage</label>
            <input type="number" value={mileage} onChange={e => setMileage(e.target.value)} placeholder="Enter current mileage" style={{ maxWidth:220 }} />
          </div>

          <hr className="divider" />

          <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>
            Service Lines
          </div>

          {loadingLines ? (
            <div style={{ fontSize:12, color:"var(--muted)", padding:"12px 0" }}>Loading lines…</div>
          ) : (
            <ServiceLinesEditor
              srId={request.id}
              initialLines={serviceLines}
              isAdmin={true}
              editorName={adminDisplayName || "Admin"}
              srStatus={request.status}
              onSaved={() => { /* silent refresh — don't close modal */ }}
              scrollToPartsLine={scrollToPartsLine}
            />
          )}

          {/* Vehicle Status Toggle */}
          {request.vehicle_registry_id && (
            <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:10, marginBottom:14, padding:"10px 14px", background: vehicleStatus === "Not Road Worthy" ? "var(--amber-dim)" : vehicleStatus === "Road Worthy" ? "var(--green-dim)" : "var(--plate)", border:`1px solid ${vehicleStatus === "Not Road Worthy" ? "rgba(245,158,11,0.35)" : vehicleStatus === "Road Worthy" ? "rgba(16,185,129,0.22)" : "var(--border)"}`, borderRadius:6 }}>
              <span style={{ fontSize:11, fontWeight:700, color:"var(--muted)", letterSpacing:"0.1em", textTransform:"uppercase", flexShrink:0 }}>Vehicle Status</span>
              <div style={{ display:"flex", gap:0 }}>
                {[["Road Worthy","var(--green)"],["Not Road Worthy","var(--amber)"]].map(([val,clr]) => (
                  <button key={val} onClick={async () => {
                    if (vehicleStatus === val) return;
                    const { data: { session } } = await supabase.auth.getSession();
                    await supabase.from("vehicles").update({ status: val }).eq("id", request.vehicle_registry_id);
                    await supabase.from("vehicle_status_logs").insert({
                      vehicle_id: request.vehicle_registry_id, old_status: vehicleStatus, new_status: val,
                      changed_by_id: session?.user?.id, changed_by_name: adminDisplayName || "Admin",
                    });
                    setVehicleStatus(val);
                  }} style={{
                    padding:"4px 12px", fontSize:11, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.06em",
                    border:"1px solid var(--border)", cursor: vehicleStatus === val ? "default" : "pointer", marginRight:-1,
                    background: vehicleStatus === val ? clr : "var(--raised)", color: vehicleStatus === val ? "#000" : "var(--muted)",
                  }}>{val}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div className="field">
              <label>Update Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Estimated Completion</label>
              <input type="date" value={estimatedCompletion} onChange={e => setEstimatedCompletion(e.target.value)}
                style={{ colorScheme:"dark" }} />
            </div>
          </div>
          <NotesLog ref={noteRef} srId={request.id} currentUserName={adminDisplayName || "Admin"} isAdmin={true} canSetClientVisible={true} onPendingFilesChange={setPendingNoteFiles} />

          {showUnsentWarning && (
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"10px 14px", marginTop:10, fontSize:13, color:"var(--body)" }}>
              <strong style={{ color:"var(--accent)" }}>You have {pendingNoteFiles} unsent photo(s).</strong> Send them before closing?
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowUnsentWarning(false)}>Go Back</button>
                <button className="btn btn-primary btn-sm" onClick={handleSendAndClose}>Send and Close</button>
              </div>
            </div>
          )}

          {saved && <div className="success-box">Saved successfully</div>}
          {error && <div className="error-box">{error}</div>}

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
              <button className="btn btn-ghost" onClick={guardedClose}>Cancel</button>
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
    description:"",
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
    if (!form.company_id || !form.vehicle_id) {
      setError("Company and Vehicle ID are required."); return;
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
      // VIN duplicate check
      if (form.vin?.trim()) {
        const { data: vinMatch } = await supabase.from("vehicles").select("id, vehicle_id, companies(name)")
          .eq("vin", form.vin.trim()).limit(1).maybeSingle();
        if (vinMatch) {
          const owner = vinMatch.companies?.name || "another company";
          setError(`A vehicle with this VIN already exists in the registry: ${vinMatch.vehicle_id} (${owner}).`);
          setSaving(false);
          return;
        }
      }
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
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
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
                  {sr.request_number} — <span style={{ textTransform:"capitalize" }}>{sr.status.replace("_", " ")}</span>
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
const SR_STATUS_ORDER  = { pending:0, in_progress:1, completed:2, cancelled:3 };
const SR_INVOICE_ORDER = { draft:0, submitted:1, approved:2, rejected:3, client_billed:4, paid:5 };

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

const PO_SORT_ORDER = { none: 0, some: 1, all: 2 };

function sortSRRows(rows, col, dir, companiesMap, linesInvoiceMap, partsOrderedMap) {
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
    if (col === "status")          { va = SR_STATUS_ORDER[a.status]??99; vb = SR_STATUS_ORDER[b.status]??99; return m*(va-vb); }
    if (col === "invoice_status")  { va = worstInvoiceOrder(linesInvoiceMap, a.id); vb = worstInvoiceOrder(linesInvoiceMap, b.id); return m*(va-vb); }
    if (col === "parts_ordered")   { va = PO_SORT_ORDER[partsOrderedMap[a.id] || "none"]; vb = PO_SORT_ORDER[partsOrderedMap[b.id] || "none"]; return m*(va-vb); }
    va = (a[col]||"").toLowerCase(); vb = (b[col]||"").toLowerCase();
    return m * va.localeCompare(vb, undefined, { numeric: true });
  });
}

function truncateWords(str, max) {
  if (!str || str.length <= max) return { short: str || "", full: str || "", truncated: false };
  const cut = str.lastIndexOf(" ", max);
  const short = (cut > 0 ? str.slice(0, cut) : str.slice(0, max)) + "…";
  return { short, full: str, truncated: true };
}

// ─── PAGINATION ──────────────────────────────────────────────
const PAGE_SIZE = 25;

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"12px 0 4px" }}>
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize:11, padding:"0 8px", minWidth:28 }}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ←
      </button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} style={{ fontSize:11, color:"var(--dim)", padding:"0 4px" }}>…</span>
        ) : (
          <button
            key={p}
            className="btn btn-ghost btn-sm"
            style={{
              fontSize:11, padding:"0 8px", minWidth:28,
              ...(p === page ? { background:"var(--accent)", color:"#000", borderColor:"var(--accent)" } : {}),
            }}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        className="btn btn-ghost btn-sm"
        style={{ fontSize:11, padding:"0 8px", minWidth:28 }}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        →
      </button>
    </div>
  );
}

// ─── SR TABLE (reusable for both sections) ───────────────────
function SRTable({ rows, companiesMap, linesInvoiceMap, srServicesMap, partsOrderedMap, sortCol, sortDir, onSort, onSelect, onPartsClick, hasUnreadNotes, archiveSelected, onToggleArchive, onToggleArchiveAll, allSelected, onUnarchive }) {
  const sorted = sortSRRows(rows, sortCol, sortDir, companiesMap, linesInvoiceMap, partsOrderedMap);
  const showArchiveCheckbox = !!onToggleArchive;
  const showUnarchive = !!onUnarchive;
  if (sorted.length === 0) return (
    <div className="empty-state" style={{ padding:"32px 24px" }}>
      <h3>No requests found</h3>
      <p>Try adjusting your filter or search.</p>
    </div>
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {showArchiveCheckbox && (
              <th style={{ width:32, textAlign:"center" }}>
                <input type="checkbox" checked={allSelected} onChange={onToggleArchiveAll} />
              </th>
            )}
            <SortTh col="created_at"     label="Date"           sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="updated_at"     label="Last Updated"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="request_number" label="SR #"           sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="company"        label="Company"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="vehicle_id"     label="Vehicle"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="service_type"   label="Service"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="parts_ordered"  label="Parts Ordered"  sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="status"         label="Service Status" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="invoice_status" label="Billing Status" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="updated_by_name" label="Updated By"    sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.id} onClick={() => onSelect(r)} style={r.archived_at ? { opacity: 0.7 } : undefined}>
              {showArchiveCheckbox && (
                <td style={{ textAlign:"center" }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" checked={archiveSelected?.has(r.id)} onChange={() => onToggleArchive(r.id)} />
                </td>
              )}
              <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                {new Date(r.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
              </td>
              <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                {r.updated_at ? new Date(r.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(r.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
              </td>
              <td>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>
                  {r.request_number}
                </span>
                {hasUnreadNotes && hasUnreadNotes(r) && (
                  <span title="New notes" style={{ display:"inline-block", width:6, height:6, borderRadius:"50%", background:"#3b82f6", marginLeft:6, verticalAlign:"middle", animation:"pulse 1.5s infinite" }} />
                )}
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
              <td style={{ textAlign:"center", cursor:"pointer" }} onClick={e => { e.stopPropagation(); onPartsClick(r); }}>
                {partsOrderedMap[r.id] === "all"
                  ? <span style={{ color:"var(--green)", fontSize:15, fontWeight:700 }}>✓</span>
                  : partsOrderedMap[r.id] === "some"
                    ? <span style={{ color:"var(--accent)", fontSize:15, fontWeight:700 }}>—</span>
                    : <span style={{ color:"var(--dim)", fontSize:13 }}>·</span>
                }
              </td>
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
                {showUnarchive ? (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:11, color:"var(--muted)" }} onClick={e => { e.stopPropagation(); onUnarchive(r.id); }}>
                    Restore
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onSelect(r); }}>
                    View <IcoChevron />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── ALL REQUESTS ─────────────────────────────────────────────
export default function AllRequests({ adminDisplayName }) {
  const [requests, setRequests]         = useState([]);
  const [companiesMap, setCompaniesMap] = useState({});
  const [loading, setLoading]           = useState(true);
  const [companies, setCompanies]       = useState([]);
  const [selected, setSelected]         = useState(null);
  const [scrollToPartsLine, setScrollToPartsLine] = useState(false);
  const [showNewRequest, setShowNewRequest]   = useState(false);
  const [linesInvoiceMap, setLinesInvoiceMap] = useState({});
  const [srNamesMap, setSrNamesMap]           = useState({});
  const [srServicesMap, setSrServicesMap]     = useState({});
  const [partsOrderedMap, setPartsOrderedMap] = useState({});

  // Active section state
  const [filter, setFilter]               = useState(() => ssGet("sr_filter", "all"));
  const [serviceFilter, setServiceFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState(() => ssGet("sr_company", ""));
  const [search, setSearch]               = useState(() => ssGet("sr_search", ""));
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortCol, setSortCol]             = useState("created_at");
  const [sortDir, setSortDir]             = useState("desc");
  const [activePage, setActivePage]       = useState(1);

  // Completed section state
  const [cSearch, setCSearch]             = useState("");
  const [debouncedCSearch, setDebouncedCSearch] = useState("");
  const [cCompanyFilter, setCCompanyFilter] = useState("");
  const [cSortCol, setCSortCol]           = useState("updated_at");
  const [cSortDir, setCSortDir]           = useState("desc");
  const [completedPage, setCompletedPage] = useState(1);

  // Archive section state
  const [archiveOpen, setArchiveOpen]     = useState(false);
  const [aSearch, setASearch]             = useState("");
  const [debouncedASearch, setDebouncedASearch] = useState("");
  const [aCompanyFilter, setACompanyFilter] = useState("");
  const [aSortCol, setASortCol]           = useState("archived_at");
  const [aSortDir, setASortDir]           = useState("desc");
  const [archivedPage, setArchivedPage]   = useState(1);
  const [archiveSelected, setArchiveSelected] = useState(new Set());
  const [archiving, setArchiving]         = useState(false);

  // Persist filters to sessionStorage
  useEffect(() => { ssSet("sr_filter", filter); }, [filter]);
  useEffect(() => { ssSet("sr_company", companyFilter); }, [companyFilter]);
  useEffect(() => { ssSet("sr_search", search); }, [search]);

  // Debounce search inputs (300ms)
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const t = setTimeout(() => setDebouncedCSearch(cSearch), 300); return () => clearTimeout(t); }, [cSearch]);
  useEffect(() => { const t = setTimeout(() => setDebouncedASearch(aSearch), 300); return () => clearTimeout(t); }, [aSearch]);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
    setActivePage(1);
  };
  const handleCSort = (col) => {
    if (cSortCol === col) setCSortDir(d => d === "asc" ? "desc" : "asc");
    else { setCSortCol(col); setCSortDir("asc"); }
    setCompletedPage(1);
  };
  const handleASort = (col) => {
    if (aSortCol === col) setASortDir(d => d === "asc" ? "desc" : "asc");
    else { setASortCol(col); setASortDir("asc"); }
    setArchivedPage(1);
  };

  // Unread notes tracking (localStorage per-SR last-seen timestamp)
  const getSeenNotes = () => { try { return JSON.parse(localStorage.getItem("sr_notes_seen") || "{}"); } catch { return {}; } };
  const [notesSeen, setNotesSeen] = useState(getSeenNotes);
  const markNotesSeen = (srId) => {
    const next = { ...notesSeen, [srId]: new Date().toISOString() };
    setNotesSeen(next);
    localStorage.setItem("sr_notes_seen", JSON.stringify(next));
  };
  const hasUnreadNotes = (sr) => {
    if (!sr.last_note_at) return false;
    const seen = notesSeen[sr.id];
    return !seen || new Date(sr.last_note_at) > new Date(seen);
  };

  const load = async (silent) => {
    if (!silent) setLoading(true);
    const [{ data }, { data: cos }, { data: invs }, { data: slLines }] = await Promise.all([
      supabase.from("service_requests").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("companies").select("id, name"),
      supabase.from("invoices").select("service_request_id, status, service_line_id, service_lines(line_letter, service_name)").eq("is_incognito", false).limit(1000),
      supabase.from("service_lines").select("sr_id, parts_ordered").limit(2000),
    ]);
    const map = {};
    (cos || []).forEach(c => { map[c.id] = c.name; });
    setCompaniesMap(map);
    setCompanies(cos || []);
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
    const poMap = {};
    const poGroups = {};
    (slLines || []).forEach(sl => {
      if (!poGroups[sl.sr_id]) poGroups[sl.sr_id] = [];
      poGroups[sl.sr_id].push(!!sl.parts_ordered);
    });
    for (const [srId, flags] of Object.entries(poGroups)) {
      const ordered = flags.filter(Boolean).length;
      poMap[srId] = ordered === 0 ? "none" : ordered === flags.length ? "all" : "some";
    }
    setPartsOrderedMap(poMap);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ─── Search helper ───
  const matchesSearch = (r, q) => {
    if (!q) return true;
    const srNames = srNamesMap[r.id] || r.service_type || "";
    return (
      `sr-${r.request_number}`.includes(q) ||
      String(r.request_number).includes(q) ||
      r.vehicle_id?.toLowerCase().includes(q) ||
      srNames.toLowerCase().includes(q) ||
      r.vehicle_make?.toLowerCase().includes(q) ||
      r.vehicle_model?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q) ||
      companiesMap[r.company_id]?.toLowerCase().includes(q)
    );
  };

  // ─── Active (non-completed, non-archived) ───
  const activeRequests = requests.filter(r => r.status !== "completed" && !r.archived_at);
  const activeCounts = {
    all:         activeRequests.length,
    pending:     activeRequests.filter(r => r.status === "pending").length,
    in_progress: activeRequests.filter(r => r.status === "in_progress").length,
    cancelled:   activeRequests.filter(r => r.status === "cancelled").length,
  };
  const activeFiltered = activeRequests.filter(r => {
    const matchStatus = filter === "all" || r.status === filter;
    const matchCompany = !companyFilter || r.company_id === companyFilter;
    const srNames = srNamesMap[r.id] || r.service_type || "";
    const matchService = !serviceFilter || srNames.split(" / ").includes(serviceFilter);
    return matchStatus && matchCompany && matchService && matchesSearch(r, debouncedSearch.toLowerCase());
  });
  const activeTotalPages = Math.max(1, Math.ceil(activeFiltered.length / PAGE_SIZE));
  const activePageClamped = Math.min(activePage, activeTotalPages);
  const activePageRows = activeFiltered.slice((activePageClamped - 1) * PAGE_SIZE, activePageClamped * PAGE_SIZE);

  // ─── Completed (non-archived) ───
  const completedRequests = requests.filter(r => r.status === "completed" && !r.archived_at);
  const completedFiltered = completedRequests.filter(r => {
    const matchCompany = !cCompanyFilter || r.company_id === cCompanyFilter;
    return matchCompany && matchesSearch(r, debouncedCSearch.toLowerCase());
  });
  const completedTotalPages = Math.max(1, Math.ceil(completedFiltered.length / PAGE_SIZE));
  const completedPageClamped = Math.min(completedPage, completedTotalPages);
  const completedPageRows = completedFiltered.slice((completedPageClamped - 1) * PAGE_SIZE, completedPageClamped * PAGE_SIZE);

  // ─── Archived ───
  const archivedRequests = requests.filter(r => !!r.archived_at);
  const archivedFiltered = archivedRequests.filter(r => {
    const matchCompany = !aCompanyFilter || r.company_id === aCompanyFilter;
    return matchCompany && matchesSearch(r, debouncedASearch.toLowerCase());
  });
  const archivedTotalPages = Math.max(1, Math.ceil(archivedFiltered.length / PAGE_SIZE));
  const archivedPageClamped = Math.min(archivedPage, archivedTotalPages);
  const archivedPageRows = archivedFiltered.slice((archivedPageClamped - 1) * PAGE_SIZE, archivedPageClamped * PAGE_SIZE);

  const totalCounts = {
    all:         requests.filter(r => !r.archived_at).length,
    pending:     activeCounts.pending,
    in_progress: activeCounts.in_progress,
    completed:   completedRequests.length,
    cancelled:   activeCounts.cancelled,
  };

  // Archive / unarchive handlers
  const handleArchiveSelected = async () => {
    if (archiveSelected.size === 0) return;
    setArchiving(true);
    const now = new Date().toISOString();
    const ids = [...archiveSelected];
    await supabase.from("service_requests").update({ archived_at: now }).in("id", ids);
    // Also archive linked paid invoices
    const { data: linkedInvs } = await supabase.from("invoices")
      .select("id").in("service_request_id", ids).eq("status", "paid").is("archived_at", null);
    if (linkedInvs?.length) {
      await supabase.from("invoices").update({ archived_at: now }).in("id", linkedInvs.map(i => i.id));
    }
    setArchiveSelected(new Set());
    setArchiving(false);
    load();
  };

  const handleUnarchive = async (id) => {
    await supabase.from("service_requests").update({ archived_at: null }).eq("id", id);
    // Also unarchive linked invoices
    await supabase.from("invoices").update({ archived_at: null }).eq("service_request_id", id);
    load();
  };

  const toggleArchiveSelect = (id) => {
    setArchiveSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleArchiveSelectAll = () => {
    if (archiveSelected.size === completedFiltered.length) setArchiveSelected(new Set());
    else setArchiveSelected(new Set(completedFiltered.map(r => r.id)));
  };

  // Reset page when filters change
  useEffect(() => { setActivePage(1); }, [filter, companyFilter, serviceFilter, search]);
  useEffect(() => { setCompletedPage(1); }, [cSearch, cCompanyFilter]);
  useEffect(() => { setArchivedPage(1); }, [aSearch, aCompanyFilter]);

  const handleSelect = (r) => { markNotesSeen(r.id); setSelected(r); };
  const handlePartsClick = (r) => { setScrollToPartsLine(true); setSelected(r); };

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
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{totalCounts.all}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value c-purple">{totalCounts.pending}</div></div>
        <div className="stat-card"><div className="stat-label">In Progress</div><div className="stat-value c-blue">{totalCounts.in_progress}</div></div>
        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value c-green">{totalCounts.completed}</div></div>
        <div className="stat-card"><div className="stat-label">Cancelled</div><div className="stat-value c-red">{totalCounts.cancelled}</div></div>
      </div>

      {/* ═══ ACTIVE REQUESTS ═══ */}
      <div className="toolbar">
        <div className="filters">
          {["all","pending","in_progress","cancelled"].map(s => (
            <button key={s} className={`filter-btn ${filter === s ? "active" : ""}`} onClick={() => setFilter(s)}>
              {s === "all" ? `All (${activeCounts.all})` : `${STATUS_LABELS[s]} (${activeCounts[s]})`}
            </button>
          ))}
          {serviceFilter && (
            <span className="filter-chip">
              {serviceFilter}
              <span className="filter-chip-x" onClick={() => setServiceFilter("")}>×</span>
            </span>
          )}
          {companyFilter && (
            <span className="filter-chip">
              {companiesMap[companyFilter] || companyFilter}
              <span className="filter-chip-x" onClick={() => setCompanyFilter("")}>×</span>
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: companyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="search-input" placeholder="Search vehicles, services…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? <div className="loading-row">Loading requests…</div> : (
        <>
          <SRTable
            rows={activePageRows}
            companiesMap={companiesMap}
            linesInvoiceMap={linesInvoiceMap}
            srServicesMap={srServicesMap}
            partsOrderedMap={partsOrderedMap}
            sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
            onSelect={handleSelect} onPartsClick={handlePartsClick}
            hasUnreadNotes={hasUnreadNotes}
          />
          <Pagination page={activePageClamped} totalPages={activeTotalPages} onPageChange={setActivePage} />
        </>
      )}

      {/* ═══ COMPLETED REQUESTS ═══ */}
      {!loading && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.04em", color:"var(--snow)" }}>
                Completed Requests
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{completedFiltered.length} completed request{completedFiltered.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {archiveSelected.size > 0 && (
                <button className="btn btn-ghost btn-sm" disabled={archiving} onClick={handleArchiveSelected}
                  style={{ fontSize:11, color:"var(--muted)" }}>
                  {archiving ? "Archiving…" : `Archive ${archiveSelected.size} selected`}
                </button>
              )}
              <select value={cCompanyFilter} onChange={e => setCCompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: cCompanyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input className="search-input" placeholder="Search completed…" value={cSearch} onChange={e => setCSearch(e.target.value)} />
            </div>
          </div>

          <SRTable
            rows={completedPageRows}
            companiesMap={companiesMap}
            linesInvoiceMap={linesInvoiceMap}
            srServicesMap={srServicesMap}
            partsOrderedMap={partsOrderedMap}
            sortCol={cSortCol} sortDir={cSortDir} onSort={handleCSort}
            onSelect={handleSelect} onPartsClick={handlePartsClick}
            hasUnreadNotes={hasUnreadNotes}
            archiveSelected={archiveSelected}
            onToggleArchive={toggleArchiveSelect}
            onToggleArchiveAll={toggleArchiveSelectAll}
            allSelected={archiveSelected.size === completedFiltered.length && completedFiltered.length > 0}
          />
          <Pagination page={completedPageClamped} totalPages={completedTotalPages} onPageChange={setCompletedPage} />
        </div>
      )}

      {/* ═══ ARCHIVED REQUESTS ═══ */}
      {!loading && archivedRequests.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: archiveOpen ? 10 : 0, flexWrap:"wrap", gap:8 }}>
            <button onClick={() => setArchiveOpen(v => !v)}
              style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:0 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.04em", color:"var(--dim)" }}>
                Archived ({archivedRequests.length})
              </span>
              <span style={{ color:"var(--dim)", fontSize:12 }}>{archiveOpen ? "▾" : "▸"}</span>
            </button>
            {archiveOpen && (
              <div style={{ display:"flex", gap:8 }}>
                <select value={aCompanyFilter} onChange={e => setACompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: aCompanyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
                  <option value="">All Companies</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input className="search-input" placeholder="Search archived…" value={aSearch} onChange={e => setASearch(e.target.value)} />
              </div>
            )}
          </div>

          {archiveOpen && (
            <>
              <SRTable
                rows={archivedPageRows}
                companiesMap={companiesMap}
                linesInvoiceMap={linesInvoiceMap}
                srServicesMap={srServicesMap}
                partsOrderedMap={partsOrderedMap}
                sortCol={aSortCol} sortDir={aSortDir} onSort={handleASort}
                onSelect={handleSelect} onPartsClick={handlePartsClick}
                hasUnreadNotes={hasUnreadNotes}
                onUnarchive={handleUnarchive}
              />
              <Pagination page={archivedPageClamped} totalPages={archivedTotalPages} onPageChange={setArchivedPage} />
            </>
          )}
        </div>
      )}

      {selected && (
        <RequestModal key={selected.id} request={selected} onClose={() => { load(true); setSelected(null); setScrollToPartsLine(false); }}
          onUpdate={() => { load(); setSelected(null); setScrollToPartsLine(false); }}
          onDelete={() => { load(); setSelected(null); setScrollToPartsLine(false); }}
          adminDisplayName={adminDisplayName}
          linesInvoiceData={linesInvoiceMap[selected.id]} companiesMap={companiesMap}
          scrollToPartsLine={scrollToPartsLine} />
      )}

      {showNewRequest && (
        <NewRequestModal
          onClose={() => setShowNewRequest(false)}
          onCreated={() => { setShowNewRequest(false); load(); }} />
      )}
    </div>
  );
}
