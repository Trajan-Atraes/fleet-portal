import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";
import { SUBMISSION_TARGETS, TARGET_LABELS, INVOICE_STATUSES, INVOICE_STATUS_LABELS, HARD_FLOOR, DEFAULT_RATE, SERVICE_TYPES, STATUS_LABELS } from "../lib/constants";
import { SRStatusBadge } from "../components/StatusBadge";
import NotesLog from "../components/NotesLog";

const IcoPlus    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoRefresh = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoChevron = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>;
const IcoSparkle = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>;

// ─── INVOICE STATUS BADGE ─────────────────────────────────────
function InvoiceStatusBadge({ status }) {
  const map = {
    draft:         { bg:"rgba(55,79,104,0.3)",    color:"#526a84", label:"Draft"         },
    submitted:     { bg:"rgba(245,158,11,0.12)",  color:"#fbbf24", label:"Submitted"     },
    approved:      { bg:"rgba(16,185,129,0.12)",  color:"#34d399", label:"Approved"      },
    rejected:      { bg:"rgba(239,68,68,0.12)",   color:"#f87171", label:"Rejected"      },
    client_billed: { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Client Billed" },
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
  const [linkedLineId, setLinkedLineId] = useState("");
  const [srLines, setSrLines] = useState([]);
  const [form, setForm] = useState({
    company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"",
    service_type:"", bill_to_id:"",
    taxType:"flat", taxValue:"0",
    discountType:"none", discountValue:"0",
  });
  const [services, setServices] = useState([{
    name:"", labor_hours:"", labor_rate:String(DEFAULT_RATE),
    parts:[{ description:"", quantity:"1", rate:"" }],
  }]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNote, setAiNote]       = useState("");

  useEffect(() => {
    supabase.from("service_requests").select("id,request_number,vehicle_id,vin,vehicle_make,vehicle_model,vehicle_year,service_type,company_id,vehicle_registry_id").order("request_number",{ascending:false}).then(({data}) => setRequests(data||[]));
    supabase.from("companies").select("id,name").order("name").then(({data}) => setCompanies(data||[]));
    supabase.from("bill_to_contacts").select("*").order("name").then(({data}) => setBillToContacts(data||[]));
  }, []);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLinkRequest = async (reqId) => {
    setLinkedReqId(reqId);
    setLinkedLineId("");
    setSrLines([]);
    if (!reqId) return;
    const r = requests.find(r => r.id === reqId);
    supabase.from("service_lines").select("id, line_letter, service_name").eq("sr_id", reqId).order("line_letter")
      .then(({ data }) => setSrLines(data || []));
    if (!r) return;
    let billToId = "";
    if (r.vehicle_registry_id) {
      const { data: veh } = await supabase.from("vehicles").select("default_bill_to_id").eq("id", r.vehicle_registry_id).maybeSingle();
      if (veh?.default_bill_to_id) billToId = veh.default_bill_to_id;
    }
    setForm(p => ({
      ...p,
      company_id:    r.company_id    || p.company_id,
      vehicle_id:    r.vehicle_id    || "",
      vin:           r.vin           || "",
      vehicle_make:  r.vehicle_make  || "",
      vehicle_model: r.vehicle_model || "",
      vehicle_year:  r.vehicle_year  || "",
      service_type:  r.service_type  || "",
      bill_to_id:    billToId        || p.bill_to_id,
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
    if (!form.service_type) { setError("Service type is required."); return; }
    setSaving(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    const selectedBillTo = billToContacts.find(c => c.id === form.bill_to_id) || null;
    const { error: err } = await supabase.from("invoices").insert({
      service_request_id: linkedReqId || null,
      service_line_id:    linkedLineId || null,
      company_id:         form.company_id || null,
      vehicle_id:         form.vehicle_id,
      vin:                form.vin || null,
      vehicle_make:       form.vehicle_make,
      vehicle_model:      form.vehicle_model,
      vehicle_year:       form.vehicle_year,
      service_type:       form.service_type,
      bill_to_id:         form.bill_to_id || null,
      submission_target:  selectedBillTo ? selectedBillTo.name : null,
      labor_hours:        0,
      labor_rate:         DEFAULT_RATE,
      parts_cost:         afterDiscount,
      diagnostic_fee:     0,
      tax:                taxAmt,
      line_items:         { services, settings: { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue } },
      status:             submitNow ? "submitted" : "draft",
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
        <div className="form-grid" style={{ marginBottom:0 }}>
          <div className="field" style={{ marginBottom:0 }}>
            <label>Service Request</label>
            <select value={linkedReqId} onChange={e => handleLinkRequest(e.target.value)}>
              <option value="">— None —</option>
              {requests.map(r => (
                <option key={r.id} value={r.id}>
                  SR-{r.request_number} · {r.vehicle_id}{r.service_type ? ` · ${r.service_type}` : ""}{companyName(r.company_id) ? ` — ${companyName(r.company_id)}` : ""}
                </option>
              ))}
            </select>
          </div>
          {linkedReqId && (
            <div className="field" style={{ marginBottom:0 }}>
              <label>Service Line</label>
              <select value={linkedLineId} onChange={e => setLinkedLineId(e.target.value)}>
                <option value="">— None —</option>
                {srLines.map(l => (
                  <option key={l.id} value={l.id}>
                    Line {l.line_letter}{l.service_name ? ` — ${l.service_name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle & service */}
      <div className="card" style={{ marginBottom:12 }}>
        <div className="card-title">Vehicle & Service</div>
        <div className="form-grid" style={{ marginBottom:10 }}>
          <div className="field">
            <label>DSP</label>
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
        {(() => {
          const sel = billToContacts.find(c => c.id === form.bill_to_id) || null;
          return (
            <>
              <div className="field" style={{ marginBottom: sel ? 6 : 0 }}>
                <label>Bill To</label>
                <select value={form.bill_to_id} onChange={e => f("bill_to_id", e.target.value)}>
                  <option value="">— Select Bill To Contact —</option>
                  {billToContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {sel && (
                <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:5, padding:"8px 12px", marginBottom:0, fontSize:12 }}>
                  <div style={{ color:"var(--soft)", marginBottom:2 }}>{sel.address}</div>
                  <div style={{ color:"var(--dim)" }}>{[sel.email, sel.phone].filter(Boolean).join(" · ")}</div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* Price intelligence */}
      <PriceIntelPanel
        serviceType={form.service_type}
        vehicleType={vehicleType}
        target={(billToContacts.find(c => c.id === form.bill_to_id) || null)?.name || ""}
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

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving}>{saving?"Saving…":"Save Draft"}</button>
        <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving||!form.service_type}>
          {saving?"Submitting…":"Submit Invoice"}
        </button>
      </div>
    </div>
  );
}

// ─── INVOICE MODAL ────────────────────────────────────────────
function InvoiceModal({ invoice, companies, requestsStatusMap, requestsMap, billToContacts, adminDisplayName, onClose, onUpdate, onDelete }) {
  const savedSettings = (!Array.isArray(invoice.line_items) && invoice.line_items?.settings) ? invoice.line_items.settings : null;
  const [form, setForm] = useState({
    company_id:   invoice.company_id   || "",
    vehicle_id:   invoice.vehicle_id   || "",
    vin:          invoice.vin          || "",
    vehicle_make: invoice.vehicle_make || "",
    vehicle_model:invoice.vehicle_model|| "",
    vehicle_year: invoice.vehicle_year || "",
    service_type: invoice.service_type || "",
    bill_to_id:   invoice.bill_to_id   || "",
    taxType:      savedSettings?.taxType      || "flat",
    taxValue:     savedSettings?.taxValue     || String(invoice.tax || "0"),
    discountType: savedSettings?.discountType || "none",
    discountValue:savedSettings?.discountValue || "0",
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
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");
  const [downloading, setDownloading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    if (invoice.service_request_id) {
      // Deleting the SR triggers cascade-delete of the linked invoice (tr_delete_invoice_on_sr_delete)
      await supabase.from("service_requests").delete().eq("id", invoice.service_request_id);
    } else {
      await supabase.from("invoices").delete().eq("id", invoice.id);
    }
    setDeleting(false);
    onDelete?.();
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) { setError("Not signed in — please refresh and try again."); setDownloading(false); return; }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
        body:    JSON.stringify({ invoice_id: invoice.id }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `PDF generation failed (${res.status})`);
        setDownloading(false);
        return;
      }

      const blob     = await res.blob();
      const url      = URL.createObjectURL(blob);
      const a        = document.createElement("a");
      const disp     = res.headers.get("Content-Disposition") || "";
      const match    = disp.match(/filename="([^"]+)"/);
      a.href         = url;
      a.download     = match ? match[1] : `invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("PDF download failed — check your connection and try again.");
    }
    setDownloading(false);
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    const selectedBillTo = (billToContacts||[]).find(c => c.id === form.bill_to_id) || null;
    const updates = {
      company_id:        form.company_id || null,
      vehicle_id:        form.vehicle_id,
      vin:               form.vin || null,
      vehicle_make:      form.vehicle_make,
      vehicle_model:     form.vehicle_model,
      vehicle_year:      form.vehicle_year,
      service_type:      form.service_type,
      bill_to_id:        form.bill_to_id || null,
      submission_target: selectedBillTo ? selectedBillTo.name : (invoice.submission_target || null),
      labor_hours:       0,
      labor_rate:        DEFAULT_RATE,
      parts_cost:        afterDiscount,
      diagnostic_fee:    0,
      tax:               taxAmt,
      line_items:        { services, settings: { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue } },
      status,
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
        vehicle_type: vehicleType, submission_target: updates.submission_target || "Unknown",
        submitted_amount: total, outcome: status,
      });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onUpdate(); }, 1200);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>Edit Invoice</h3>
            <div className="modal-head-sub" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span>{companies.find(c => c.id === form.company_id)?.name || "—"} · Created {new Date(invoice.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
              {invoice.service_request_id && requestsMap?.[invoice.service_request_id] && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>
                    Invoice #SR-{requestsMap[invoice.service_request_id]}{invoice.service_lines?.line_letter ? `-${invoice.service_lines.line_letter}` : ""}
                  </span>
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
              <label>DSP</label>
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
          {(() => {
            const sel = (billToContacts||[]).find(c => c.id === form.bill_to_id) || null;
            return (
              <div style={{ marginBottom:14 }}>
                <div className="field" style={{ marginBottom: sel ? 6 : 0 }}>
                  <label>Bill To</label>
                  <select value={form.bill_to_id} onChange={e => f("bill_to_id", e.target.value)}>
                    <option value="">— Select Bill To Contact —</option>
                    {(billToContacts||[]).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                {sel && (
                  <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:5, padding:"8px 12px", fontSize:12 }}>
                    <div style={{ color:"var(--soft)", marginBottom:2 }}>{sel.address}</div>
                    <div style={{ color:"var(--dim)" }}>{[sel.email, sel.phone].filter(Boolean).join(" · ")}</div>
                  </div>
                )}
              </div>
            );
          })()}

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
          <NotesLog srId={invoice.service_request_id || null} currentUserName={adminDisplayName || "Admin"} isAdmin={true} />

          {saved  && <div className="success-box">Saved.</div>}

          {confirmDelete && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10, fontSize:13, color:"var(--body)" }}>
              <strong style={{ color:"#ef4444" }}>Delete this record?</strong>{" "}
              {invoice.service_request_id
                ? "This will permanently delete the service request and its linked invoice."
                : "This will permanently delete the invoice."
              }{" "}This cannot be undone.
            </div>
          )}

          <div style={{ display:"flex", gap:8, justifyContent:"space-between", alignItems:"center" }}>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <button className="btn btn-ghost btn-sm" onClick={handleDownloadPdf} disabled={downloading} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloading ? "Generating…" : "Download PDF"}
              </button>
              {!confirmDelete
                ? <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444", borderColor:"rgba(239,68,68,0.35)" }} onClick={() => setConfirmDelete(true)}>Delete Record</button>
                : <>
                    <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
                    <button className="btn btn-sm" style={{ background:"#ef4444", color:"#fff" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Confirm Delete"}</button>
                  </>
              }
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BILL TO CONTACTS MODAL ───────────────────────────────────
function BillToContactsModal({ onClose, onChanged }) {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [form, setForm] = useState({ name:"", address:"", email:"", phone:"", notes:"" });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("bill_to_contacts").select("*").order("name");
    setContacts(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditContact(null);
    setForm({ name:"", address:"", email:"", phone:"", notes:"" });
    setError(""); setShowForm(true);
  };
  const openEdit = (c) => {
    setEditContact(c);
    setForm({ name:c.name, address:c.address, email:c.email||"", phone:c.phone||"", notes:c.notes||"" });
    setError(""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) { setError("Name and address are required."); return; }
    setSaving(true); setError("");
    const payload = { name:form.name.trim(), address:form.address.trim(), email:form.email.trim()||null, phone:form.phone.trim()||null, notes:form.notes.trim()||null };
    const { error: err } = editContact
      ? await supabase.from("bill_to_contacts").update(payload).eq("id", editContact.id)
      : await supabase.from("bill_to_contacts").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowForm(false); load(); onChanged?.();
  };

  const handleDelete = async (id) => {
    await supabase.from("bill_to_contacts").delete().eq("id", id);
    setDeleteConfirm(null); load(); onChanged?.();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:580 }}>
        <div className="modal-head">
          <div>
            <h3>Bill To Contacts</h3>
            <div className="modal-head-sub">Manage billing contacts — assign to vehicles and invoices</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {showForm ? (
            <div>
              {error && <div className="error-box">{error}</div>}
              <div className="form-grid" style={{ marginBottom:10 }}>
                <div className="field">
                  <label>Name *</label>
                  <input value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Auto Integrate Inc." autoFocus />
                </div>
                <div className="field">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="(555) 000-0000" />
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Address *</label>
                  <input value={form.address} onChange={e => setForm(p=>({...p,address:e.target.value}))} placeholder="123 Main St, City, State 00000" />
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="billing@company.com" />
                </div>
                <div className="field" style={{ gridColumn:"1/-1" }}>
                  <label>Notes <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label>
                  <textarea value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} placeholder="Any notes…" style={{ height:60 }} />
                </div>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving?"Saving…":editContact?"Save Changes":"Add Contact"}</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:12 }}>
                <button className="btn btn-primary btn-sm" onClick={openAdd}><IcoPlus /> New Bill To Contact</button>
              </div>
              {loading ? <div className="loading-row">Loading…</div> : contacts.length === 0 ? (
                <div style={{ textAlign:"center", padding:"24px 0", color:"var(--muted)", fontSize:13 }}>
                  No Bill To contacts yet. Add your first billing contact.
                </div>
              ) : contacts.map(c => (
                <div key={c.id} style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", padding:"10px 12px", background:"var(--raised)", border:"1px solid var(--border)", borderRadius:5, marginBottom:6 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:"var(--snow)", marginBottom:2 }}>{c.name}</div>
                    <div style={{ fontSize:12, color:"var(--muted)" }}>{c.address}</div>
                    {(c.email || c.phone) && (
                      <div style={{ fontSize:11, color:"var(--dim)", marginTop:2 }}>{[c.email, c.phone].filter(Boolean).join(" · ")}</div>
                    )}
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0, marginLeft:12 }}>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => openEdit(c)}>Edit</button>
                    {deleteConfirm === c.id ? (
                      <>
                        <button className="btn btn-danger btn-sm" style={{ fontSize:11 }} onClick={() => handleDelete(c.id)}>Confirm</button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-ghost btn-sm" style={{ fontSize:11, color:"var(--red)" }} onClick={() => setDeleteConfirm(c.id)}>Delete</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SORT HELPERS ────────────────────────────────────────────
const INV_STATUS_ORDER = { draft:0, submitted:1, approved:2, rejected:3, client_billed:4, paid:5 };
const INV_SR_STATUS_ORDER = { pending:0, in_progress:1, completed:2, cancelled:3 };

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

function sortInvRows(rows, col, dir, companiesMap, requestsMap, requestsStatusMap, getBillToLabel) {
  const m = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    let va, vb;
    if (col === "created_at" || col === "updated_at") {
      va = a[col] ? new Date(a[col]).getTime() : -Infinity;
      vb = b[col] ? new Date(b[col]).getTime() : -Infinity;
      return m * (va - vb);
    }
    if (col === "invoice_num")    { va = Number(requestsMap[a.service_request_id])||0; vb = Number(requestsMap[b.service_request_id])||0; return m*(va-vb); }
    if (col === "total")           return m * ((Number(a.total)||0) - (Number(b.total)||0));
    if (col === "company")         { va = (companiesMap[a.company_id]||"").toLowerCase(); vb = (companiesMap[b.company_id]||"").toLowerCase(); return m * va.localeCompare(vb); }
    if (col === "bill_to")         { va = (getBillToLabel(a)||"").toLowerCase(); vb = (getBillToLabel(b)||"").toLowerCase(); return m * va.localeCompare(vb); }
    if (col === "service_status")  { va = INV_SR_STATUS_ORDER[requestsStatusMap[a.service_request_id]]??99; vb = INV_SR_STATUS_ORDER[requestsStatusMap[b.service_request_id]]??99; return m*(va-vb); }
    if (col === "status")          { va = INV_STATUS_ORDER[a.status]??99; vb = INV_STATUS_ORDER[b.status]??99; return m*(va-vb); }
    va = (a[col]||"").toLowerCase(); vb = (b[col]||"").toLowerCase();
    return m * va.localeCompare(vb);
  });
}

// ─── BILLING TAB ──────────────────────────────────────────────
export default function Billing({ adminDisplayName }) {
  const [invoices, setInvoices]       = useState([]);
  const [companies, setCompanies]     = useState([]);
  const [requests, setRequests]       = useState([]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState("list");
  const [selected, setSelected]       = useState(null);
  const [filter, setFilter]           = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [targetFilter, setTargetFilter]   = useState("");  // bill_to_id uuid OR legacy submission_target string
  const [search, setSearch]               = useState("");
  const [showBillToMgmt, setShowBillToMgmt] = useState(false);
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const load = async () => {
    setLoading(true);
    const [{ data: invs }, { data: cos }, { data: reqs }, { data: btc }] = await Promise.all([
      supabase.from("invoices").select("*, service_lines(line_letter)").order("created_at",{ascending:false}),
      supabase.from("companies").select("id,name").order("name"),
      supabase.from("service_requests").select("id,request_number,status"),
      supabase.from("bill_to_contacts").select("*").order("name"),
    ]);
    setInvoices(invs || []);
    setCompanies(cos || []);
    setRequests(reqs || []);
    setBillToContacts(btc || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const companiesMap      = Object.fromEntries((companies||[]).map(c => [c.id, c.name]));
  const requestsMap       = Object.fromEntries((requests||[]).map(r => [r.id, r.request_number]));
  const requestsStatusMap = Object.fromEntries((requests||[]).map(r => [r.id, r.status]));
  const billToMap         = Object.fromEntries((billToContacts||[]).map(c => [c.id, c]));

  const getBillToLabel = (inv) => {
    if (inv.bill_to_id && billToMap[inv.bill_to_id]) return billToMap[inv.bill_to_id].name;
    if (inv.submission_target) return TARGET_LABELS[inv.submission_target] || inv.submission_target;
    return null;
  };

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
    .filter(i => {
      if (!targetFilter) return true;
      if (i.bill_to_id) return i.bill_to_id === targetFilter;
      return i.submission_target === targetFilter;
    })
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
        (getBillToLabel(i) || "").toLowerCase().includes(q)
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
          <button className="btn btn-ghost btn-sm" onClick={() => setShowBillToMgmt(true)}>Bill To Contacts</button>
          <button className="btn btn-primary btn-sm" onClick={() => setView("builder")}><IcoPlus /> New Invoice</button>
        </div>
      </div>

      {showBillToMgmt && (
        <BillToContactsModal onClose={() => setShowBillToMgmt(false)} onChanged={load} />
      )}

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
              {billToMap[targetFilter]?.name || TARGET_LABELS[targetFilter] || targetFilter}
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
          placeholder="Search SR#, DSP, vehicle, VIN…"
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
                <SortTh col="created_at"    label="Date"           sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="updated_at"    label="Last Updated"   sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="invoice_num"   label="Invoice #"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="company"       label="Company"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="vehicle_id"    label="Vehicle"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="vin"           label="VIN"            sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="service_type"  label="Service"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="bill_to"       label="Bill To"        sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="total"         label="Total"          sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="service_status" label="Service Status" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <SortTh col="status"        label="Status"         sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortInvRows(filtered, sortCol, sortDir, companiesMap, requestsMap, requestsStatusMap, getBillToLabel).map(inv => (
                <tr key={inv.id} onClick={() => setSelected(inv)}>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {new Date(inv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                  </td>
                  <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                    {inv.updated_at ? new Date(inv.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) + " " + new Date(inv.updated_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"}) : "—"}
                  </td>
                  <td>
                    {inv.service_request_id && requestsMap[inv.service_request_id]
                      ? <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>
                          SR-{requestsMap[inv.service_request_id]}{inv.service_lines?.line_letter ? `-${inv.service_lines.line_letter}` : ""}
                        </span>
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
                    {(() => {
                      const label = getBillToLabel(inv);
                      const filterVal = inv.bill_to_id || inv.submission_target;
                      return label
                        ? <span className="clickable-val" onClick={e => { e.stopPropagation(); setTargetFilter(filterVal); }}>{label}</span>
                        : <span style={{ color:"var(--muted)" }}>—</span>;
                    })()}
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
          billToContacts={billToContacts}
          adminDisplayName={adminDisplayName}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); setSelected(null); }}
          onDelete={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}
