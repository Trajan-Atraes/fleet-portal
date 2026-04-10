import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";
import { SUBMISSION_TARGETS, TARGET_LABELS, INVOICE_STATUSES, INVOICE_STATUS_LABELS, HARD_FLOOR, DEFAULT_RATE, STATUS_LABELS, ssGet, ssSet } from "../lib/constants";

import NotesLog from "../components/NotesLog";
import LineItemsEditor, { servicestolineItems, computeLineItemTotals } from "../components/LineItemsEditor";
import { IcoPlus, IcoRefresh, IcoChevron, IcoSortAsc, IcoSortDesc, IcoSortNeutral } from "../components/Icons";

// ─── INVOICE STATUS BADGE ─────────────────────────────────────
function InvoiceStatusBadge({ status }) {
  const map = {
    draft:         { bg:"rgba(55,79,104,0.3)",    color:"#526a84", label:"Draft"         },
    submitted:     { bg:"rgba(245,158,11,0.12)",  color:"#fbbf24", label:"Submitted"     },
    approved:      { bg:"rgba(16,185,129,0.12)",  color:"#34d399", label:"Approved"      },
    rejected:      { bg:"rgba(239,68,68,0.12)",   color:"#f87171", label:"Rejected"      },
    revise:        { bg:"rgba(249,115,22,0.12)", color:"#fb923c", label:"Revise"        },
    client_billed:            { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Client Billed"    },
    paid:                     { bg:"rgba(16,185,129,0.22)",  color:"#6ee7b7", label:"Paid"             },
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
function InvoiceBuilder({ adminDisplayName, onSaved, onCancel }) {
  const [requests, setRequests]   = useState([]);
  const [companies, setCompanies] = useState([]);
  const [linkedReqId, setLinkedReqId] = useState("");
  const [linkedLineId, setLinkedLineId] = useState("");
  const [srLines, setSrLines] = useState([]);
  const [form, setForm] = useState({
    company_id:"", vehicle_id:"", vin:"", vehicle_make:"", vehicle_model:"", vehicle_year:"",
    bill_to_id:"",
    taxType:"pct", taxValue:"8.25",
    discountType:"none", discountValue:"0",
  });
  const [lineItems, setLineItems] = useState([
    { service: "", description: "", qty: "1", rate: "", taxable: false },
  ]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [isIncognito, setIsIncognito] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
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
    supabase.from("service_lines").select("id, line_letter, service_name, notes, parts, is_completed, updated_by_name").eq("sr_id", reqId).order("line_letter")
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
      bill_to_id:    billToId        || p.bill_to_id,
    }));
  };

  const vehicleType = [form.vehicle_make, form.vehicle_model].filter(Boolean).join(" ") || form.vehicle_id || "";

  const settings = { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue };
  const totals = computeLineItemTotals(lineItems, settings);

  const handleSave = async (submitNow) => {
    setSaving(true); setError("");
    const { data: { session } } = await supabase.auth.getSession();
    const selectedBillTo = billToContacts.find(c => c.id === form.bill_to_id) || null;
    const derivedSvcType = lineItems[0]?.service || null;
    const { error: err } = await supabase.from("invoices").insert({
      service_request_id: linkedReqId || null,
      service_line_id:    linkedLineId || null,
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
      parts_cost:         totals.afterDiscount,
      diagnostic_fee:     0,
      tax:                totals.taxAmt,
      line_items:         { lineItems, settings },
      status:             submitNow ? "submitted" : "draft",
      is_incognito:       isIncognito,
      created_by:         session?.user?.id,
      updated_by_name:    adminDisplayName || "Admin",
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
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer", userSelect:"none",
            padding:"4px 10px", borderRadius:4, fontSize:12, fontWeight:600,
            background: isIncognito ? "rgba(107,114,128,0.15)" : "transparent",
            border: isIncognito ? "1px solid rgba(107,114,128,0.4)" : "1px solid transparent",
            color: isIncognito ? "var(--text)" : "var(--dim)",
          }}>
            <input type="checkbox" checked={isIncognito} onChange={e => setIsIncognito(e.target.checked)}
              style={{ accentColor:"#6b7280", cursor:"pointer", width:14, height:14 }} />
            Incognito
          </label>
          <button className="btn btn-ghost btn-sm" onClick={onCancel}>← Back</button>
        </div>
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
                  {r.request_number} · {r.vehicle_id}{companyName(r.company_id) ? ` — ${companyName(r.company_id)}` : ""}
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
            {linkedReqId
              ? <input value={companies.find(c => c.id === form.company_id)?.name || ""} readOnly style={{ opacity:0.7, cursor:"default" }} placeholder="—" />
              : <select value={form.company_id} onChange={e => f("company_id", e.target.value)}>
                  <option value="">— Select —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            }
          </div>
          <div className="field">
            <label>Vehicle ID / Unit #</label>
            {linkedReqId
              ? <input value={form.vehicle_id} readOnly style={{ opacity:0.7, cursor:"default" }} placeholder="UNIT-042" />
              : <input value={form.vehicle_id} onChange={e => f("vehicle_id", e.target.value)} placeholder="UNIT-042" />
            }
          </div>
          <div className="field">
            <label>VIN</label>
            {linkedReqId
              ? <input value={form.vin} readOnly style={{ opacity:0.7, cursor:"default" }} placeholder="1HGBH41JXMN109186" />
              : <input value={form.vin} onChange={e => f("vin", e.target.value)} placeholder="1HGBH41JXMN109186" />
            }
          </div>
          <div className="field">
            <label>Model</label>
            {linkedReqId
              ? <input value={form.vehicle_model} readOnly style={{ opacity:0.7, cursor:"default" }} placeholder="F-150" />
              : <input value={form.vehicle_model} onChange={e => f("vehicle_model", e.target.value)} placeholder="F-150" />
            }
          </div>
        </div>
        <div className="form-grid" style={{ marginBottom:0 }}>
          <div className="field" style={{ marginBottom:0 }}>
            <label>Bill To</label>
            {linkedReqId
              ? <input value={billToContacts.find(c => c.id === form.bill_to_id)?.name || ""} readOnly style={{ opacity:0.7, cursor:"default" }} placeholder="—" />
              : <select value={form.bill_to_id} onChange={e => f("bill_to_id", e.target.value)}>
                  <option value="">— None —</option>
                  {billToContacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            }
          </div>
          <div className="field" style={{ marginBottom:0 }}>
            <label>RO #</label>
            <input value={form.ro_number} onChange={e => f("ro_number", e.target.value)} placeholder="Enter repair order #" />
          </div>
        </div>
      </div>

      {/* Linked Service Line Info */}
      {(() => {
        const linkedLine = linkedLineId ? srLines.find(l => l.id === linkedLineId) : null;
        if (!linkedLine) return null;
        const parts = Array.isArray(linkedLine.parts) ? linkedLine.parts : [];
        return (
          <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:6, padding:"12px 16px", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.15em", color: linkedLine.is_completed ? "var(--green)" : "var(--accent)" }}>
                Line {linkedLine.line_letter} {linkedLine.is_completed ? "— Completed" : "— In Progress"} ///
              </div>
            </div>
            {linkedLine.service_name && (
              <div style={{ marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Service: </span>
                <span style={{ fontSize:13, color:"var(--text)" }}>{linkedLine.service_name}</span>
              </div>
            )}
            {linkedLine.notes && (
              <div style={{ marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Notes: </span>
                <span style={{ fontSize:12, color:"var(--body)", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{linkedLine.notes}</span>
              </div>
            )}
            {parts.length > 0 && (
              <div>
                <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Parts: </span>
                <span style={{ fontSize:12, color:"var(--body)" }}>{parts.join(", ")}</span>
              </div>
            )}
            {linkedLine.updated_by_name && (
              <div style={{ fontSize:10, color:"var(--dim)", marginTop:6, fontStyle:"italic" }}>Last edited by {linkedLine.updated_by_name}</div>
            )}
          </div>
        );
      })()}

      {/* Price intelligence */}
      <PriceIntelPanel
        serviceType={lineItems[0]?.service || ""}
        vehicleType={vehicleType}
        target={(billToContacts.find(c => c.id === form.bill_to_id) || null)?.name || ""}
      />

      {/* Line Items */}
      <div className="card" style={{ marginBottom:12 }}>
        <LineItemsEditor lineItems={lineItems} onChange={setLineItems} canSavePresets={true} />

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
              <span style={{ fontSize:11, color:"var(--muted)" }}>Line Items</span>
              <span style={{ fontSize:11, color:"var(--soft)" }}>${totals.itemsTotal.toFixed(2)}</span>
            </div>
            {totals.discountAmt > 0 && <>
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Discount{form.discountType==="pct" ? ` (${form.discountValue}%)` : ""}</span>
                <span style={{ fontSize:11, color:"#f87171" }}>-${totals.discountAmt.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>After Discount</span>
                <span style={{ fontSize:11, color:"var(--soft)" }}>${totals.afterDiscount.toFixed(2)}</span>
              </div>
            </>}
            <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
              <span style={{ fontSize:11, color:"var(--muted)" }}>Tax{form.taxType==="pct" ? ` (${form.taxValue}%)` : ""}</span>
              <span style={{ fontSize:11, color:"var(--soft)" }}>${totals.taxAmt.toFixed(2)}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", height:32, alignItems:"center" }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", color:"var(--snow)" }}>Total</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:"var(--accent)" }}>${totals.grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving}>{saving?"Saving…":"Save Draft"}</button>
        <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving}>
          {saving ? "Submitting…" : "Submit Invoice"}
        </button>
      </div>
    </div>
  );
}

// ─── INVOICE MODAL ────────────────────────────────────────────
function InvoiceModal({ invoice, companies, requestsStatusMap, requestsMap, requestsMileageMap, billToContacts, adminDisplayName, onClose, onSaveAndClose, onSaveAndStay, onDelete }) {
  const savedSettings = (!Array.isArray(invoice.line_items) && invoice.line_items?.settings) ? invoice.line_items.settings : null;
  const [form, setForm] = useState({
    company_id:   invoice.company_id   || "",
    vehicle_id:   invoice.vehicle_id   || "",
    vin:          invoice.vin          || "",
    vehicle_make: invoice.vehicle_make || "",
    vehicle_model:invoice.vehicle_model|| "",
    vehicle_year: invoice.vehicle_year || "",
    bill_to_id:   invoice.bill_to_id   || "",
    ro_number:    invoice.ro_number   || "",
    taxType:      savedSettings?.taxType      || "pct",
    taxValue:     savedSettings?.taxValue     || "8.25",
    discountType: savedSettings?.discountType || "none",
    discountValue:savedSettings?.discountValue || "0",
  });
  const [lineItems, setLineItems] = useState(() => servicestolineItems(invoice.line_items));
  const [status,    setStatus]    = useState(invoice.status);
  const [rejReason, setRejReason] = useState(invoice.rejection_reason || "");
  const [invoiceNotes, setInvoiceNotes] = useState(invoice.notes || "");
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState("");
  const [downloading, setDownloading] = useState(false);
  const [confirmDelete,      setConfirmDelete]      = useState(false);
  const [deleting,           setDeleting]           = useState(false);
  const [linkedLine, setLinkedLine] = useState(null);
  const [confirmReversePaid, setConfirmReversePaid] = useState(false);
  const [reversing,          setReversing]          = useState(false);
  const modalBodyRef = useRef(null);

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // Scroll modal to top on open
  useEffect(() => { modalBodyRef.current?.scrollTo(0, 0); }, []);

  // ─── Auto-save (debounced 1.5s) ───
  const autoSaveRef = useRef(null);
  const autoSavingRef = useRef(false);
  const initialRender = useRef(true);
  // Refs to hold latest values so the debounced persist always reads current data
  const formRef = useRef(form);
  const lineItemsRef = useRef(lineItems);
  const statusRef = useRef(status);
  const rejReasonRef = useRef(rejReason);
  const notesRef = useRef(invoiceNotes);
  formRef.current = form;
  lineItemsRef.current = lineItems;
  statusRef.current = status;
  rejReasonRef.current = rejReason;
  notesRef.current = invoiceNotes;

  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return; }
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => { if (!autoSavingRef.current) autoSavePersist(); }, 1500);
    return () => clearTimeout(autoSaveRef.current);
  }, [form, lineItems, status, rejReason, invoiceNotes]);

  useEffect(() => () => clearTimeout(autoSaveRef.current), []);

  // Fetch linked service line details
  useEffect(() => {
    if (!invoice.service_line_id) return;
    let cancelled = false;
    supabase.from("service_lines")
      .select("line_letter, service_name, notes, parts, is_completed, updated_by_name")
      .eq("id", invoice.service_line_id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled && data) setLinkedLine(data); });
    return () => { cancelled = true; };
  }, [invoice.service_line_id]);

  const autoSavePersist = async () => {
    if (autoSavingRef.current) return;
    autoSavingRef.current = true;
    setError("");
    const f = formRef.current;
    const li = lineItemsRef.current;
    const st = statusRef.current;
    const rr = rejReasonRef.current;
    const nt = notesRef.current;
    const selectedBillTo = (billToContacts||[]).find(c => c.id === f.bill_to_id) || null;
    const curSettings = { taxType: f.taxType, taxValue: f.taxValue, discountType: f.discountType, discountValue: f.discountValue };
    const t = computeLineItemTotals(li, curSettings);

    const updates = {
      company_id:        f.company_id || null,
      vehicle_id:        f.vehicle_id,
      vin:               f.vin || null,
      vehicle_make:      f.vehicle_make,
      vehicle_model:     f.vehicle_model,
      vehicle_year:      f.vehicle_year,
      service_type:      li[0]?.service || null,
      bill_to_id:        f.bill_to_id || null,
      submission_target: selectedBillTo ? selectedBillTo.name : (invoice.submission_target || null),
      labor_hours:       0,
      labor_rate:        DEFAULT_RATE,
      parts_cost:        Math.max(t.afterDiscount, 0),
      diagnostic_fee:    0,
      tax:               t.taxAmt,
      ro_number:         f.ro_number || null,
      notes:             nt.trim() || null,
      line_items:        { lineItems: li, settings: curSettings },
      status:            st,
      updated_by_name:   adminDisplayName || "Admin",
    };
    if (st === "rejected") updates.rejection_reason = rr;
    const { error: err } = await supabase.from("invoices").update(updates).eq("id", invoice.id);
    if (err) setError(err.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 1500); }
    autoSavingRef.current = false;
  };

  const modalSettings = { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue };
  const totals = computeLineItemTotals(lineItems, modalSettings);

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

  const handleDownloadPdf = async (brand = "wheels") => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) { setError("Not signed in — please refresh and try again."); setDownloading(false); return; }

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-invoice-pdf`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
        body:    JSON.stringify({ invoice_id: invoice.id, brand }),
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


  const handleReversePaid = async () => {
    setReversing(true); setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) { setError("Not signed in."); setReversing(false); return; }

      // Find the most recent completed square_payment record for this invoice
      const { data: payments } = await supabase
        .from("square_payments")
        .select("id")
        .eq("invoice_id", invoice.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1);

      if (payments?.length) {
        // Reverse via Square edge function
        const res = await fetch(`${SUPABASE_URL}/functions/v1/reverse-payment`, {
          method:  "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${jwt}` },
          body:    JSON.stringify({ square_payment_record_id: payments[0].id }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) { setError(body.error || "Reversal failed"); setReversing(false); return; }
      } else {
        // No Square payment on record — just reset the status directly
        const { error: err } = await supabase.from("invoices").update({ status: "client_billed", updated_by_name: adminDisplayName || "Admin" }).eq("id", invoice.id);
        if (err) { setError(err.message); setReversing(false); return; }
      }

      setReversing(false);
      setConfirmReversePaid(false);
      setSaved(true);
      setTimeout(() => { setSaved(false); onSaveAndClose(); }, 1200);
    } catch (e) {
      setError("Reversal failed — check your connection and try again.");
      setReversing(false);
    }
  };



  const handleSave = async (closeAfter = false) => {
    setSaving(true); setError("");
    const selectedBillTo = (billToContacts||[]).find(c => c.id === form.bill_to_id) || null;
    const saveSettings = { taxType: form.taxType, taxValue: form.taxValue, discountType: form.discountType, discountValue: form.discountValue };
    const saveTotals = computeLineItemTotals(lineItems, saveSettings);
    const updates = {
      company_id:        form.company_id || null,
      vehicle_id:        form.vehicle_id,
      vin:               form.vin || null,
      vehicle_make:      form.vehicle_make,
      vehicle_model:     form.vehicle_model,
      vehicle_year:      form.vehicle_year,
      service_type:      lineItems[0]?.service || null,
      bill_to_id:        form.bill_to_id || null,
      submission_target: selectedBillTo ? selectedBillTo.name : (invoice.submission_target || null),
      labor_hours:       0,
      labor_rate:        DEFAULT_RATE,
      parts_cost:        saveTotals.afterDiscount,
      diagnostic_fee:    0,
      tax:               saveTotals.taxAmt,
      ro_number:         form.ro_number || null,
      notes:             invoiceNotes.trim() || null,
      line_items:        { lineItems, settings: saveSettings },
      status,
      updated_by_name:   adminDisplayName || "Admin",
    };
    if (status === "rejected") updates.rejection_reason = rejReason;
    const { error: err } = await supabase.from("invoices").update(updates).eq("id", invoice.id);
    if (err) { setError(err.message); setSaving(false); return; }
    const wasUnresolved = !["approved","rejected"].includes(invoice.status);
    const isResolved    = status === "approved" || status === "rejected";
    if (wasUnresolved && isResolved) {
      const vehicleType = [form.vehicle_make, form.vehicle_model].filter(Boolean).join(" ") || form.vehicle_id || "Unknown";
      await supabase.from("pricing_history").insert({
        invoice_id: invoice.id, service_type: lineItems[0]?.service || "Unknown",
        vehicle_type: vehicleType, submission_target: updates.submission_target || "Unknown",
        submitted_amount: saveTotals.grandTotal, outcome: status,
      });
    }
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); closeAfter ? onSaveAndClose() : onSaveAndStay(); }, 1200);
  };

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h3 style={{ display:"flex", alignItems:"center", gap:8 }}>Edit Invoice
              {invoice.is_incognito && (
                <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"2px 8px", borderRadius:3,
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em",
                  textTransform:"uppercase", background:"rgba(107,114,128,0.15)", color:"#9ca3af",
                  border:"1px solid rgba(107,114,128,0.3)" }}>Incognito</span>
              )}
            </h3>
            <div className="modal-head-sub" style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
              <span>{companies.find(c => c.id === form.company_id)?.name || "—"} · Created {new Date(invoice.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
              {invoice.service_request_id && requestsMap?.[invoice.service_request_id] ? (
                <span style={{ display:"inline-flex", alignItems:"center", gap:6 }}>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>
                    Invoice #{requestsMap[invoice.service_request_id]}{invoice.service_lines?.line_letter ? `-${invoice.service_lines.line_letter}` : ""}
                  </span>
                  {(() => {
                    const done = invoice.service_lines != null ? invoice.service_lines.is_completed : invoice._mergedComplete;
                    if (done == null) return null;
                    return done
                      ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 6px", height:16, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(16,185,129,0.12)", color:"#34d399" }}>Complete</span>
                      : <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 6px", height:16, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:9, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(245,158,11,0.12)", color:"#fbbf24" }}>In Progress</span>;
                  })()}
                </span>
              ) : invoice.invoice_number ? (
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--soft)", letterSpacing:"0.05em" }}>
                  Invoice #{invoice.invoice_number}
                </span>
              ) : null}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" ref={modalBodyRef}>
          {error && <div className="error-box">{error}</div>}

          {/* Vehicle & service */}
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:8 }}>Vehicle & Service</div>
          <div className="form-grid" style={{ marginBottom:8 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label>DSP</label>
              <input value={companies.find(c => c.id === form.company_id)?.name || ""} readOnly style={{ opacity:0.7, cursor:"default" }} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Vehicle ID / Unit #</label>
              <input value={form.vehicle_id} readOnly style={{ opacity:0.7, cursor:"default" }} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>VIN</label>
              <input value={form.vin} readOnly style={{ opacity:0.7, cursor:"default" }} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Model</label>
              <input value={form.vehicle_model} readOnly style={{ opacity:0.7, cursor:"default" }} />
            </div>
            {invoice.service_request_id && requestsMileageMap?.[invoice.service_request_id] != null && (
              <div className="field" style={{ marginBottom:0 }}>
                <label>Mileage</label>
                <input value={requestsMileageMap[invoice.service_request_id]} readOnly style={{ opacity:0.7, cursor:"default" }} />
              </div>
            )}
          </div>
          <div className="form-grid" style={{ marginBottom:14 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Bill To</label>
              <input value={(billToContacts||[]).find(c => c.id === form.bill_to_id)?.name || ""} readOnly style={{ opacity:0.7, cursor:"default" }} />
            </div>
            <div className="field" style={{ marginBottom:0 }}>
              <label>RO #</label>
              <input value={form.ro_number} onChange={e => f("ro_number", e.target.value)} placeholder="Enter repair order #" />
            </div>
          </div>

          {/* Linked Service Line Info */}
          {linkedLine && (
            <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:6, padding:"12px 16px", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.15em", color: linkedLine.is_completed ? "var(--green)" : "var(--accent)" }}>
                  Line {linkedLine.line_letter} {linkedLine.is_completed ? "— Completed" : "— In Progress"} ///
                </div>
              </div>
              {linkedLine.service_name && (
                <div style={{ marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Service: </span>
                  <span style={{ fontSize:13, color:"var(--text)" }}>{linkedLine.service_name}</span>
                </div>
              )}
              {linkedLine.notes && (
                <div style={{ marginBottom:6 }}>
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Notes: </span>
                  <span style={{ fontSize:12, color:"var(--body)", lineHeight:1.5, whiteSpace:"pre-wrap" }}>{linkedLine.notes}</span>
                </div>
              )}
              {Array.isArray(linkedLine.parts) && linkedLine.parts.length > 0 && (
                <div>
                  <span style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Parts: </span>
                  <span style={{ fontSize:12, color:"var(--body)" }}>{linkedLine.parts.join(", ")}</span>
                </div>
              )}
              {linkedLine.updated_by_name && (
                <div style={{ fontSize:10, color:"var(--dim)", marginTop:6, fontStyle:"italic" }}>Last edited by {linkedLine.updated_by_name}</div>
              )}
            </div>
          )}

          <hr className="divider" />

          {/* Line Items */}
          <LineItemsEditor lineItems={lineItems} onChange={setLineItems} canSavePresets={true} />

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
                <span style={{ fontSize:11, color:"var(--muted)" }}>Line Items</span>
                <span style={{ fontSize:11, color:"var(--soft)" }}>${totals.itemsTotal.toFixed(2)}</span>
              </div>
              {totals.discountAmt > 0 && <>
                <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>Discount{form.discountType==="pct" ? ` (${form.discountValue}%)` : ""}</span>
                  <span style={{ fontSize:11, color:"#f87171" }}>-${totals.discountAmt.toFixed(2)}</span>
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                  <span style={{ fontSize:11, color:"var(--muted)" }}>After Discount</span>
                  <span style={{ fontSize:11, color:"var(--soft)" }}>${totals.afterDiscount.toFixed(2)}</span>
                </div>
              </>}
              <div style={{ display:"flex", justifyContent:"space-between", height:22, alignItems:"center", borderBottom:"1px solid rgba(28,45,66,0.4)" }}>
                <span style={{ fontSize:11, color:"var(--muted)" }}>Tax{form.taxType==="pct" ? ` (${form.taxValue}%)` : ""}</span>
                <span style={{ fontSize:11, color:"var(--soft)" }}>${totals.taxAmt.toFixed(2)}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", height:32, alignItems:"center" }}>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, textTransform:"uppercase", color:"var(--snow)" }}>Total</span>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, fontWeight:900, color:"var(--accent)" }}>${totals.grandTotal.toFixed(2)}</span>
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
          {status === "rejected" && (
            <button className="btn btn-sm" style={{ background:"rgba(249,115,22,0.15)", color:"#fb923c", border:"1px solid rgba(249,115,22,0.3)", marginBottom:8 }}
              onClick={async () => {
                const { error: err } = await supabase.from("invoices").update({ status: "revise", updated_by_name: adminDisplayName || "Admin" }).eq("id", invoice.id);
                if (err) setError(err.message);
                else { setStatus("revise"); setSaved(true); setTimeout(() => setSaved(false), 1500); }
              }}>
              Request Revision
            </button>
          )}


          {/* Invoice Notes (appears on PDF) */}
          <div className="field">
            <label>Invoice Notes <span style={{ fontSize:10, color:"var(--dim)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>— appears on PDF</span></label>
            <textarea value={invoiceNotes} onChange={e => setInvoiceNotes(e.target.value)} placeholder="Optional notes to include on the invoice PDF" rows={2}
              style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"6px 10px", fontSize:12, color:"var(--text)", outline:"none", fontFamily:"'Barlow',sans-serif", resize:"vertical", width:"100%" }} />
          </div>

          <NotesLog srId={invoice.service_request_id || null} currentUserName={adminDisplayName || "Admin"} isAdmin={true} canSetClientVisible={true} />

          {saved  && <div className="success-box">Saved.</div>}

          {/* Reverse paid confirmation */}
          {confirmReversePaid && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10 }}>
              <div style={{ fontSize:13, color:"var(--body)", marginBottom:8 }}>
                <strong style={{ color:"#ef4444" }}>Reverse this payment?</strong>{" "}
                The invoice will return to Client Billed status. If a Square payment exists, a refund will be issued.
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReversePaid(false)} disabled={reversing}>Cancel</button>
                <button className="btn btn-sm" style={{ background:"#ef4444", color:"#fff" }} onClick={handleReversePaid} disabled={reversing}>{reversing?"Reversing…":"Confirm Reversal"}</button>
              </div>
            </div>
          )}

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
            <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf("wheels")} disabled={downloading} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloading ? "Generating…" : "Wheels PDF"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf("element")} disabled={downloading} style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                {downloading ? "Generating…" : "Element PDF"}
              </button>
              {/* Reverse Paid — admin only, visible when invoice is paid */}
              {invoice.status === "paid" && !confirmReversePaid && !confirmDelete && (
                <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444", borderColor:"rgba(239,68,68,0.35)" }} onClick={() => setConfirmReversePaid(true)}>Reverse Paid</button>
              )}
              {!confirmDelete && !confirmReversePaid
                ? <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444", borderColor:"rgba(239,68,68,0.35)" }} onClick={() => setConfirmDelete(true)}>Delete Record</button>
                : confirmDelete
                  ? <>
                      <button className="btn btn-ghost btn-sm" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
                      <button className="btn btn-sm" style={{ background:"#ef4444", color:"#fff" }} onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting…" : "Confirm Delete"}</button>
                    </>
                  : null
              }
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button className="btn btn-ghost" onClick={() => handleSave(false)} disabled={saving||confirmReversePaid||confirmDelete}>{saving ? "Saving…" : "Save & Stay"}</button>
              <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={saving||confirmReversePaid||confirmDelete}>{saving ? "Saving…" : "Save & Close"}</button>
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
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
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
const INV_STATUS_ORDER = { draft:0, submitted:1, approved:2, rejected:3, revise:4, client_billed:5, paid:6 };
const LINE_COMPLETE_ORDER = { true:1, false:0, null:2 };

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

