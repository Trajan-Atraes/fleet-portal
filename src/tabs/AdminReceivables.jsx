import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";
import { SQUARE_APP_ID, SQUARE_LOCATION_ID, loadSquareSDK } from "../lib/square";
import { IcoRefresh, IcoCreditCard } from "../components/Icons";

// ─── STATUS BADGE ─────────────────────────────────────────────
function ReceivablesStatusBadge({ status }) {
  const map = {
    awaiting_payment_details: { bg:"rgba(245,158,11,0.12)",  color:"#fbbf24", label:"Awaiting Details"  },
    ready_to_process:         { bg:"rgba(139,92,246,0.12)",  color:"#a78bfa", label:"Ready to Process"  },
    client_billed:            { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Client Billed"     },
    paid:                     { bg:"rgba(16,185,129,0.22)",  color:"#6ee7b7", label:"Paid"              },
  };
  const s = map[status] || { bg:"rgba(55,79,104,0.3)", color:"#526a84", label: status || "—" };
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

// ─── PAYMENT METHOD BADGE ──────────────────────────────────────
function PaymentMethodBadge({ method }) {
  const map = {
    card: { bg:"rgba(139,92,246,0.12)", color:"#a78bfa", label:"Card" },
    ach:  { bg:"rgba(59,130,246,0.12)", color:"#60a5fa", label:"ACH"  },
  };
  const s = map[method] || { bg:"rgba(55,79,104,0.3)", color:"#526a84", label: method || "—" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"0 7px",
      height:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      {s.label}
    </span>
  );
}

// ─── SQUARE CARD FORM ─────────────────────────────────────────
function SquareCardForm({ uid, onReady, onError }) {
  const cardRef    = useRef(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    if (!SQUARE_APP_ID || !SQUARE_LOCATION_ID) {
      onError("Square credentials are not configured. Check your .env file.");
      return;
    }
    loadSquareSDK()
      .then(async (Square) => {
        const payments = Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
        const card     = await payments.card();
        await card.attach(`#sq-card-${uid}`);
        cardRef.current = card;
        onReady(card);
      })
      .catch(() => onError("Failed to load Square payment form. Check your internet connection."));
    return () => { cardRef.current?.destroy?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div>
      <div id={`sq-card-${uid}`} style={{ minHeight: 89 }} />
      <div style={{ fontSize:10, color:"var(--muted)", marginTop:6 }}>
        Card data is processed securely by Square — never touches our servers.
      </div>
    </div>
  );
}

// ─── PAYMENT HISTORY ──────────────────────────────────────────
function PaymentHistory({ invoiceId, onReverse }) {
  const [payments, setPayments] = useState(null);
  useEffect(() => {
    supabase.from("square_payments").select("*").eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setPayments(data || []));
  }, [invoiceId]);
  if (payments === null) return <div style={{ fontSize:12, color:"var(--muted)", padding:"8px 0" }}>Loading history…</div>;
  if (payments.length === 0) return <div style={{ fontSize:12, color:"var(--muted)", padding:"8px 0" }}>No payment records.</div>;
  return (
    <div style={{ marginTop:10 }}>
      <div style={{ fontSize:10, fontWeight:700, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6 }}>Payment History</div>
      {payments.map(p => (
        <div key={p.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 10px", borderRadius:4, background:"var(--plate)", border:"1px solid var(--border)", marginBottom:6, gap:10, flexWrap:"wrap" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <PaymentMethodBadge method={p.payment_method} />
            <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:900, color: p.status === "reversed" ? "var(--muted)" : "var(--accent)", textDecoration: p.status === "reversed" ? "line-through" : "none" }}>
              ${Number(p.amount).toFixed(2)}
            </span>
            {p.status === "reversed" && <span style={{ fontSize:10, color:"#f87171", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Reversed</span>}
            <span style={{ fontSize:11, color:"var(--soft)" }}>{new Date(p.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</span>
            <span style={{ fontSize:11, color:"var(--muted)" }}>by {p.processed_by_name || "—"}</span>
            {p.notes && <span style={{ fontSize:11, color:"var(--dim)", fontStyle:"italic" }}>{p.notes}</span>}
          </div>
          {p.status === "completed" && onReverse && (
            <button className="btn btn-ghost btn-sm" style={{ color:"#ef4444", borderColor:"rgba(239,68,68,0.35)", fontSize:10 }} onClick={() => onReverse(p)}>
              Reverse
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── PROCESS PAYMENT MODAL ────────────────────────────────────
function ProcessPaymentModal({ invoice, companiesMap, requestsMap, onClose, onPaid, adminDisplayName }) {
  const [method,         setMethod]         = useState("card");
  const [cardReady,      setCardReady]      = useState(false);
  const [cardRef,        setCardRef]        = useState(null);
  const [sdkError,       setSdkError]       = useState("");
  const [note,           setNote]           = useState("");
  const [processing,     setProcessing]     = useState(false);
  const [error,          setError]          = useState("");
  const [success,        setSuccess]        = useState(false);
  const [reverseTarget,  setReverseTarget]  = useState(null);
  const [confirmReversal,setConfirmReversal]= useState(false);
  const [reversing,      setReversing]      = useState(false);
  const [reverseError,   setReverseError]   = useState("");

  const formUid       = useRef(`sq-${invoice.id.slice(0, 8)}`).current;
  const isPaid        = invoice.status === "paid";
  const isClientBilled = invoice.status === "client_billed";
  const isProcessable  = invoice.status === "ready_to_process";

  const getRef = () => {
    if (!invoice.service_request_id) return null;
    const num = requestsMap?.[invoice.service_request_id];
    if (!num) return null;
    const letter = invoice.service_lines?.line_letter;
    return letter ? `${num}-${letter}` : `${num}`;
  };
  const refLabel = getRef() || invoice.id.slice(-8).toUpperCase();

  const handleCharge = async () => {
    setError(""); setProcessing(true);
    try {
      let sourceId;
      if (method === "card") {
        if (!cardRef) { setError("Card form not ready."); setProcessing(false); return; }
        const result = await cardRef.tokenize();
        if (result.status !== "OK") { setError(result.errors?.[0]?.message || "Card tokenization failed."); setProcessing(false); return; }
        sourceId = result.token;
      } else {
        setError("ACH processing is not yet available. Please use Card.");
        setProcessing(false); return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-square-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ invoice_id: invoice.id, source_id: sourceId, payment_method: method, note: note || null }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error || "Payment failed."); setProcessing(false); return; }
      setSuccess(true); setProcessing(false);
      setTimeout(() => { onPaid(invoice.id); }, 1800);
    } catch (e) {
      setError("Payment failed — check your connection and try again.");
      setProcessing(false);
    }
  };

  const handleReverseClick   = (p) => { setReverseTarget(p); setConfirmReversal(true); setReverseError(""); };
  const handleReverseConfirm = async () => {
    setReversing(true); setReverseError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/reverse-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
        body: JSON.stringify({ square_payment_record_id: reverseTarget.id }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setReverseError(body.error || "Reversal failed."); setReversing(false); return; }
      setReversing(false); setConfirmReversal(false); setReverseTarget(null);
      onPaid(invoice.id);
    } catch (e) {
      setReverseError("Reversal failed — check your connection.");
      setReversing(false);
    }
  };

  const invoiceTotal = Number(invoice.total || 0);
  const company      = companiesMap?.[invoice.company_id] || "—";

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && !processing && onClose()}>
      <div className="modal" style={{ maxWidth:520 }}>
        <div className="modal-head">
          <div>
            <h3>{isPaid ? "Payment Details" : isClientBilled ? "Invoice Details" : "Process Payment"}</h3>
            <div className="modal-head-sub">{company} · {refLabel}</div>
          </div>
          <button className="modal-close" onClick={onClose} disabled={processing}>×</button>
        </div>
        <div className="modal-body">

          {/* Invoice summary */}
          <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 14px", marginBottom:14 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
              <div>
                <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.15em", fontWeight:600, marginBottom:2 }}>Vehicle</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif", textTransform:"uppercase" }}>{invoice.vehicle_id || "—"}</div>
                {(invoice.vehicle_make || invoice.vehicle_model) && (
                  <div style={{ fontSize:11, color:"var(--muted)" }}>{[invoice.vehicle_year, invoice.vehicle_make, invoice.vehicle_model].filter(Boolean).join(" ")}</div>
                )}
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.15em", fontWeight:600, marginBottom:2 }}>Amount</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:900, color:"var(--accent)", lineHeight:1 }}>${invoiceTotal.toFixed(2)}</div>
                <ReceivablesStatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Paid — show history + optional reversal */}
          {isPaid && (
            <>
              {reverseError && <div className="error-box">{reverseError}</div>}
              {confirmReversal && reverseTarget && (
                <div style={{ background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.3)", borderRadius:6, padding:"10px 14px", marginBottom:10 }}>
                  <div style={{ fontSize:13, color:"var(--body)", marginBottom:8 }}>
                    <strong style={{ color:"#ef4444" }}>Reverse this ${Number(reverseTarget.amount).toFixed(2)} payment?</strong>{" "}
                    A Square refund will be issued.
                  </div>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setConfirmReversal(false); setReverseTarget(null); }} disabled={reversing}>Cancel</button>
                    <button className="btn btn-sm" style={{ background:"#ef4444", color:"#fff" }} onClick={handleReverseConfirm} disabled={reversing}>{reversing ? "Reversing…" : "Confirm Reversal"}</button>
                  </div>
                </div>
              )}
              <PaymentHistory invoiceId={invoice.id} onReverse={handleReverseClick} />
            </>
          )}

          {/* Client billed — read-only */}
          {isClientBilled && (
            <div style={{ background:"rgba(59,130,246,0.07)", border:"1px solid rgba(59,130,246,0.25)", borderRadius:5, padding:"12px 14px", marginBottom:14 }}>
              <div style={{ fontSize:12, color:"#60a5fa", fontWeight:600, marginBottom:4 }}>Awaiting Client Payment</div>
              <div style={{ fontSize:12, color:"var(--body)" }}>
                This invoice is in the client's payment portal. No action needed — it will auto-mark as Paid when the client pays.
              </div>
            </div>
          )}

          {/* Ready to process — payment form */}
          {isProcessable && !success && (
            <>
              <div className="field">
                <label>Payment Method</label>
                <div style={{ display:"flex", gap:0 }}>
                  {[["card","Credit / Debit Card"],["ach","ACH / Bank Transfer"]].map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => { setMethod(val); setError(""); }}
                      style={{
                        padding:"0 14px", height:32, border:"1px solid var(--border)", cursor:"pointer",
                        fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700,
                        letterSpacing:"0.08em", textTransform:"uppercase", marginRight:-1,
                        background: method === val ? "var(--accent)" : "var(--raised)",
                        color:      method === val ? "#000" : "var(--muted)",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {method === "card" && (
                <div className="field">
                  <label>Card Details</label>
                  {sdkError ? (
                    <div className="error-box">{sdkError}</div>
                  ) : (
                    <div style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:5, padding:"10px 12px" }}>
                      <SquareCardForm uid={formUid} onReady={(card) => { setCardRef(card); setCardReady(true); }} onError={(msg) => setSdkError(msg)} />
                    </div>
                  )}
                </div>
              )}

              {method === "ach" && (
                <div style={{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.25)", borderRadius:5, padding:"12px 14px", marginBottom:14 }}>
                  <div style={{ fontSize:12, color:"var(--accent)", fontWeight:600, marginBottom:4 }}>ACH / Bank Transfer — Coming Soon</div>
                  <div style={{ fontSize:12, color:"var(--body)" }}>ACH processing is being finalized. Please use Card for now.</div>
                </div>
              )}

              <div className="field">
                <label>Note (optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. paid by operations manager" />
              </div>

              {error && <div className="error-box">{error}</div>}
              <PaymentHistory invoiceId={invoice.id} onReverse={() => {}} />
            </>
          )}

          {success && <div className="success-box">Payment processed successfully. Marking invoice as paid…</div>}

          <div style={{ display:"flex", gap:8, justifyContent:"flex-end", marginTop:14 }}>
            <button className="btn btn-ghost" onClick={onClose} disabled={processing}>
              {isPaid || isClientBilled ? "Close" : "Cancel"}
            </button>
            {isProcessable && !success && (
              <button
                className="btn btn-primary"
                onClick={handleCharge}
                disabled={processing || method === "ach" || (method === "card" && !cardReady)}
                style={{ display:"inline-flex", alignItems:"center", gap:6 }}
              >
                <IcoCreditCard />
                {processing ? "Processing…" : `Charge $${invoiceTotal.toFixed(2)}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RECEIVABLES TAB ──────────────────────────────────────────
export default function AdminReceivables({ adminDisplayName }) {
  const [invoices,       setInvoices]       = useState([]);
  const [companies,      setCompanies]      = useState([]);
  const [requests,       setRequests]       = useState([]);
  const [billToContacts, setBillToContacts] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filter,         setFilter]         = useState("outstanding");
  const [companyFilter,  setCompanyFilter]  = useState("");
  const [selected,       setSelected]       = useState(null);
  const [search,         setSearch]         = useState("");

  // Inline action state
  const [markingId,          setMarkingId]          = useState(null);
  const [savingMark,         setSavingMark]         = useState(false);
  const [markError,          setMarkError]          = useState("");
  const [billToClientId,     setBillToClientId]     = useState(null);
  const [savingBillToClient, setSavingBillToClient] = useState(false);
  const [billToClientError,  setBillToClientError]  = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: invs }, { data: cos }, { data: reqs }, { data: btcs }] = await Promise.all([
      supabase.from("invoices")
        .select("*, service_lines(line_letter, service_name)")
        .in("status", ["awaiting_payment_details", "ready_to_process", "client_billed", "paid"])
        .order("created_at", { ascending: false }),
      supabase.from("companies").select("id,name").order("name"),
      supabase.from("service_requests").select("id,request_number,status"),
      supabase.from("bill_to_contacts").select("id,name").order("name"),
    ]);
    setInvoices(invs || []);
    setCompanies(cos || []);
    setRequests(reqs || []);
    setBillToContacts(btcs || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const companiesMap = Object.fromEntries((companies||[]).map(c => [c.id, c.name]));
  const requestsMap  = Object.fromEntries((requests ||[]).map(r => [r.id, r.request_number]));
  const billToMap    = Object.fromEntries((billToContacts||[]).map(c => [c.id, c.name]));

  const getRef = (inv) => {
    if (!inv.service_request_id) return null;
    const num = requestsMap[inv.service_request_id];
    if (!num) return null;
    const letter = inv.service_lines?.line_letter;
    return letter ? `${num}-${letter}` : `${num}`;
  };

  // Stats
  const awaiting = invoices.filter(i => i.status === "awaiting_payment_details");
  const ready    = invoices.filter(i => i.status === "ready_to_process");
  const clientB  = invoices.filter(i => i.status === "client_billed");
  const paid     = invoices.filter(i => i.status === "paid");
  const readyAmt = ready.reduce((s, i) => s + (Number(i.total)||0), 0);
  const paidAmt  = paid.reduce((s, i) => s + (Number(i.total)||0), 0);

  const filtered = invoices
    .filter(i => {
      if (filter === "outstanding") return i.status !== "paid";
      if (filter === "3rd_party")   return i.status === "awaiting_payment_details" || i.status === "ready_to_process";
      if (filter === "client")      return i.status === "client_billed";
      if (filter === "paid")        return i.status === "paid";
      return true;
    })
    .filter(i => !companyFilter || i.company_id === companyFilter)
    .filter(i => {
      if (!search) return true;
      const q = search.toLowerCase().replace(/^sr-/i, "");
      const ref = getRef(i) || "";
      return (
        ref.toLowerCase().includes(q) ||
        (companiesMap[i.company_id] || "").toLowerCase().includes(q) ||
        (i.vehicle_id || "").toLowerCase().includes(q) ||
        (i.vin || "").toLowerCase().includes(q) ||
        (billToMap[i.bill_to_id] || "").toLowerCase().includes(q)
      );
    });

  const handleMarkDetailsReceived = async (invoiceId) => {
    setSavingMark(true); setMarkError("");
    const { error } = await supabase.from("invoices").update({
      status: "ready_to_process",
      payment_details_received_at: new Date().toISOString(),
    }).eq("id", invoiceId);
    setSavingMark(false);
    if (error) { setMarkError(error.message); return; }
    setMarkingId(null);
    load();
  };

  const handleBillToClient = async (invoiceId) => {
    setSavingBillToClient(true); setBillToClientError("");
    const { error } = await supabase.from("invoices").update({ status: "client_billed" }).eq("id", invoiceId);
    setSavingBillToClient(false);
    if (error) { setBillToClientError(error.message); return; }
    setBillToClientId(null);
    load();
  };

  const handlePaid = () => { setSelected(null); load(); };

  const openModal = (inv) => {
    setMarkingId(null); setBillToClientId(null);
    setSelected(inv);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Receivables</div>
          <div className="page-sub">Manage third-party payer and client payment collections</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      {/* Stats */}
      <div className="stats-row stats-4">
        <div className="stat-card">
          <div className="stat-label">Awaiting Details</div>
          <div className="stat-value c-amber">{awaiting.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Ready to Process</div>
          <div className="stat-value" style={{ color:"#a78bfa", fontSize: readyAmt >= 10000 ? 20 : 30 }}>
            {ready.length === 0 ? 0 : `$${readyAmt.toFixed(0)}`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Client Billed</div>
          <div className="stat-value" style={{ color:"#60a5fa" }}>{clientB.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collected</div>
          <div className="stat-value c-green" style={{ fontSize: paidAmt >= 10000 ? 20 : 30 }}>${paidAmt.toFixed(0)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="filters">
          {[
            ["outstanding", "Outstanding"],
            ["client",      "Client Billed"],
            ["paid",        "Paid"],
          ].map(([id, label]) => (
            <button key={id} className={`filter-btn ${filter === id ? "active" : ""}`} onClick={() => setFilter(id)}>
              {label}
            </button>
          ))}
          {companies.length > 0 && (
            <select
              value={companyFilter}
              onChange={e => setCompanyFilter(e.target.value)}
              style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:24, fontSize:11, color: companyFilter ? "var(--text)" : "var(--muted)", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", cursor:"pointer", outline:"none" }}
            >
              <option value="">All DSPs</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search SR#, vehicle, bill to…"
          style={{ background:"var(--plate)", border:"1px solid var(--border)", borderRadius:4, padding:"0 10px", height:24, fontSize:12, color:"var(--text)", outline:"none", width:200, fontFamily:"'Barlow',sans-serif" }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-row">Loading receivables…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No {filter === "paid" ? "paid invoices" : filter === "outstanding" ? "outstanding invoices" : "invoices"}</h3>
          <p>No records match your current filters.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice #</th>
                <th>DSP</th>
                <th>Bill To</th>
                <th>Vehicle</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            {filtered.map(inv => {
              const ref         = getRef(inv);
              const isMarking   = markingId === inv.id;
              const isBilling   = billToClientId === inv.id;
              const billToLabel = inv.bill_to_id ? (billToMap[inv.bill_to_id] || "—") : (inv.submission_target || "—");
              const is3rdParty  = inv.status === "awaiting_payment_details" || inv.status === "ready_to_process";
              const isClickable = inv.status === "paid" || inv.status === "client_billed" || inv.status === "ready_to_process";
              return (
                <tbody key={inv.id}>
                  <tr onClick={() => isClickable && openModal(inv)} style={{ cursor: isClickable ? "pointer" : "default" }}>
                    <td style={{ color:"var(--soft)", whiteSpace:"nowrap", fontSize:11 }}>
                      {new Date(inv.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                    </td>
                    <td>
                      {ref
                        ? <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:"var(--accent)", letterSpacing:"0.05em" }}>{ref}</span>
                        : <span style={{ color:"var(--muted)" }}>—</span>
                      }
                    </td>
                    <td style={{ fontWeight:600, fontSize:13 }}>{companiesMap[inv.company_id] || "—"}</td>
                    <td style={{ fontSize:12, color:"var(--soft)" }}>{billToLabel}</td>
                    <td>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:14, textTransform:"uppercase" }}>{inv.vehicle_id || "—"}</span>
                      {(inv.vehicle_make || inv.vehicle_model) && (
                        <span style={{ color:"var(--muted)", fontSize:11, marginLeft:8 }}>
                          {[inv.vehicle_year, inv.vehicle_make, inv.vehicle_model].filter(Boolean).join(" ")}
                        </span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:900, color: inv.status === "paid" ? "#6ee7b7" : "var(--accent)" }}>
                        ${Number(inv.total || 0).toFixed(2)}
                      </span>
                    </td>
                    <td><ReceivablesStatusBadge status={inv.status} /></td>
                    <td onClick={e => e.stopPropagation()} style={{ whiteSpace:"nowrap" }}>
                      {inv.status === "awaiting_payment_details" && (
                        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ fontSize:10 }}
                            onClick={() => { setMarkingId(isMarking ? null : inv.id); setBillToClientId(null); setMarkError(""); }}
                          >
                            Mark Details Received
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize:10, color:"#f87171", borderColor:"rgba(239,68,68,0.35)" }}
                            onClick={() => { setBillToClientId(isBilling ? null : inv.id); setMarkingId(null); setBillToClientError(""); }}
                          >
                            Bill to Client
                          </button>
                        </div>
                      )}
                      {inv.status === "ready_to_process" && (
                        <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:10 }}
                            onClick={() => openModal(inv)}
                          >
                            <IcoCreditCard /> Process Payment
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize:10, color:"#f87171", borderColor:"rgba(239,68,68,0.35)" }}
                            onClick={() => { setBillToClientId(isBilling ? null : inv.id); setMarkingId(null); setBillToClientError(""); }}
                          >
                            Bill to Client
                          </button>
                        </div>
                      )}
                      {inv.status === "client_billed" && (
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:10 }} onClick={() => openModal(inv)}>View</button>
                      )}
                      {inv.status === "paid" && (
                        <button className="btn btn-ghost btn-sm" style={{ fontSize:10 }} onClick={() => openModal(inv)}>History</button>
                      )}
                    </td>
                  </tr>

                  {/* Mark Details Received — inline confirmation */}
                  {isMarking && (
                    <tr>
                      <td colSpan="8" style={{ padding:"0 12px 14px", borderTop:"none" }}>
                        <div style={{ background:"rgba(139,92,246,0.07)", border:"1px solid rgba(139,92,246,0.25)", borderRadius:5, padding:"12px 14px" }}>
                          <div style={{ fontSize:13, color:"var(--body)", marginBottom:8 }}>
                            <strong style={{ color:"#a78bfa" }}>Mark payment details as received?</strong>{" "}
                            Today's date will be recorded as when details arrived, and the invoice moves to Ready to Process.
                          </div>
                          {inv.payment_details_received_at && (
                            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>
                              Previously recorded: {new Date(inv.payment_details_received_at).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}
                            </div>
                          )}
                          {markError && <div className="error-box" style={{ marginBottom:8 }}>{markError}</div>}
                          <div style={{ display:"flex", gap:8 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setMarkingId(null); setMarkError(""); }}>Cancel</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleMarkDetailsReceived(inv.id)} disabled={savingMark}>
                              {savingMark ? "Saving…" : "Confirm"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* Bill to Client — inline confirmation */}
                  {isBilling && (
                    <tr>
                      <td colSpan="8" style={{ padding:"0 12px 14px", borderTop:"none" }}>
                        <div style={{ background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:5, padding:"12px 14px" }}>
                          <div style={{ fontSize:13, color:"var(--body)", marginBottom:8 }}>
                            <strong style={{ color:"#f87171" }}>Reassign to client for direct payment?</strong>{" "}
                            The third-party payer will no longer be responsible. This invoice will appear in the client's payment portal immediately.
                          </div>
                          {billToClientError && <div className="error-box" style={{ marginBottom:8 }}>{billToClientError}</div>}
                          <div style={{ display:"flex", gap:8 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setBillToClientId(null); setBillToClientError(""); }}>Cancel</button>
                            <button
                              className="btn btn-sm"
                              style={{ background:"#ef4444", color:"#fff" }}
                              onClick={() => handleBillToClient(inv.id)}
                              disabled={savingBillToClient}
                            >
                              {savingBillToClient ? "Saving…" : "Bill to Client"}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              );
            })}
          </table>
        </div>
      )}

      {selected && (
        <ProcessPaymentModal
          invoice={selected}
          companiesMap={companiesMap}
          requestsMap={requestsMap}
          adminDisplayName={adminDisplayName}
          onClose={() => setSelected(null)}
          onPaid={handlePaid}
        />
      )}
    </div>
  );
}
