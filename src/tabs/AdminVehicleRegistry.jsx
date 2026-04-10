import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ssGet, ssSet } from "../lib/constants";
import { VehicleStatusBadge } from "../components/VehicleStatusBadge";
import { IcoRefresh, IcoPlus } from "../components/Icons";

// ─── VEHICLE REGISTRY ─────────────────────────────────────────
export default function VehicleRegistry({ adminDisplayName }) {
  const [vehicles, setVehicles]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]               = useState(() => ssGet("vr_search", ""));
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState(() => ssGet("vr_company", ""));
  const [statusFilter, setStatusFilter]   = useState(() => ssGet("vr_status", "Road Worthy"));
  const [selected, setSelected]   = useState(null);
  const [srHistory, setSrHistory] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [statusLogs, setStatusLogs] = useState([]);
  const [showForm, setShowForm]   = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [form, setForm] = useState({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Road Worthy", default_bill_to_id:"", group_id:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [groups, setGroups] = useState([]);
  const [showGroupMgmt, setShowGroupMgmt] = useState(false);
  const [groupForm, setGroupForm] = useState({ name:"", company_id:"" });
  const [editGroupId, setEditGroupId] = useState(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(null);

  const load = async () => {
    setLoading(true);
    const [{ data: vehs }, { data: cos }, { data: btc }, { data: grps }] = await Promise.all([
      supabase.from("vehicles").select("*").order("vehicle_id").limit(1000),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("bill_to_contacts").select("id,name").order("name"),
      supabase.from("vehicle_groups").select("*").order("sort_order").order("name"),
    ]);
    setVehicles(vehs || []);
    setCompanies(cos || []);
    setBillToContacts(btc || []);
    setGroups(grps || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const companiesMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

  // Persist filters to sessionStorage
  useEffect(() => { ssSet("vr_search", search); }, [search]);
  useEffect(() => { ssSet("vr_company", companyFilter); }, [companyFilter]);
  useEffect(() => { ssSet("vr_status", statusFilter); }, [statusFilter]);

  // Debounce search (300ms)
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const filtered = vehicles
    .filter(v => statusFilter === "all" ? true : v.status === statusFilter)
    .filter(v => !companyFilter || v.company_id === companyFilter)
    .filter(v => {
      if (!debouncedSearch) return true;
      const q = debouncedSearch.toLowerCase();
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
    roadWorthy:    vehicles.filter(v => v.status === "Road Worthy").length,
    Retired:       vehicles.filter(v => v.status === "Retired").length,
    notRoadWorthy: vehicles.filter(v => v.status === "Not Road Worthy").length,
    total:         vehicles.length,
  };

  const fmt = d => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

  const openAdd = () => {
    setEditVehicle(null);
    setForm({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Road Worthy", default_bill_to_id:"", group_id:"" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (v, e) => {
    if (e) e.stopPropagation();
    setEditVehicle(v);
    setForm({ company_id: v.company_id, vehicle_id: v.vehicle_id, vin: v.vin || "", vehicle_make: v.vehicle_make || "", vehicle_model: v.vehicle_model || "", vehicle_year: v.vehicle_year || "", license_plate: v.license_plate || "", notes: v.notes || "", status: v.status || "Road Worthy", default_bill_to_id: v.default_bill_to_id || "", group_id: v.group_id || "" });
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
        .select("id, request_number, status, created_at, updated_at, mileage, urgency, updated_by_name, estimated_completion, service_lines(line_letter, service_name, is_completed)")
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

    // VIN duplicate check
    if (form.vin.trim()) {
      const { data: vinMatch } = await supabase.from("vehicles").select("id, vehicle_id, companies(name)")
        .eq("vin", form.vin.trim()).limit(1).maybeSingle();
      if (vinMatch && vinMatch.id !== editVehicle?.id) {
        const owner = vinMatch.companies?.name || "another company";
        setError(`A vehicle with this VIN already exists: ${vinMatch.vehicle_id} (${owner}).`);
        setSaving(false);
        return;
      }
    }

    if (editVehicle) {
      const { error: err } = await supabase.from("vehicles").update({
        vehicle_id:          form.vehicle_id.trim(),
        vin:                 form.vin.trim() || null,
        vehicle_make:        form.vehicle_make.trim() || null,
        vehicle_model:       form.vehicle_model.trim() || null,
        vehicle_year:        form.vehicle_year.trim() || null,
        license_plate:       form.license_plate.trim() || null,
        notes:               form.notes.trim() || null,
        status:              form.status,
        default_bill_to_id:  form.default_bill_to_id || null,
        group_id:            form.group_id || null,
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
        company_id:         form.company_id,
        vehicle_id:         form.vehicle_id.trim(),
        vin:                form.vin.trim() || null,
        vehicle_make:       form.vehicle_make.trim() || null,
        vehicle_model:      form.vehicle_model.trim() || null,
        vehicle_year:       form.vehicle_year.trim() || null,
        license_plate:      form.license_plate.trim() || null,
        notes:              form.notes.trim() || null,
        status:             form.status,
        default_bill_to_id: form.default_bill_to_id || null,
        group_id:           form.group_id || null,
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
          <button className="btn btn-ghost btn-sm" onClick={() => setShowGroupMgmt(true)}>Manage Groups</button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}><IcoPlus /> Add Vehicle</button>
        </div>
      </div>

      <div className="stats-row stats-4">
        <div className="stat-card"><div className="stat-label">Total Vehicles</div><div className="stat-value">{counts.total}</div></div>
        <div className="stat-card"><div className="stat-label">Road Worthy</div><div className="stat-value c-green">{counts.roadWorthy}</div></div>
        <div className="stat-card"><div className="stat-label">Retired</div><div className="stat-value" style={{ color:"var(--dim)" }}>{counts.Retired}</div></div>
        <div className="stat-card"><div className="stat-label">Not Road Worthy</div><div className="stat-value" style={{ color:"var(--amber)" }}>{counts.notRoadWorthy}</div></div>
      </div>

      {error   && <div className="error-box"   style={{ marginBottom:10 }}>{error}</div>}
      {success && <div className="success-box" style={{ marginBottom:10 }}>{success}</div>}

      <div className="toolbar" style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div className="filters">
          {[["Road Worthy","Road Worthy"],["Retired","Retired"],["Not Road Worthy","Not Road Worthy"],["all","All"]].map(([id, label]) => (
            <button key={id} className={`filter-btn ${statusFilter===id?"active":""}`} onClick={() => setStatusFilter(id)}>
              {label} ({id === "Road Worthy" ? counts.roadWorthy : id === "Retired" ? counts.Retired : id === "Not Road Worthy" ? counts.notRoadWorthy : counts.total})
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
                        <option value="Road Worthy">Active</option>
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
                    <thead><tr><th>SR #</th><th>Date</th><th>Services</th><th>Status</th><th>Mechanic</th><th>Mileage</th><th>Est. Completion</th></tr></thead>
                    <tbody>
                      {srHistory.map(r => {
                        const svcNames = (r.service_lines || []).map(l => l.service_name).filter(Boolean).join(", ");
                        return (
                          <tr key={r.id} style={{ cursor:"default" }}>
                            <td><span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)" }}>{r.request_number}</span></td>
                            <td style={{ fontSize:11, color:"var(--body)", whiteSpace:"nowrap" }}>{fmt(r.created_at)}</td>
                            <td style={{ fontSize:12, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{svcNames || "—"}</td>
                            <td><span style={{ fontSize:11, textTransform:"uppercase", fontWeight:700, color: r.status==="completed"?"var(--green)":r.status==="in_progress"?"var(--blue)":r.status==="cancelled"?"var(--red)":"var(--muted)" }}>{r.status?.replace("_"," ")}</span></td>
                            <td style={{ fontSize:12, color:"var(--soft)" }}>{r.updated_by_name || "—"}</td>
                            <td style={{ fontSize:12, color:"var(--soft)" }}>{r.mileage ? Number(r.mileage).toLocaleString() : "—"}</td>
                            <td style={{ fontSize:11, color: r.estimated_completion ? "var(--body)" : "var(--dim)", whiteSpace:"nowrap" }}>{r.estimated_completion ? new Date(r.estimated_completion + "T00:00:00").toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) : "—"}</td>
                          </tr>
                        );
                      })}
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
                <label>DSP *</label>
                {editVehicle ? (
                  <div style={{ padding:"8px 10px", background:"var(--plate)", borderRadius:6, fontSize:13, color:"var(--soft)" }}>{companiesMap[editVehicle.company_id] || "—"}</div>
                ) : (
                  <select value={form.company_id} onChange={e => fv("company_id", e.target.value)}>
                    <option value="">— Select DSP —</option>
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
                    <option value="Road Worthy">Active</option>
                    <option value="Retired">Retired</option>
                    <option value="Not Road Worthy">Not Road Worthy</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Default Bill To</label>
                  <select value={form.default_bill_to_id} onChange={e => fv("default_bill_to_id", e.target.value)}>
                    <option value="">— Company (default) —</option>
                    {billToContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Vehicle Group</label>
                  <select value={form.group_id} onChange={e => fv("group_id", e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {groups.filter(g => g.company_id === (editVehicle?.company_id || form.company_id)).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
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

      {/* ── GROUP MANAGEMENT MODAL ── */}
      {showGroupMgmt && (
        <div className="modal-overlay" onClick={() => setShowGroupMgmt(false)}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div><h3>Vehicle Groups</h3><div className="modal-head-sub">Manage groups per DSP — vehicles can be assigned to a group</div></div>
              <button className="modal-close" onClick={() => setShowGroupMgmt(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Add group */}
              <div style={{ display:"flex", gap:6, marginBottom:14 }}>
                <select value={groupForm.company_id} onChange={e => setGroupForm(f => ({ ...f, company_id: e.target.value }))} style={{ flex:1 }}>
                  <option value="">— Select DSP —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder="Group name" style={{ flex:1 }} />
                <button className="btn btn-primary btn-sm" disabled={!groupForm.company_id || !groupForm.name.trim()} onClick={async () => {
                  const { error: err } = await supabase.from("vehicle_groups").insert({ company_id: groupForm.company_id, name: groupForm.name.trim() });
                  if (err) { setError(err.code === "23505" ? "Group name already exists for this DSP." : err.message); return; }
                  setGroupForm({ name:"", company_id: groupForm.company_id });
                  load();
                }}>Add</button>
              </div>

              {/* List by company */}
              {companies.filter(c => groups.some(g => g.company_id === c.id)).map(c => (
                <div key={c.id} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>{c.name}</div>
                  {groups.filter(g => g.company_id === c.id).map(g => (
                    <div key={g.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"5px 0", borderBottom:"1px solid var(--border)" }}>
                      {editGroupId === g.id ? (
                        <div style={{ display:"flex", gap:4, flex:1 }}>
                          <input value={editGroupName} onChange={e => setEditGroupName(e.target.value)} style={{ flex:1 }} autoFocus />
                          <button className="btn btn-primary btn-sm" onClick={async () => {
                            if (!editGroupName.trim()) return;
                            await supabase.from("vehicle_groups").update({ name: editGroupName.trim() }).eq("id", g.id);
                            setEditGroupId(null);
                            load();
                          }}>Save</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditGroupId(null)}>Cancel</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize:13, color:"var(--text)" }}>{g.name}</span>
                          <div style={{ display:"flex", gap:4 }}>
                            <span style={{ fontSize:10, color:"var(--dim)", marginRight:6 }}>{vehicles.filter(v => v.group_id === g.id).length} vehicles</span>
                            <button className="btn btn-ghost btn-sm" style={{ fontSize:10, padding:"1px 7px" }} onClick={() => { setEditGroupId(g.id); setEditGroupName(g.name); }}>Rename</button>
                            {confirmDeleteGroup === g.id ? (
                              <>
                                <button className="btn btn-ghost btn-sm" style={{ fontSize:10, padding:"1px 7px" }} onClick={() => setConfirmDeleteGroup(null)}>Cancel</button>
                                <button className="btn btn-sm" style={{ fontSize:10, padding:"1px 7px", background:"#ef4444", color:"#fff" }} onClick={async () => {
                                  await supabase.from("vehicle_groups").delete().eq("id", g.id);
                                  setConfirmDeleteGroup(null);
                                  load();
                                }}>Confirm</button>
                              </>
                            ) : (
                              <button className="btn btn-ghost btn-sm" style={{ fontSize:10, padding:"1px 7px", color:"var(--red)", borderColor:"rgba(239,68,68,0.25)" }} onClick={() => setConfirmDeleteGroup(g.id)}>Delete</button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {groups.length === 0 && <div style={{ fontSize:12, color:"var(--dim)", textAlign:"center", padding:"16px 0" }}>No groups created yet. Select a DSP and add one above.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