// ─── MERGE INVOICES MODAL ─────────────────────────────────────
function MergeModal({ invoices, companiesMap, requestsMap, adminDisplayName, onClose, onMerged }) {
  const [primaryId, setPrimaryId] = useState(invoices[0]?.id || "");
  const [confirming, setConfirming] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState("");

  const srIds = [...new Set(invoices.map(i => i.service_request_id).filter(Boolean))];
  const multiSR = srIds.length > 1;

  const handleMerge = async () => {
    if (!confirming) { setConfirming(true); return; }
    setMerging(true); setError("");
    const primary = invoices.find(i => i.id === primaryId);
    const secondaries = invoices.filter(i => i.id !== primaryId);

    // Combine line items
    const allLineItems = [];
    const primaryLI = parsePrimaryLineItems(primary.line_items);
    allLineItems.push(...primaryLI.items);
    for (const sec of secondaries) {
      const secLI = parsePrimaryLineItems(sec.line_items);
      allLineItems.push(...secLI.items);
    }

    // Use primary's settings
    const settings = primaryLI.settings;
    const totals = computeLineItemTotals(allLineItems, settings);

    // Combine notes
    const notesParts = invoices
      .filter(i => i.notes?.trim())
      .map(i => {
        const ref = i.service_request_id && requestsMap[i.service_request_id]
          ? `[${requestsMap[i.service_request_id]}${i.service_lines?.line_letter ? `-${i.service_lines.line_letter}` : ""}]`
          : "";
        return `${ref} ${i.notes.trim()}`.trim();
      });
    const mergedNotes = notesParts.join("\n") || null;

    // RO# fallback
    const roNumber = primary.ro_number || secondaries.find(s => s.ro_number)?.ro_number || null;

    // Update primary
    const { error: upErr } = await supabase.from("invoices").update({
      line_items: { lineItems: allLineItems, settings },
      parts_cost: totals.afterDiscount,
      tax: totals.taxAmt,
      service_line_id: null,
      notes: mergedNotes,
      ro_number: roNumber,
      status: "draft",
      updated_by_name: adminDisplayName || "Admin",
    }).eq("id", primaryId);

    if (upErr) { setError(upErr.message); setMerging(false); return; }

    // Delete secondaries
    for (const sec of secondaries) {
      const { error: delErr } = await supabase.from("invoices").delete().eq("id", sec.id);
      if (delErr) { setError(`Failed to delete invoice: ${delErr.message}`); setMerging(false); return; }
    }

    setMerging(false);
    onMerged();
  };

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:560 }}>
        <div className="modal-head">
          <div>
            <h3>Merge {invoices.length} Invoices</h3>
            <div className="modal-head-sub">Combine line items into one invoice</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {multiSR && (
            <div style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, padding:"8px 12px", marginBottom:12, fontSize:12, color:"var(--body)" }}>
              These invoices span <strong style={{ color:"var(--accent)" }}>{srIds.length} service requests</strong> ({srIds.map(id => requestsMap[id] || "?").join(", ")}). Secondary SRs will not be modified — close or cancel them manually after merging.
            </div>
          )}

          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Select Primary Invoice</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
            {invoices.map(inv => {
              const ref = inv.service_request_id && requestsMap[inv.service_request_id]
                ? `${requestsMap[inv.service_request_id]}${inv.service_lines?.line_letter ? `-${inv.service_lines.line_letter}` : ""}`
                : "—";
              const itemCount = parsePrimaryLineItems(inv.line_items).items.length;
              return (
                <label key={inv.id} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderRadius:6, cursor:"pointer",
                  border: primaryId === inv.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                  background: primaryId === inv.id ? "rgba(245,158,11,0.06)" : "var(--plate)",
                }}>
                  <input type="radio" name="primary" value={inv.id} checked={primaryId === inv.id} onChange={() => setPrimaryId(inv.id)}
                    style={{ accentColor:"var(--accent)" }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)" }}>Invoice #{ref}</div>
                    <div style={{ fontSize:11, color:"var(--muted)" }}>
                      {inv.vehicle_id || "—"} · {itemCount} line item{itemCount !== 1 ? "s" : ""} · ${Number(inv.total || 0).toFixed(2)}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ fontSize:11, color:"var(--dim)", marginBottom:10 }}>
            The primary invoice will keep its vehicle info, bill-to, and tax settings. All line items from secondary invoices will be added. Secondary invoices will be deleted. The merged invoice will reset to Draft.
          </div>

          {error && <div className="error-box">{error}</div>}

          {confirming && (
            <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10, fontSize:13, color:"var(--body)" }}>
              <strong style={{ color:"#ef4444" }}>This cannot be undone.</strong> {invoices.length - 1} invoice{invoices.length - 1 > 1 ? "s" : ""} will be permanently deleted.
            </div>
          )}

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleMerge} disabled={merging}>
              {merging ? "Merging…" : confirming ? "Confirm Merge" : "Merge Invoices"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to parse line items for merge
function parsePrimaryLineItems(li) {
  if (!li) return { items: [{ service:"", description:"", qty:"1", rate:"", taxable:false }], settings: { taxType:"pct", taxValue:"8.25", discountType:"none", discountValue:"0" } };
  const obj = li;
  if (!Array.isArray(obj) && obj.lineItems) {
    return { items: obj.lineItems, settings: obj.settings || { taxType:"pct", taxValue:"8.25", discountType:"none", discountValue:"0" } };
  }
  // Fallback: convert via servicestolineItems
  return { items: servicestolineItems(li), settings: { taxType:"pct", taxValue:"8.25", discountType:"none", discountValue:"0" } };
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
    if (col === "service_status")  { va = LINE_COMPLETE_ORDER[a.service_lines?.is_completed ?? a._mergedComplete]??99; vb = LINE_COMPLETE_ORDER[b.service_lines?.is_completed ?? b._mergedComplete]??99; return m*(va-vb); }
    if (col === "status")          { va = INV_STATUS_ORDER[a.status]??99; vb = INV_STATUS_ORDER[b.status]??99; return m*(va-vb); }
    va = (a[col]||"").toLowerCase(); vb = (b[col]||"").toLowerCase();
    return m * va.localeCompare(vb, undefined, { numeric: true });
  });
}

