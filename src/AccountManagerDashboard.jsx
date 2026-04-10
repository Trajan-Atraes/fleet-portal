import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, SUPABASE_URL } from "./lib/supabase";
import NotesLog from "./components/NotesLog";
import { PartsSummary } from "./components/ServiceLinesEditor";
import { SvcPreviewCell } from "./components/StatusBadge";
import { IcoBuilding, IcoDollar, IcoCar, IcoChevron, IcoMenu, IcoWrench, IcoPlus, IcoRefresh, IcoSparkle } from "./components/Icons";

// ─── PORTAL-SPECIFIC OVERRIDES (ACCOUNT MANAGER — PURPLE BADGE) ──
const css = `
  /* ── AM portal tag (purple) ── */
  .auth-logo .portal-tag {
    background:rgba(139,92,246,0.15); color:#a78bfa;
    border:1px solid rgba(139,92,246,0.35);
  }
  .sidebar-portal-tag {
    margin-left:8px; font-size:9px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase;
    background:rgba(139,92,246,0.15); color:#a78bfa; border:1px solid rgba(139,92,246,0.35);
    border-radius:3px; padding:2px 6px;
  }
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
const STATUS_OPTIONS = ["pending", "in_progress", "completed", "cancelled"];
const STATUS_LABELS  = { pending:"Pending", in_progress:"In Progress", completed:"Completed", cancelled:"Cancelled" };

// ─── INVOICE STATUS BADGE ─────────────────────────────────────
function InvoiceStatusBadge({ status, label }) {
  const map = {
    draft:         { bg:"rgba(55,79,104,0.3)",    color:"#526a84", label:"Draft"         },
    submitted:     { bg:"rgba(245,158,11,0.12)",  color:"#fbbf24", label:"Submitted"     },
    approved:      { bg:"rgba(16,185,129,0.12)",  color:"#34d399", label:"Approved"      },
    rejected:      { bg:"rgba(239,68,68,0.12)",   color:"#f87171", label:"Rejected"      },
    revise:        { bg:"rgba(249,115,22,0.12)", color:"#fb923c", label:"Revise"        },
    client_billed:            { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Client Billed"    },
    paid:                     { bg:"rgba(16,185,129,0.22)",  color:"#6ee7b7", label:"Paid"             },
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
        <InvoiceStatusBadge key={line_letter} status={status} label={`Line ${line_letter}`} />
      ))}
    </div>
  );
}

function SRStatusBadge({ status }) {
  if (!status) return <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>;
  const map = {
    pending:     { color:"#fbbf24", bg:"rgba(245,158,11,0.12)"  },
    in_progress: { color:"#60a5fa", bg:"rgba(59,130,246,0.12)"  },
    completed:   { color:"#34d399", bg:"rgba(16,185,129,0.12)"  },
    cancelled:   { color:"#6b7280", bg:"rgba(75,85,99,0.12)"    },
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
      <div style={{ fontSize:12, color:"var(--muted)" }}>Enter a service name, vehicle, and bill-to contact to see price intelligence.</div>
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
    bill_to_id:"",
    taxType:"flat", taxValue:"0",
    discountType:"none", discountValue:"0",
  });
  const [services, setServices] = useState([{
    name:"", labor_hours:"", labor_rate:String(DEFAULT_RATE),
    parts:[{ description:"", quantity:"1", rate:"" }],
  }]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [saving, setSaving]               = useState(false);
  const [error, setError]                 = useState("");
  const [aiLoading, setAiLoading]         = useState(false);
  const [aiNote, setAiNote]               = useState("");
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    supabase.from("service_requests").select("id,request_number,vehicle_id,vin,vehicle_make,vehicle_model,vehicle_year,service_type,company_id").is("archived_at", null).order("request_number",{ascending:false}).then(({data}) => setRequests(data||[]));
    supabase.from("companies").select("id,name").order("name").then(({data}) => setCompanies(data||[]));
    supabase.from("bill_to_contacts").select("*").order("name").then(({data}) => setBillToContacts(data||[]));
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
    const derivedServiceType = services[0]?.name || "";
    if (!derivedServiceType) { setAiNote("Enter a service name first."); return; }
    setAiLoading(true); setAiNote("");
    const { data: { session } } = await supabase.auth.getSession();
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/get-ai-estimate`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
        body: JSON.stringify({ vehicle_year:form.vehicle_year, vehicle_make:form.vehicle_make, vehicle_model:form.vehicle_model, service_type:derivedServiceType }),
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
    setSaving(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    const selectedBillTo = billToContacts.find(c => c.id === form.bill_to_id) || null;
    const derivedSvcType = services[0]?.name || null;
    const { error: err } = await supabase.from("invoices").insert({
      service_request_id: linkedReqId || null,
      company_id:         form.company_id || null,
      vehicle_id:         form.vehicle_id,
      vin:                form.vin || null,
      vehicle_make:       form.vehicle_make,
      vehicle_model:      form.vehicle_model,
      vehicle_year:       form.vehicle_year,
      service_type:       derivedSvcType,
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

      <div className="card" style={{ marginBottom:12 }}>
        <div className="card-title">Link Service Request (Optional)</div>
        <div className="field" style={{ marginBottom:0 }}>
          <label>Service Request</label>
          <select value={linkedReqId} onChange={e => handleLinkRequest(e.target.value)}>
            <option value="">— None —</option>
            {requests.map(r => (
              <option key={r.id} value={r.id}>
                {r.request_number} · {r.vehicle_id}{companyName(r.company_id) ? ` — ${companyName(r.company_id)}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

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

      <PriceIntelPanel
        serviceType={services[0]?.name || ""}
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
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:"var(--accent)" }}>${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {confirmSubmit && (
        <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10 }}>
          <div style={{ fontSize:13, color:"var(--snow)", marginBottom:8 }}>
            <strong style={{ color:"var(--accent)" }}>Submit this invoice for review?</strong>{" "}
            Once submitted it will be visible to the approval workflow.
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmSubmit(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={() => handleSave(true)} disabled={saving}>{saving?"Submitting…":"Confirm Submit"}</button>
          </div>
        </div>
      )}

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving}>{saving?"Saving…":"Save Draft"}</button>
        <button className="btn btn-primary" onClick={() => setConfirmSubmit(true)} disabled={saving||confirmSubmit}>
          Submit Invoice
        </button>
      </div>
    </div>
  );
}

// ─── INVOICE MODAL ────────────────────────────────────────────
function InvoiceModal({ invoice, companies, requestsStatusMap, requestsMap, billToContacts, amDisplayName, amEmail, onClose, onUpdate }) {
  const savedSettings = (!Array.isArray(invoice.line_items) && invoice.line_items?.settings) ? invoice.line_items.settings : null;
  const [form, setForm] = useState({
    company_id:   invoice.company_id   || "",
    vehicle_id:   invoice.vehicle_id   || "",
    vin:          invoice.vin          || "",
    vehicle_make: invoice.vehicle_make || "",
    vehicle_model:invoice.vehicle_model|| "",
    vehicle_year: invoice.vehicle_year || "",
    bill_to_id:   invoice.bill_to_id   || "",
    taxType:      savedSettings?.taxType      || "flat",
    taxValue:     savedSettings?.taxValue     || String(invoice.tax || "0"),
    discountType: savedSettings?.discountType || "none",
    discountValue:savedSettings?.discountValue || "0",
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
  const [status,           setStatus]           = useState(invoice.status);
  const [rejReason,        setRejReason]        = useState(invoice.rejection_reason || "");
  const [saving,           setSaving]           = useState(false);
  const [saved,            setSaved]            = useState(false);
  const [error,            setError]            = useState("");
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
  const [confirmSubmit,    setConfirmSubmit]    = useState(false);
  const [confirmUnsubmit,  setConfirmUnsubmit]  = useState(false);

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

  const handleUnsubmit = async () => {
    setSaving(true); setError("");
    const { error: err } = await supabase.from("invoices").update({ status: "draft", updated_by_name: amDisplayName || amEmail || "Account Manager" }).eq("id", invoice.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setStatus("draft");
    setConfirmUnsubmit(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onUpdate(); }, 1200);
  };


  const handleSave = async () => {
    // Intercept: require confirmation when transitioning to "submitted"
    if (status === "submitted" && invoice.status !== "submitted") {
      setConfirmSubmit(true);
      return;
    }
    setSaving(true); setError("");
    const selectedBillTo = (billToContacts||[]).find(c => c.id === form.bill_to_id) || null;
    const updates = {
      company_id:        form.company_id || null,
      vehicle_id:        form.vehicle_id,
      vin:               form.vin || null,
      vehicle_make:      form.vehicle_make,
      vehicle_model:     form.vehicle_model,
      vehicle_year:      form.vehicle_year,
      service_type:      services[0]?.name || null,
      bill_to_id:        form.bill_to_id || null,
      submission_target: selectedBillTo ? selectedBillTo.name : (invoice.submission_target || null),
      labor_hours:       0,
      labor_rate:        DEFAULT_RATE,
      parts_cost:        afterDiscount,
      diagnostic_fee:    0,
      tax:               taxAmt,
      line_items:        { services, settings: { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue } },
      status,
      updated_by_name: amDisplayName || amEmail || "Account Manager",
    };
    if (status === "rejected") updates.rejection_reason = rejReason;
    const { error: err } = await supabase.from("invoices").update(updates).eq("id", invoice.id);
    if (err) { setError(err.message); setSaving(false); return; }
    const wasUnresolved = !["approved","rejected"].includes(invoice.status);
    const isResolved    = status === "approved" || status === "rejected";
    if (wasUnresolved && isResolved) {
      const vehicleType = [form.vehicle_make, form.vehicle_model].filter(Boolean).join(" ") || form.vehicle_id || "Unknown";
      await supabase.from("pricing_history").insert({
        invoice_id: invoice.id, service_type: services[0]?.name || "Unknown",
        vehicle_type: vehicleType, submission_target: updates.submission_target || "Unknown",
        submitted_amount: total, outcome: status,
      });
    }
    setSaving(false); setSaved(true); setConfirmSubmit(false);
    setTimeout(() => { setSaved(false); onUpdate(); }, 1200);
  };

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && guardedClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3>Edit Invoice</h3>
            <div className="modal-head-sub" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span>{companies.find(c => c.id === form.company_id)?.name || "—"} · Created {new Date(invoice.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
              {invoice.service_request_id && requestsMap?.[invoice.service_request_id] && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>Invoice #{requestsMap[invoice.service_request_id]}</span>
                  {invoice.service_lines != null ? (
                    invoice.service_lines.is_completed
                      ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 6px", height:16, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(16,185,129,0.12)", color:"#34d399" }}>Complete</span>
                      : <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 6px", height:16, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(245,158,11,0.12)", color:"#fbbf24" }}>In Progress</span>
                  ) : null}
                </span>
              )}
            </div>
          </div>
          <button className="modal-close" onClick={guardedClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}

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


          <NotesLog ref={noteRef} srId={invoice.service_request_id || null} currentUserName={amDisplayName || amEmail} isAdmin={false} canSetClientVisible={true} onPendingFilesChange={setPendingNoteFiles} />

          {showUnsentWarning && (
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"10px 14px", marginTop:10, fontSize:13, color:"var(--body)" }}>
              <strong style={{ color:"var(--accent)" }}>You have {pendingNoteFiles} unsent photo(s).</strong> Send them before closing?
              <div style={{ display:"flex", gap:8, marginTop:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowUnsentWarning(false)}>Go Back</button>
                <button className="btn btn-primary btn-sm" onClick={handleSendAndClose}>Send and Close</button>
              </div>
            </div>
          )}

          {saved && <div className="success-box">Saved.</div>}

          {/* Submit confirmation */}
          {confirmSubmit && (
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ fontSize:13, color:"var(--snow)", marginBottom:8 }}>
                <strong style={{ color:"var(--accent)" }}>Submit this invoice for review?</strong>{" "}
                Once submitted it will be visible to the approval workflow.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmSubmit(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>{saving?"Submitting…":"Confirm Submit"}</button>
              </div>
            </div>
          )}

          {/* Un-submit confirmation */}
          {confirmUnsubmit && (
            <div style={{ background:"rgba(55,79,104,0.25)", border:"1px solid var(--border)", borderRadius:6, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ fontSize:13, color:"var(--snow)", marginBottom:8 }}>
                <strong style={{ color:"var(--text)" }}>Un-submit this invoice?</strong>{" "}
                It will return to Draft status and can be edited.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmUnsubmit(false)}>Cancel</button>
                <button className="btn btn-ghost btn-sm" onClick={handleUnsubmit} disabled={saving}>{saving?"Saving…":"Confirm Un-submit"}</button>
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:8, justifyContent:"space-between", alignItems:"center" }}>
            <div>
              {invoice.status === "submitted" && !confirmUnsubmit && (
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmUnsubmit(true)}>Un-submit</button>
              )}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-ghost" onClick={guardedClose}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving||confirmSubmit||confirmUnsubmit}>{saving ? "Saving…" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BILLING TAB ──────────────────────────────────────────────
function Billing({ amDisplayName, amEmail }) {
  const [invoices, setInvoices]       = useState([]);
  const [companies, setCompanies]     = useState([]);
  const [requests, setRequests]       = useState([]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState("list");
  const [selected, setSelected]       = useState(null);
  const [filter, setFilter]           = useState("all");
  const [serviceFilter, setServiceFilter] = useState("");
  const [targetFilter, setTargetFilter]   = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: invs }, { data: cos }, { data: reqs }, { data: btc }] = await Promise.all([
      supabase.from("invoices").select("*, service_lines!service_line_id(line_letter, is_completed)").eq("is_incognito", false).is("archived_at", null).order("created_at",{ascending:false}),
      supabase.from("companies").select("id,name").order("name"),
      supabase.from("service_requests").select("id,request_number,status").is("archived_at", null),
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
  const getBillToLabel    = (inv) => {
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
              {billToMap[targetFilter]?.name || TARGET_LABELS[targetFilter] || targetFilter}
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
                <th>Invoice #</th>
                <th>Company</th>
                <th>Vehicle</th>
                <th>VIN</th>
                <th>Service</th>
                <th>Bill To</th>
                <th>Total</th>
                <th>Service Status</th>
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
                  <td style={{ color:"var(--soft)", fontSize:11 }}>
                    {inv.updated_at ? <>
                      <div style={{ whiteSpace:"nowrap" }}>{new Date(inv.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) + " " + new Date(inv.updated_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
                      {inv.updated_by_name && <div style={{ fontSize:10, color:"var(--dim)", marginTop:1 }}>{inv.updated_by_name}</div>}
                    </> : "—"}
                  </td>
                  <td>
                    {inv.service_request_id && requestsMap[inv.service_request_id]
                      ? <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>{requestsMap[inv.service_request_id]}</span>
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
                  <td>{inv.service_lines != null ? (
                    inv.service_lines.is_completed
                      ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 7px", height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(16,185,129,0.12)", color:"#34d399", border:"1px solid rgba(16,185,129,0.3)" }}><span style={{ width:5, height:5, borderRadius:"50%", background:"#34d399", flexShrink:0 }} />Complete</span>
                      : <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 7px", height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(245,158,11,0.12)", color:"#fbbf24", border:"1px solid rgba(245,158,11,0.3)" }}><span style={{ width:5, height:5, borderRadius:"50%", background:"#fbbf24", flexShrink:0 }} />In Progress</span>
                  ) : <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>}</td>
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
          amDisplayName={amDisplayName}
          amEmail={amEmail}
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
  const [confirmRemoveUserId, setConfirmRemoveUserId] = useState(null);

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
    if (confirmRemoveUserId !== userId) { setConfirmRemoveUserId(userId); return; }
    setConfirmRemoveUserId(null); setError(""); setSuccess("");
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
                          <label>DSP Name *</label>
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
                            <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize:9, padding:"1px 7px", color: u.is_billing_user ? "#60a5fa" : "var(--muted)", borderColor: u.is_billing_user ? "rgba(59,130,246,0.35)" : undefined }}
                                onClick={async (e) => { e.stopPropagation(); await supabase.from("company_users").update({ is_billing_user: !u.is_billing_user }).eq("id", u.id); load(); }}
                              >{u.is_billing_user ? "Billing ✓" : "Billing"}</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEditUser(u)}>Edit</button>
                              {confirmRemoveUserId === u.user_id
                                ? <><button className="btn btn-ghost btn-sm" onClick={() => setConfirmRemoveUserId(null)}>Cancel</button><button className="btn btn-sm" style={{ background:"#ef4444", color:"#fff" }} onClick={() => handleRemoveUser(u.user_id, c.id)}>Confirm</button></>
                                : <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(u.user_id, c.id)}>Remove</button>
                              }
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
  const s = status || "Road Worthy";
  const map = {
    "Road Worthy":          { bg:"var(--green-dim)", color:"var(--green)", border:"rgba(16,185,129,0.22)" },
    "Retired":         { bg:"var(--raised)",    color:"var(--dim)",   border:"var(--border)"          },
    "Not Road Worthy": { bg:"var(--amber-dim)", color:"var(--amber)", border:"rgba(245,158,11,0.22)"  },
  };
  const st = map[s] || map["Road Worthy"];
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
  const [statusFilter, setStatusFilter]   = useState("Road Worthy");
  const [companyFilter, setCompanyFilter] = useState("");
  const [search, setSearch]               = useState("");
  const [selected, setSelected]   = useState(null);
  const [srHistory, setSrHistory] = useState([]);
  const [srLoading, setSrLoading] = useState(false);
  const [showForm, setShowForm]   = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [form, setForm] = useState({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Road Worthy", group_id:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [groups, setGroups] = useState([]);

  const load = async () => {
    setLoading(true);
    // RLS scopes both queries to AM's assigned companies automatically
    const [{ data: vehs }, { data: cos }, { data: grps }] = await Promise.all([
      supabase.from("vehicles").select("*").order("vehicle_id"),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("vehicle_groups").select("*").order("sort_order").order("name"),
    ]);
    setVehicles(vehs || []);
    setGroups(grps || []);
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
    roadWorthy:    vehicles.filter(v => v.status === "Road Worthy").length,
    Retired:       vehicles.filter(v => v.status === "Retired").length,
    notRoadWorthy: vehicles.filter(v => v.status === "Not Road Worthy").length,
    total:         vehicles.length,
  };

  const fmt = d => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  const fv  = (k, val) => setForm(p => ({ ...p, [k]: val }));

  const openAdd = () => {
    setEditVehicle(null);
    setForm({ company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"", license_plate:"", notes:"", status:"Road Worthy", group_id:"" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (v, e) => {
    if (e) e.stopPropagation();
    setEditVehicle(v);
    setForm({ company_id: v.company_id, vehicle_id: v.vehicle_id, vin: v.vin || "", vehicle_make: v.vehicle_make || "", vehicle_model: v.vehicle_model || "", vehicle_year: v.vehicle_year || "", license_plate: v.license_plate || "", notes: v.notes || "", status: v.status || "Road Worthy", group_id: v.group_id || "" });
    setError("");
    setShowForm(true);
  };

  const openDetail = async (v) => {
    setSelected(v);
    setSrHistory([]);
    setSrLoading(true);
    const { data } = await supabase.from("service_requests")
      .select("id, request_number, status, created_at, updated_at, mileage, urgency, updated_by_name, estimated_completion, service_lines(line_letter, service_name, is_completed)")
      .eq("vehicle_registry_id", v.id)
      .order("created_at", { ascending: false });
    setSrHistory(data || []);
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
        vehicle_id:    form.vehicle_id.trim(),
        vin:           form.vin.trim() || null,
        vehicle_make:  form.vehicle_make.trim() || null,
        vehicle_model: form.vehicle_model.trim() || null,
        vehicle_year:  form.vehicle_year.trim() || null,
        license_plate: form.license_plate.trim() || null,
        notes:         form.notes.trim() || null,
        status:        form.status,
        group_id:      form.group_id || null,
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
        group_id:      form.group_id || null,
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
            <option value="">All DSPs</option>
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
                    <option value="Road Worthy">Active</option>
                    <option value="Retired">Retired</option>
                    <option value="Not Road Worthy">Not Road Worthy</option>
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
    </div>
  );
}

// ─── SERVICE REQUEST MODAL (AM) ───────────────────────────────
function AMSRModal({ request, companiesMap, linesInvoiceData, amDisplayName, amEmail, session, onClose, onUpdate }) {
  const [status, setStatus] = useState(request.status);
  const [estimatedCompletion, setEstimatedCompletion] = useState(request.estimated_completion || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [vehicleStatus, setVehicleStatus] = useState(null);
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

  useEffect(() => {
    if (!request.vehicle_registry_id) return;
    supabase.from("vehicles").select("status").eq("id", request.vehicle_registry_id).maybeSingle()
      .then(({ data }) => { if (data) setVehicleStatus(data.status); });
  }, [request.vehicle_registry_id]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("service_requests").update({
      status,
      estimated_completion: estimatedCompletion || null,
      updated_by_id:    null,
      updated_by_name:  amDisplayName || amEmail,
      updated_by_email: amEmail,
    }).eq("id", request.id);
    setSaving(false);
    if (!error) { setSaved(true); setTimeout(() => { setSaved(false); onUpdate(); }, 1200); }
  };

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

          {/* Vehicle Status Toggle */}
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
                      changed_by_id: session?.user?.id, changed_by_name: amDisplayName || amEmail,
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

          <div className="detail-grid">
            <span className="detail-label">DSP</span>
            <span className="detail-value">{companiesMap[request.company_id] || "—"}</span>
            <span className="detail-label">Service</span>
            <span className="detail-value">{request.service_type}</span>
            <span className="detail-label">VIN</span>
            <span className="detail-value mono">{request.vin || "—"}</span>
            <span className="detail-label">Updated At</span>
            <span className="detail-value" style={{ fontSize:12 }}>
              {request.updated_at ? new Date(request.updated_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" }) + " " + new Date(request.updated_at).toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" }) : "—"}
            </span>
            <span className="detail-label">Billing Status</span>
            <span className="detail-value"><LineInvoiceBadges linesInvoiceData={linesInvoiceData} /></span>
          </div>

          {request.description && (
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Client Description</div>
              <div style={{ background:"var(--plate)", borderRadius:5, padding:"10px 12px", fontSize:13, color:"var(--body)", lineHeight:1.6, border:"1px solid var(--border)" }}>{request.description}</div>
            </div>
          )}

          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Parts Used</div>
            <PartsSummary srId={request.id} />
          </div>

          <hr className="divider" />

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
          <NotesLog ref={noteRef} srId={request.id} currentUserName={amDisplayName || amEmail} isAdmin={false} canSetClientVisible={true} onPendingFilesChange={setPendingNoteFiles} />

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

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost" onClick={guardedClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function amTruncateWords(str, max) {
  if (!str || str.length <= max) return { short: str || "", full: str || "", truncated: false };
  const cut = str.lastIndexOf(" ", max);
  const short = (cut > 0 ? str.slice(0, cut) : str.slice(0, max)) + "…";
  return { short, full: str, truncated: true };
}

// ─── SERVICE REQUESTS VIEW (AM) ───────────────────────────────
function AMServiceRequests({ session, amDisplayName }) {
  const [requests, setRequests]           = useState([]);
  const [companiesMap, setCompaniesMap]   = useState({});
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState("all");
  const [search, setSearch]               = useState("");
  const [selected, setSelected]           = useState(null);
  const [linesInvoiceMap, setLinesInvoiceMap] = useState({}); // sr_id → [{line_letter, status}]
  const [srServicesMap, setSrServicesMap]     = useState({}); // sr_id → {short, full, truncated}

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
    const smap = {};
    (invs || []).forEach(i => {
      if (!i.service_request_id) return;
      if (!imap[i.service_request_id]) imap[i.service_request_id] = [];
      imap[i.service_request_id].push({ line_letter: i.service_lines?.line_letter || "?", status: i.status });
      const sl = i.service_lines;
      const text = (sl?.service_name || "").trim();
      if (text) {
        if (!smap[i.service_request_id]) smap[i.service_request_id] = [];
        smap[i.service_request_id].push(`${sl.line_letter || "?"}: ${text}`);
      }
    });
    const servMap = {};
    for (const [id, parts] of Object.entries(smap)) {
      const full = parts.join(" · ");
      servMap[id] = amTruncateWords(full, 55);
    }
    setLinesInvoiceMap(imap);
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
      r.service_type?.toLowerCase().includes(q) ||
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
          <div className="page-sub">View and update service requests for your assigned companies</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      <div className="stats-row stats-5">
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{counts.all}</div></div>
        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value c-amber">{counts.pending}</div></div>
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
                <th>Last Updated</th>
                <th>SR #</th>
                <th>Company</th>
                <th>Vehicle</th>
                <th>VIN</th>
                <th>Service</th>
                <th>Service Status</th>
                <th>Billing Status</th>
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
                  <td className="mono">{r.vin || "—"}</td>
                  <td><SvcPreviewCell svc={srServicesMap[r.id]} /></td>
                  <td><SRStatusBadge status={r.status} /></td>
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
        <AMSRModal
          request={selected}
          companiesMap={companiesMap}
          linesInvoiceData={linesInvoiceMap[selected.id]}
          amDisplayName={amDisplayName}
          amEmail={session.user?.email}
          session={session}
          onClose={() => setSelected(null)}
          onUpdate={() => { load(); setSelected(null); }} />
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
    if (err || !data?.session) {
      setError(err?.message || "Invalid credentials.");
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "account_manager" } }).then(null, () => {});
      return;
    }
    const { data: amData, error: amErr } = await supabase
      .from("account_managers")
      .select("id, display_name")
      .eq("id", data.session.user.id)
      .single();
    if (amErr || !amData) {
      supabase.rpc("log_auth_event", { p_action: "login_failure", p_status: "failure", p_metadata: { email, portal: "account_manager", reason: "not_am" } }).then(null, () => {});
      await supabase.auth.signOut();
      setError("Access denied. This account does not have account manager privileges.");
      return;
    }
    supabase.rpc("log_auth_event", { p_action: "login_success", p_status: "success", p_metadata: { portal: "account_manager" } }).then(null, () => {});
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
  const navigate = useNavigate();
  const [session, setSession]         = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [tab, setTab]                 = useState(() => {
    const p = new URLSearchParams(window.location.search).get("tab");
    return ["requests","billing","companies","vehicles"].includes(p) ? p : "billing";
  });
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 768);
  const [loading, setLoading]         = useState(true);
  const [refreshKey, setRefreshKey]   = useState(0);
  const [hasUpdates, setHasUpdates]   = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!sess) { navigate("/"); return; }
      const { data: amRow } = await supabase.from("account_managers")
        .select("id, display_name").eq("id", sess.user.id).maybeSingle();
      if (!amRow) { navigate("/"); return; }
      setSession(sess);
      setDisplayName(amRow.display_name || null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!session) return;
    const mark = () => setHasUpdates(true);
    const channel = supabase.channel("am-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "service_requests" }, mark)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, mark)
      .on("postgres_changes", { event: "*", schema: "public", table: "service_lines" }, mark)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session]);

  const applyUpdates = () => { setHasUpdates(false); setRefreshKey(k => k + 1); };

  const handleLogout = async () => {
    supabase.rpc("log_auth_event", { p_action: "logout", p_status: "success", p_metadata: { portal: "account_manager" } }).then(null, () => {});
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleNav = (id) => {
    setTab(id);
    const url = new URL(window.location);
    url.searchParams.set("tab", id);
    window.history.replaceState({}, "", url);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  const navItems = [
    { id:"requests",  label:"Service Requests",  icon:<IcoWrench />   },
    { id:"billing",   label:"Billing",           icon:<IcoDollar />   },
    { id:"companies", label:"DSPs",               icon:<IcoBuilding /> },
    { id:"vehicles",  label:"Vehicle Registry",  icon:<IcoCar />      },
  ];

  const pageTitle = { requests:"Service Requests", billing:"Billing", companies:"DSPs", vehicles:"Vehicle Registry" };

  if (loading) return <style>{css}</style>;

  return (
    <>
      <style>{css}</style>
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
              {hasUpdates && (
                <button className="btn btn-sm" onClick={applyUpdates} style={{ background:"var(--blue-dim)", color:"#60a5fa", border:"1px solid rgba(59,130,246,0.3)" }}>
                  New updates — click to refresh
                </button>
              )}
            </div>
            <div className="main-content">
              {tab === "requests"  && <AMServiceRequests key={refreshKey} session={session} amDisplayName={displayName} />}
              {tab === "billing"   && <Billing key={refreshKey} amDisplayName={displayName} amEmail={session.user?.email} />}
              {tab === "companies" && <AMCompanies key={refreshKey} />}
              {tab === "vehicles"  && <AMVehicleRegistry key={refreshKey} amDisplayName={displayName} />}
            </div>
          </main>
      </div>
    </>
  );
}