// ─── PAGINATION ──────────────────────────────────────────────
const INV_PAGE_SIZE = 25;

function InvPagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"12px 0 4px" }}>
      <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"0 8px", minWidth:28 }} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>←</button>
      {pages.map((p, i) =>
        p === "…" ? <span key={`e${i}`} style={{ fontSize:11, color:"var(--dim)", padding:"0 4px" }}>…</span>
        : <button key={p} className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"0 8px", minWidth:28, ...(p === page ? { background:"var(--accent)", color:"#000", borderColor:"var(--accent)" } : {}) }} onClick={() => onPageChange(p)}>{p}</button>
      )}
      <button className="btn btn-ghost btn-sm" style={{ fontSize:11, padding:"0 8px", minWidth:28 }} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>→</button>
    </div>
  );
}

// ─── INVOICE TABLE (reusable for both sections) ──────────────
function InvoiceTable({ rows, companiesMap, requestsMap, requestsStatusMap, getBillToLabel, sortCol, sortDir, onSort, onSelect, onServiceFilter, onTargetFilter, selectedIds, onToggleSelect, archiveSelectedIds, onToggleArchive, onToggleArchiveAll, archiveAllSelected, onUnarchive }) {
  const sorted = sortInvRows(rows, sortCol, sortDir, companiesMap, requestsMap, requestsStatusMap, getBillToLabel);
  const showArchiveCheckbox = !!onToggleArchive;
  const showUnarchive = !!onUnarchive;
  if (sorted.length === 0) return (
    <div className="empty-state" style={{ padding:"32px 24px" }}>
      <h3>No invoices found</h3>
      <p>Try adjusting your filter or search.</p>
    </div>
  );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {selectedIds && <th style={{ width:32, padding:"6px 4px" }}></th>}
            {showArchiveCheckbox && <th style={{ width:32, padding:"6px 4px", textAlign:"center" }}>
              <input type="checkbox" checked={archiveAllSelected} onChange={onToggleArchiveAll} title="Select all paid for archive" />
            </th>}
            <SortTh col="created_at"     label="Date"           sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="updated_at"     label="Last Updated"   sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="invoice_num"    label="Invoice #"      sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="company"        label="Company"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="vehicle_id"     label="Vehicle"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="ro_number"      label="RO #"           sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="service_type"   label="Service"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="bill_to"        label="Bill To"        sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="total"          label="Total"          sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="service_status" label="Service Status" sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <SortTh col="status"         label="Status"         sortCol={sortCol} sortDir={sortDir} onSort={onSort} />
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(inv => (
            <tr key={inv.id} onClick={() => onSelect(inv)} style={inv.archived_at ? { opacity: 0.7 } : undefined}>
              {selectedIds && <td style={{ padding:"6px 4px", textAlign:"center" }} onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(inv.id)} onChange={() => onToggleSelect(inv.id)}
                  style={{ accentColor:"var(--accent)", cursor:"pointer", width:15, height:15 }} />
              </td>}
              {showArchiveCheckbox && <td style={{ padding:"6px 4px", textAlign:"center" }} onClick={e => e.stopPropagation()}>
                {inv.status === "paid" ? (
                  <input type="checkbox" checked={archiveSelectedIds?.has(inv.id)} onChange={() => onToggleArchive(inv.id)}
                    style={{ accentColor:"var(--accent)", cursor:"pointer", width:15, height:15 }} />
                ) : <span />}
              </td>}
              <td style={{ color:"var(--body)", whiteSpace:"nowrap", fontSize:11 }}>
                {new Date(inv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
              </td>
              <td style={{ color:"var(--body)", fontSize:11 }}>
                {inv.updated_at ? <>
                  <div style={{ whiteSpace:"nowrap" }}>{new Date(inv.updated_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) + " " + new Date(inv.updated_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
                  {inv.updated_by_name && <div style={{ fontSize:10, color:"var(--dim)", marginTop:1 }}>{inv.updated_by_name}</div>}
                </> : "—"}
              </td>
              <td>
                {inv.service_request_id && requestsMap[inv.service_request_id]
                  ? <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color: inv.is_incognito ? "var(--dim)" : "var(--accent)", letterSpacing:"0.05em" }}>
                      {requestsMap[inv.service_request_id]}{inv.service_lines?.line_letter ? `-${inv.service_lines.line_letter}` : ""}
                    </span>
                  : inv.invoice_number
                    ? <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color: inv.is_incognito ? "var(--dim)" : "var(--soft)", letterSpacing:"0.05em" }}>
                        {inv.invoice_number}
                      </span>
                    : <span style={{ color:"var(--muted)" }}>—</span>}
              </td>
              <td style={{ fontWeight:600, fontSize:13 }}>{companiesMap[inv.company_id] || "—"}</td>
              <td>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase", color:"var(--snow)" }}>{inv.vehicle_id || "—"}</span>
                {(inv.vehicle_make||inv.vehicle_model) && (
                  <span style={{ color:"var(--soft)", fontSize:11, marginLeft:8 }}>
                    {[inv.vehicle_year,inv.vehicle_make,inv.vehicle_model].filter(Boolean).join(" ")}
                  </span>
                )}
              </td>
              <td style={{ fontFamily:"monospace", fontSize:11, letterSpacing:"0.03em", color:"var(--body)" }}>{inv.ro_number || <span style={{ color:"var(--dim)" }}>—</span>}</td>
              <td style={{ fontSize:12, color:"var(--text)" }}>
                {(() => {
                  const svcLabel = inv.service_lines?.service_name || inv.service_type || null;
                  return svcLabel
                    ? <span className="clickable-val" onClick={e => { e.stopPropagation(); onServiceFilter?.(svcLabel); }}>{svcLabel}</span>
                    : <span style={{ color:"var(--dim)" }}>—</span>;
                })()}
              </td>
              <td style={{ fontSize:12, color:"var(--text)" }}>
                {(() => {
                  const label = getBillToLabel(inv);
                  const filterVal = inv.bill_to_id || inv.submission_target;
                  return label
                    ? <span className="clickable-val" onClick={e => { e.stopPropagation(); onTargetFilter?.(filterVal); }}>{label}</span>
                    : <span style={{ color:"var(--dim)" }}>—</span>;
                })()}
              </td>
              <td>
                <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, color:"var(--accent)" }}>
                  ${Number(inv.total||0).toFixed(2)}
                </span>
              </td>
              <td>{(() => {
                const done = inv.service_lines != null ? inv.service_lines.is_completed : inv._mergedComplete;
                if (done == null) return <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>;
                return done
                  ? <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 7px", height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(16,185,129,0.12)", color:"#34d399", border:"1px solid rgba(16,185,129,0.3)" }}><span style={{ width:5, height:5, borderRadius:"50%", background:"#34d399", flexShrink:0 }} />Complete</span>
                  : <span style={{ display:"inline-flex", alignItems:"center", gap:4, padding:"0 7px", height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase", background:"rgba(245,158,11,0.12)", color:"#fbbf24", border:"1px solid rgba(245,158,11,0.3)" }}><span style={{ width:5, height:5, borderRadius:"50%", background:"#fbbf24", flexShrink:0 }} />In Progress</span>;
              })()}</td>
              <td><InvoiceStatusBadge status={inv.status} /></td>
              <td>
                {showUnarchive ? (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize:11, color:"var(--muted)" }} onClick={e => { e.stopPropagation(); onUnarchive(inv.id); }}>
                    Restore
                  </button>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); onSelect(inv); }}>
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

// ─── BILLING TAB ──────────────────────────────────────────────
export default function Billing({ adminDisplayName }) {
  const [invoices, setInvoices]       = useState([]);
  const [companies, setCompanies]     = useState([]);
  const [requests, setRequests]       = useState([]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [view, setView]               = useState("list");
  const [selected, setSelected]       = useState(null);
  const [showBillToMgmt, setShowBillToMgmt] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showMerge, setShowMerge] = useState(false);

  // Active section state
  const [filter, setFilter]           = useState(() => ssGet("bill_filter", "all"));
  const [serviceFilter, setServiceFilter] = useState("");
  const [targetFilter, setTargetFilter]   = useState("");
  const [companyFilter, setCompanyFilter] = useState(() => ssGet("bill_company", ""));
  const [search, setSearch]               = useState(() => ssGet("bill_search", ""));
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortCol, setSortCol] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [activePage, setActivePage] = useState(1);

  // Completed section state
  const [cSearch, setCSearch]               = useState("");
  const [debouncedCSearch, setDebouncedCSearch] = useState("");
  const [cCompanyFilter, setCCompanyFilter] = useState("");
  const [cSortCol, setCSortCol] = useState("updated_at");
  const [cSortDir, setCSortDir] = useState("desc");
  const [completedPage, setCompletedPage] = useState(1);

  // Archive section state
  const [archiveOpen, setArchiveOpen]     = useState(false);
  const [aSearch, setASearch]             = useState("");
  const [debouncedASearch, setDebouncedASearch] = useState("");
  const [aCompanyFilter, setACompanyFilter] = useState("");
  const [aSortCol, setASortCol] = useState("archived_at");
  const [aSortDir, setASortDir] = useState("desc");
  const [archivedPage, setArchivedPage]   = useState(1);
  const [archiveSelectedIds, setArchiveSelectedIds] = useState(new Set());
  const [archiving, setArchiving]         = useState(false);

  // Persist filters to sessionStorage
  useEffect(() => { ssSet("bill_filter", filter); }, [filter]);
  useEffect(() => { ssSet("bill_company", companyFilter); }, [companyFilter]);
  useEffect(() => { ssSet("bill_search", search); }, [search]);

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

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const MERGE_BLOCKED_STATUSES = ["paid", "client_billed"];
  const selectedInvoices = invoices.filter(i => selectedIds.has(i.id));
  const canMerge = selectedInvoices.length >= 2
    && selectedInvoices.every(i => !MERGE_BLOCKED_STATUSES.includes(i.status))
    && new Set(selectedInvoices.map(i => i.company_id)).size === 1;
  const mergeError = selectedInvoices.length >= 2 && !canMerge
    ? selectedInvoices.some(i => MERGE_BLOCKED_STATUSES.includes(i.status))
      ? "Cannot merge paid or client-billed invoices."
      : "All selected invoices must belong to the same company."
    : null;

  const load = async (silent) => {
    if (!silent) setLoading(true);
    const [{ data: invs }, { data: cos }, { data: reqs }, { data: btc }] = await Promise.all([
      supabase.from("invoices").select("*, service_lines!service_line_id(line_letter, service_name, is_completed)").order("created_at",{ascending:false}).limit(500),
      supabase.from("companies").select("id,name").order("name"),
      supabase.from("service_requests").select("id,request_number,status,mileage").limit(1000),
      supabase.from("bill_to_contacts").select("*").order("name"),
    ]);
    // For merged invoices (service_line_id null, SR linked), derive aggregate completion from all lines
    const merged = (invs || []).filter(i => !i.service_line_id && i.service_request_id);
    const mergedSrIds = [...new Set(merged.map(i => i.service_request_id))];
    let srLinesMap = {};
    if (mergedSrIds.length) {
      const { data: allLines } = await supabase.from("service_lines").select("sr_id, is_completed").in("sr_id", mergedSrIds);
      for (const ln of (allLines || [])) {
        if (!srLinesMap[ln.sr_id]) srLinesMap[ln.sr_id] = [];
        srLinesMap[ln.sr_id].push(ln.is_completed);
      }
    }
    const enriched = (invs || []).map(inv => {
      if (!inv.service_line_id && inv.service_request_id && srLinesMap[inv.service_request_id]) {
        const statuses = srLinesMap[inv.service_request_id];
        const allDone = statuses.length > 0 && statuses.every(Boolean);
        return { ...inv, _mergedComplete: allDone };
      }
      return inv;
    });
    setInvoices(enriched);
    setCompanies(cos || []);
    setRequests(reqs || []);
    setBillToContacts(btc || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const companiesMap      = Object.fromEntries((companies||[]).map(c => [c.id, c.name]));
  const requestsMap       = Object.fromEntries((requests||[]).map(r => [r.id, r.request_number]));
  const requestsStatusMap = Object.fromEntries((requests||[]).map(r => [r.id, r.status]));
  const requestsMileageMap = Object.fromEntries((requests||[]).map(r => [r.id, r.mileage]));
  const billToMap         = Object.fromEntries((billToContacts||[]).map(c => [c.id, c]));

  const getBillToLabel = (inv) => {
    if (inv.bill_to_id && billToMap[inv.bill_to_id]) return billToMap[inv.bill_to_id].name;
    if (inv.submission_target) return TARGET_LABELS[inv.submission_target] || inv.submission_target;
    return null;
  };

  // ─── Search helper ───
  const matchesInvSearch = (inv, q) => {
    if (!q) return true;
    const srNum = inv.service_request_id ? String(requestsMap[inv.service_request_id] || "") : "";
    return (
      srNum.includes(q) ||
      (companiesMap[inv.company_id] || "").toLowerCase().includes(q) ||
      (inv.vehicle_id || "").toLowerCase().includes(q) ||
      (inv.vehicle_make || "").toLowerCase().includes(q) ||
      (inv.vehicle_model || "").toLowerCase().includes(q) ||
      (inv.vehicle_year || "").toLowerCase().includes(q) ||
      (inv.service_type || "").toLowerCase().includes(q) ||
      (getBillToLabel(inv) || "").toLowerCase().includes(q) ||
      (inv.ro_number || "").toLowerCase().includes(q)
    );
  };

  const COMPLETED_STATUSES = ["approved", "paid", "client_billed"];

  // ─── Active (non-completed, non-archived) ───
  const activeInvoices = invoices.filter(i => !COMPLETED_STATUSES.includes(i.status) && !i.archived_at);
  const activeCounts = {
    all:       activeInvoices.length,
    draft:     activeInvoices.filter(i => i.status === "draft").length,
    submitted: activeInvoices.filter(i => i.status === "submitted").length,
    approved:  activeInvoices.filter(i => i.status === "approved").length,
    rejected:           activeInvoices.filter(i => i.status === "rejected").length,
    revise:             activeInvoices.filter(i => i.status === "revise").length,
    incognito:          invoices.filter(i => i.is_incognito && !i.archived_at).length,
  };

  const activeFiltered = (filter === "incognito" ? invoices.filter(i => i.is_incognito && !i.archived_at) : activeInvoices)
    .filter(i => filter === "all" || filter === "incognito" || i.status === filter)
    .filter(i => !companyFilter || i.company_id === companyFilter)
    .filter(i => !serviceFilter || (i.service_lines?.service_name || i.service_type) === serviceFilter)
    .filter(i => {
      if (!targetFilter) return true;
      if (i.bill_to_id) return i.bill_to_id === targetFilter;
      return i.submission_target === targetFilter;
    })
    .filter(i => matchesInvSearch(i, debouncedSearch.toLowerCase().replace(/^sr-/i, "")));

  const activeTotalPages = Math.max(1, Math.ceil(activeFiltered.length / INV_PAGE_SIZE));
  const activePageClamped = Math.min(activePage, activeTotalPages);
  const activePageRows = activeFiltered.slice((activePageClamped - 1) * INV_PAGE_SIZE, activePageClamped * INV_PAGE_SIZE);

  // ─── Completed (paid/client_billed, non-archived) ───
  const completedInvoices = invoices.filter(i => COMPLETED_STATUSES.includes(i.status) && !i.archived_at);
  const completedFiltered = completedInvoices
    .filter(i => !cCompanyFilter || i.company_id === cCompanyFilter)
    .filter(i => matchesInvSearch(i, debouncedCSearch.toLowerCase().replace(/^sr-/i, "")));

  const completedTotalPages = Math.max(1, Math.ceil(completedFiltered.length / INV_PAGE_SIZE));
  const completedPageClamped = Math.min(completedPage, completedTotalPages);
  const completedPageRows = completedFiltered.slice((completedPageClamped - 1) * INV_PAGE_SIZE, completedPageClamped * INV_PAGE_SIZE);

  // ─── Archived ───
  const archivedInvoices = invoices.filter(i => !!i.archived_at);
  const archivedFiltered = archivedInvoices
    .filter(i => !aCompanyFilter || i.company_id === aCompanyFilter)
    .filter(i => matchesInvSearch(i, debouncedASearch.toLowerCase().replace(/^sr-/i, "")));
  const archivedTotalPages = Math.max(1, Math.ceil(archivedFiltered.length / INV_PAGE_SIZE));
  const archivedPageClamped = Math.min(archivedPage, archivedTotalPages);
  const archivedPageRows = archivedFiltered.slice((archivedPageClamped - 1) * INV_PAGE_SIZE, archivedPageClamped * INV_PAGE_SIZE);

  const totalCounts = {
    all:       invoices.filter(i => !i.archived_at).length,
    draft:     activeCounts.draft,
    submitted: activeCounts.submitted,
    approved:  activeCounts.approved,
    completed: completedInvoices.length,
  };

  const approvedRevenue = invoices
    .filter(i => ["approved","paid"].includes(i.status) && !i.archived_at)
    .reduce((sum, i) => sum + (Number(i.total)||0), 0);

  // Archive / unarchive handlers
  const handleArchiveInvoices = async () => {
    if (archiveSelectedIds.size === 0) return;
    setArchiving(true);
    const now = new Date().toISOString();
    await supabase.from("invoices").update({ archived_at: now }).in("id", [...archiveSelectedIds]);
    setArchiveSelectedIds(new Set());
    setArchiving(false);
    load();
  };
  const handleUnarchiveInvoice = async (id) => {
    await supabase.from("invoices").update({ archived_at: null }).eq("id", id);
    load();
  };
  const toggleArchiveInvSelect = (id) => {
    setArchiveSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleArchiveInvSelectAll = () => {
    const paidCompleted = completedFiltered.filter(i => i.status === "paid");
    if (archiveSelectedIds.size === paidCompleted.length && paidCompleted.length > 0) setArchiveSelectedIds(new Set());
    else setArchiveSelectedIds(new Set(paidCompleted.map(i => i.id)));
  };

  // Reset page when filters change
  useEffect(() => { setActivePage(1); }, [filter, companyFilter, serviceFilter, targetFilter, search]);
  useEffect(() => { setCompletedPage(1); }, [cSearch, cCompanyFilter]);
  useEffect(() => { setArchivedPage(1); }, [aSearch, aCompanyFilter]);

  if (view === "builder") {
    return <InvoiceBuilder adminDisplayName={adminDisplayName} onSaved={() => { load(); setView("list"); }} onCancel={() => setView("list")} />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Billing</div>
          <div className="page-sub">Create and manage invoices with pricing intelligence</div>
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
        <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{totalCounts.all}</div></div>
        <div className="stat-card"><div className="stat-label">Draft</div><div className="stat-value c-purple">{totalCounts.draft}</div></div>
        <div className="stat-card"><div className="stat-label">Submitted</div><div className="stat-value c-blue">{totalCounts.submitted}</div></div>
        <div className="stat-card"><div className="stat-label">Approved</div><div className="stat-value c-green">{totalCounts.approved}</div></div>
        <div className="stat-card">
          <div className="stat-label">Approved Revenue</div>
          <div className="stat-value c-amber" style={{ fontSize:20 }}>${approvedRevenue.toFixed(0)}</div>
        </div>
      </div>

      {/* ═══ ACTIVE INVOICES ═══ */}
      <div className="toolbar" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
        <div className="filters">
          {[["all","All"],["draft","Draft"],["submitted","Submitted"],["rejected","Rejected"],["revise","Revise"]].map(([id,label]) => (
            <button key={id} className={`filter-btn ${filter===id?"active":""}`} onClick={() => setFilter(id)}>
              {label} ({id==="all" ? activeCounts.all : activeCounts[id] ?? 0})
            </button>
          ))}
          <button className={`filter-btn ${filter==="incognito"?"active":""}`} onClick={() => setFilter("incognito")}
            style={{ color: filter==="incognito" ? "var(--text)" : "var(--dim)", borderColor: filter==="incognito" ? "var(--dim)" : undefined }}>
            Incognito ({activeCounts.incognito})
          </button>
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
          {companyFilter && (
            <span className="filter-chip">
              {companiesMap[companyFilter] || companyFilter}
              <span className="filter-chip-x" onClick={() => setCompanyFilter("")}>×</span>
            </span>
          )}
          {search && (
            <span className="filter-chip">
              "{search}"
              <span className="filter-chip-x" onClick={() => setSearch("")}>×</span>
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:8, flexShrink:0 }}>
          <select value={companyFilter} onChange={e => setCompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: companyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
            <option value="">All Companies</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search SR#, DSP, vehicle, VIN…"
            style={{ padding:"5px 12px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:240, outline:"none" }}
          />
        </div>
      </div>

      {selectedIds.size >= 1 && (
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10, padding:"8px 12px", background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:6, flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"var(--text)" }}>{selectedIds.size} invoice{selectedIds.size !== 1 ? "s" : ""} selected</span>
          {mergeError && <span style={{ fontSize:11, color:"#ef4444" }}>{mergeError}</span>}
          <div style={{ marginLeft:"auto", display:"flex", gap:8, alignItems:"center" }}>
            {selectedIds.size >= 2 && (
              <button className="btn btn-primary btn-sm" disabled={!canMerge} onClick={() => setShowMerge(true)}>
                Merge
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds(new Set())}>Clear</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-row">Loading invoices…</div> : (
        <>
          <InvoiceTable
            rows={activePageRows}
            companiesMap={companiesMap} requestsMap={requestsMap} requestsStatusMap={requestsStatusMap}
            getBillToLabel={getBillToLabel}
            sortCol={sortCol} sortDir={sortDir} onSort={handleSort}
            onSelect={setSelected}
            onServiceFilter={setServiceFilter} onTargetFilter={setTargetFilter}
            selectedIds={selectedIds} onToggleSelect={toggleSelect}
          />
          <InvPagination page={activePageClamped} totalPages={activeTotalPages} onPageChange={setActivePage} />
        </>
      )}

      {/* ═══ COMPLETED INVOICES ═══ */}
      {!loading && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10, flexWrap:"wrap", gap:8 }}>
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.04em", color:"var(--snow)" }}>
                Approved Invoices
              </div>
              <div style={{ fontSize:11, color:"var(--muted)", marginTop:2 }}>{completedFiltered.length} approved invoice{completedFiltered.length !== 1 ? "s" : ""}</div>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              {archiveSelectedIds.size > 0 && (
                <button className="btn btn-ghost btn-sm" disabled={archiving} onClick={handleArchiveInvoices}
                  style={{ fontSize:11, color:"var(--muted)" }}>
                  {archiving ? "Archiving…" : `Archive ${archiveSelectedIds.size} selected`}
                </button>
              )}
              <select value={cCompanyFilter} onChange={e => setCCompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: cCompanyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
                <option value="">All Companies</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                value={cSearch}
                onChange={e => setCSearch(e.target.value)}
                placeholder="Search completed…"
                style={{ padding:"5px 12px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:240, outline:"none" }}
              />
            </div>
          </div>

          <InvoiceTable
            rows={completedPageRows}
            companiesMap={companiesMap} requestsMap={requestsMap} requestsStatusMap={requestsStatusMap}
            getBillToLabel={getBillToLabel}
            sortCol={cSortCol} sortDir={cSortDir} onSort={handleCSort}
            onSelect={setSelected}
            archiveSelectedIds={archiveSelectedIds}
            onToggleArchive={toggleArchiveInvSelect}
            onToggleArchiveAll={toggleArchiveInvSelectAll}
            archiveAllSelected={archiveSelectedIds.size > 0 && archiveSelectedIds.size === completedFiltered.filter(i => i.status === "paid").length}
          />
          <InvPagination page={completedPageClamped} totalPages={completedTotalPages} onPageChange={setCompletedPage} />
        </div>
      )}

      {/* ═══ ARCHIVED INVOICES ═══ */}
      {!loading && archivedInvoices.length > 0 && (
        <div style={{ marginTop:32 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: archiveOpen ? 10 : 0, flexWrap:"wrap", gap:8 }}>
            <button onClick={() => setArchiveOpen(v => !v)}
              style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, padding:0 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.04em", color:"var(--dim)" }}>
                Archived ({archivedInvoices.length})
              </span>
              <span style={{ color:"var(--dim)", fontSize:12 }}>{archiveOpen ? "▾" : "▸"}</span>
            </button>
            {archiveOpen && (
              <div style={{ display:"flex", gap:8 }}>
                <select value={aCompanyFilter} onChange={e => setACompanyFilter(e.target.value)} style={{ padding:"5px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color: aCompanyFilter ? "var(--text)" : "var(--muted)", minWidth:160 }}>
                  <option value="">All Companies</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input
                  value={aSearch}
                  onChange={e => setASearch(e.target.value)}
                  placeholder="Search archived…"
                  style={{ padding:"5px 12px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:240, outline:"none" }}
                />
              </div>
            )}
          </div>

          {archiveOpen && (
            <>
              <InvoiceTable
                rows={archivedPageRows}
                companiesMap={companiesMap} requestsMap={requestsMap} requestsStatusMap={requestsStatusMap}
                getBillToLabel={getBillToLabel}
                sortCol={aSortCol} sortDir={aSortDir} onSort={handleASort}
                onSelect={setSelected}
                onUnarchive={handleUnarchiveInvoice}
              />
              <InvPagination page={archivedPageClamped} totalPages={archivedTotalPages} onPageChange={setArchivedPage} />
            </>
          )}
        </div>
      )}

      {selected && (
        <InvoiceModal
          key={selected.id}
          invoice={selected}
          companies={companies}
          requestsStatusMap={requestsStatusMap}
          requestsMap={requestsMap}
          requestsMileageMap={requestsMileageMap}
          billToContacts={billToContacts}
          adminDisplayName={adminDisplayName}
          onClose={() => setSelected(null)}
          onSaveAndClose={async () => { setSelected(null); await load(); }}
          onSaveAndStay={() => { load(); }}
          onDelete={() => { load(); setSelected(null); }}
        />
      )}

      {showMerge && (
        <MergeModal
          invoices={selectedInvoices}
          companiesMap={companiesMap}
          requestsMap={requestsMap}
          adminDisplayName={adminDisplayName}
          onClose={() => setShowMerge(false)}
          onMerged={() => { setShowMerge(false); setSelectedIds(new Set()); load(); }}
        />
      )}
    </div>
  );
}
