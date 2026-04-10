import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import BarcodeScanner from "../components/BarcodeScanner";
import { IcoPlus, IcoRefresh, IcoEdit, IcoTrash, IcoAdjust, IcoLink, IcoChevron, IcoPkg, IcoBarcode } from "../components/Icons";

const CATEGORY_LABELS = { parts: "Parts", fluids: "Fluids", shop_supplies: "Shop Supplies", tools_equipment: "Tools & Equipment" };
const CATEGORY_OPTS   = Object.entries(CATEGORY_LABELS).map(([v,l]) => ({ v, l }));

function generateSKU() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  let s = "SKU-";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ─── STATUS BADGE ─────────────────────────────────────────────
function POStatusBadge({ status }) {
  const map = {
    ordered:  { bg: "rgba(245,158,11,0.12)",  color: "#fbbf24", label: "Ordered"  },
    shipped:  { bg: "rgba(59,130,246,0.12)",  color: "#60a5fa", label: "Shipped"  },
    received: { bg: "rgba(16,185,129,0.12)",  color: "#34d399", label: "Received" },
  };
  const s = map[status] || map.ordered;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", padding:"0 7px", height:18,
      borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background: s.bg, color: s.color,
    }}>{s.label}</span>
  );
}

// ─── QTY BADGE ───────────────────────────────────────────────
function QtyBadge({ qty, threshold }) {
  const isNeg  = qty < 0;
  const isLow  = !isNeg && threshold != null && qty <= threshold;
  const color  = isNeg ? "var(--red)" : isLow ? "var(--accent)" : "var(--green)";
  const bg     = isNeg ? "rgba(239,68,68,0.12)" : isLow ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.1)";
  return (
    <span style={{
      display:"inline-block", padding:"1px 8px", borderRadius:3,
      fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700,
      background: bg, color,
    }}>{qty}</span>
  );
}

// ─── MODAL SHELL ──────────────────────────────────────────────
function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(7,11,17,0.82)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10,
        padding:"24px 28px", width:"100%", maxWidth: wide ? 780 : 520,
        maxHeight:"90vh", overflowY:"auto",
      }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"var(--white)" }}>{title}</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", fontSize:20, lineHeight:1, padding:4 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── FIELD ────────────────────────────────────────────────────
function Field({ label, children, half }) {
  return (
    <div style={{ marginBottom:14, width: half ? "calc(50% - 6px)" : "100%" }}>
      <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width:"100%", background:"var(--raised)", border:"1px solid var(--border)", borderRadius:5,
  padding:"7px 10px", fontSize:13, color:"var(--white)", outline:"none",
  fontFamily:"'Barlow',sans-serif", boxSizing:"border-box",
};
const selectStyle = { ...inputStyle, cursor:"pointer" };

// ─── ITEM MODAL ──────────────────────────────────────────────
function ItemModal({ item, onClose, onSaved, onSavedAndScan, suppliers, prefillPartNumber }) {
  const isEdit = !!item?.id;
  const [form, setForm] = useState({
    name:              item?.name              || "",
    description:       item?.description       || "",
    category:          item?.category          || "parts",
    part_number:       item?.part_number       || prefillPartNumber || "",
    barcode:           item?.barcode           || "",
    supplier_id:       item?.supplier_id       || "",
    unit:              item?.unit              || "each",
    quantity_on_hand:  item?.quantity_on_hand  ?? 0,
    reorder_threshold: item?.reorder_threshold ?? "",
    reorder_quantity:  item?.reorder_quantity  ?? "",
    notes:             item?.notes             || "",
    unit_cost:         "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return false; }
    setSaving(true); setError("");
    const payload = {
      name:              form.name.trim(),
      description:       form.description.trim() || null,
      category:          form.category,
      sku:               isEdit ? item.sku : generateSKU(),
      part_number:       form.part_number.trim() || null,
      barcode:           form.barcode.trim() || null,
      supplier_id:       form.supplier_id || null,
      unit:              form.unit.trim() || "each",
      quantity_on_hand:  Number(form.quantity_on_hand) || 0,
      reorder_threshold: form.reorder_threshold !== "" ? Number(form.reorder_threshold) : null,
      reorder_quantity:  form.reorder_quantity  !== "" ? Number(form.reorder_quantity)  : null,
      notes:             form.notes.trim() || null,
    };
    if (isEdit) {
      const { error: err } = await supabase.from("inventory_items").update(payload).eq("id", item.id);
      if (err) { setError(err.message); setSaving(false); return false; }
    } else {
      const { data: newItem, error: err } = await supabase.from("inventory_items").insert(payload).select("id").single();
      if (err) { setError(err.message); setSaving(false); return false; }
      // Also write supplier_pricing if supplier selected and cost provided
      if (form.supplier_id && newItem?.id) {
        const cost = parseFloat(form.unit_cost);
        if (!isNaN(cost) && cost > 0) {
          await supabase.from("supplier_pricing").upsert({
            item_id:     newItem.id,
            supplier_id: form.supplier_id,
            unit_cost:   cost,
            notes:       null,
          }, { onConflict: "item_id,supplier_id" });
        }
      }
    }
    setSaving(false);
    return true;
  };

  const doSave = async () => { if (await handleSave()) onSaved(); };
  const doSaveAndScan = async () => { if (await handleSave() && onSavedAndScan) onSavedAndScan(); };

  return (
    <Modal title={isEdit ? "Edit Item" : "New Inventory Item"} onClose={onClose}>
      <div style={{ display:"flex", flexWrap:"wrap", gap:"0 12px" }}>
        <Field label="Item Name">
          <input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Brake Pad Set" />
        </Field>
        <Field label="Description">
          <input style={inputStyle} value={form.description} onChange={e => set("description", e.target.value)} placeholder="Make and Model" />
        </Field>
        <Field label="Category" half>
          <select style={selectStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </Field>
        <Field label="Barcode" half>
          <input style={inputStyle} value={form.barcode} onChange={e => set("barcode", e.target.value)} placeholder="UPC / EAN barcode" />
        </Field>
        {suppliers && suppliers.length > 0 && (
          <Field label="Supplier" half>
            <select style={selectStyle} value={form.supplier_id} onChange={e => set("supplier_id", e.target.value)}>
              <option value="">None</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        )}
        <Field label="Part Number" half>
          <input style={inputStyle} value={form.part_number} onChange={e => set("part_number", e.target.value)} placeholder="Billing part #" />
        </Field>
        <Field label="Unit" half>
          <input style={inputStyle} value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="each, qt, gal…" />
        </Field>
        {isEdit && (
          <Field label="SKU" half>
            <input style={{ ...inputStyle, opacity:0.6 }} value={item.sku || ""} readOnly />
          </Field>
        )}
        <Field label="Qty on Hand" half>
          <input style={inputStyle} type="number" value={form.quantity_on_hand} onChange={e => set("quantity_on_hand", e.target.value)} />
        </Field>
        {!isEdit && form.supplier_id && (
          <Field label="Unit Cost" half>
            <input style={inputStyle} type="number" step="0.01" value={form.unit_cost} onChange={e => set("unit_cost", e.target.value)} placeholder="$0.00" />
          </Field>
        )}
        <Field label="Reorder Threshold" half>
          <input style={inputStyle} type="number" value={form.reorder_threshold} onChange={e => set("reorder_threshold", e.target.value)} placeholder="Low-stock alert qty" />
        </Field>
        <Field label="Reorder Qty" half>
          <input style={inputStyle} type="number" value={form.reorder_quantity} onChange={e => set("reorder_quantity", e.target.value)} placeholder="Suggested reorder qty" />
        </Field>
        <Field label="Notes">
          <textarea style={{ ...inputStyle, minHeight:60, resize:"vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Internal notes" />
        </Field>
      </div>
      {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={doSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Save"}</button>
        {onSavedAndScan && (
          <button className="btn btn-primary" onClick={doSaveAndScan} disabled={saving} style={{ background:"var(--green)", borderColor:"var(--green)" }}>
            {saving ? "Saving…" : "Save & Scan New"}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── ADJUSTMENT MODAL ────────────────────────────────────────
function AdjustModal({ item, onClose, onSaved }) {
  const [delta,  setDelta]  = useState("");
  const [dir,    setDir]    = useState("add"); // add | subtract
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSave = async () => {
    const qty = parseFloat(delta);
    if (!delta || isNaN(qty) || qty <= 0) { setError("Enter a valid positive quantity."); return; }
    setSaving(true); setError("");

    const signed = dir === "add" ? qty : -qty;
    const before = Number(item.quantity_on_hand);
    const after  = before + signed;

    const { error: e1 } = await supabase.from("inventory_items")
      .update({ quantity_on_hand: after })
      .eq("id", item.id);
    if (e1) { setError(e1.message); setSaving(false); return; }

    const { error: e2 } = await supabase.from("inventory_transactions").insert({
      item_id:          item.id,
      transaction_type: "adjustment",
      quantity_delta:   signed,
      quantity_before:  before,
      quantity_after:   after,
      notes:            reason.trim() || null,
    });
    if (e2) { setError(e2.message); setSaving(false); return; }
    setSaving(false);
    onSaved();
  };

  return (
    <Modal title="Manual Adjustment" onClose={onClose}>
      <div style={{ fontSize:13, color:"var(--body)", marginBottom:16 }}>
        Adjusting: <strong style={{ color:"var(--white)" }}>{item.name}</strong>
        <span style={{ color:"var(--muted)", marginLeft:8 }}>Current: <strong style={{ color:"var(--text)" }}>{item.quantity_on_hand} {item.unit}</strong></span>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {["add","subtract"].map(d => (
          <button key={d} onClick={() => setDir(d)} style={{
            flex:1, padding:"8px 0", borderRadius:5, border:`1px solid ${dir===d ? "var(--accent)" : "var(--border)"}`,
            background: dir===d ? "var(--accent-dim)" : "var(--raised)",
            color: dir===d ? "var(--accent)" : "var(--body)", cursor:"pointer",
            fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em",
          }}>{d === "add" ? "+ Add Stock" : "− Remove Stock"}</button>
        ))}
      </div>
      <Field label="Quantity">
        <input style={inputStyle} type="number" min="0.01" step="any" value={delta} onChange={e => setDelta(e.target.value)} placeholder="e.g. 12" />
      </Field>
      <Field label="Reason (required)">
        <input style={inputStyle} value={reason} onChange={e => setReason(e.target.value)} placeholder="Physical count, damage write-off, correction…" />
      </Field>
      {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Apply Adjustment"}</button>
      </div>
    </Modal>
  );
}

// ─── ITEM HISTORY MODAL ──────────────────────────────────────
function ItemHistoryModal({ item, onClose }) {
  const [txns, setTxns] = useState(null);

  useEffect(() => {
    supabase.from("inventory_transactions")
      .select("*")
      .eq("item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => setTxns(data || []));
  }, [item.id]);

  const typeLabel = { deduction:"Deduction", adjustment:"Adjustment", receipt:"Receipt" };
  const typeColor = { deduction:"var(--red)", adjustment:"var(--accent)", receipt:"var(--green)" };

  return (
    <Modal title={`History — ${item.name}`} onClose={onClose} wide>
      {txns === null ? (
        <div style={{ fontSize:12, color:"var(--muted)", padding:"20px 0", textAlign:"center" }}>Loading…</div>
      ) : txns.length === 0 ? (
        <div style={{ fontSize:12, color:"var(--dim)", padding:"20px 0", textAlign:"center" }}>No transactions yet.</div>
      ) : (
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Date","Type","Delta","Before","After","Notes"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"6px 10px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {txns.map(t => (
              <tr key={t.id} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"7px 10px", color:"var(--body)" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ padding:"7px 10px" }}>
                  <span style={{ color: typeColor[t.transaction_type] || "var(--text)", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, textTransform:"uppercase" }}>
                    {typeLabel[t.transaction_type] || t.transaction_type}
                  </span>
                </td>
                <td style={{ padding:"7px 10px", color: t.quantity_delta >= 0 ? "var(--green)" : "var(--red)", fontWeight:700 }}>
                  {t.quantity_delta > 0 ? "+" : ""}{t.quantity_delta}
                </td>
                <td style={{ padding:"7px 10px", color:"var(--body)" }}>{t.quantity_before}</td>
                <td style={{ padding:"7px 10px", color:"var(--text)" }}>{t.quantity_after}</td>
                <td style={{ padding:"7px 10px", color:"var(--muted)" }}>{t.notes || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:16 }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

// ─── ITEM DETAIL MODAL ──────────────────────────────────────
function ItemDetailModal({ item, onClose, onEdit, suppliers }) {
  const [pricing, setPricing] = useState(null);
  const [txns, setTxns]       = useState(null);

  useEffect(() => {
    supabase.from("supplier_pricing")
      .select("*, suppliers(name)")
      .eq("item_id", item.id)
      .order("unit_cost")
      .then(({ data }) => setPricing(data || []));
    supabase.from("inventory_transactions")
      .select("*")
      .eq("item_id", item.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => setTxns(data || []));
  }, [item.id]);

  const typeLabel = { deduction: "Deduction", adjustment: "Adjustment", receipt: "Receipt" };
  const typeColor = { deduction: "var(--red)", adjustment: "var(--accent)", receipt: "var(--green)" };

  const InfoRow = ({ label, value, accent }) => (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>{label}</span>
      <span style={{ fontSize: 13, color: accent ? "var(--accent)" : "var(--text)", fontWeight: accent ? 600 : 400 }}>{value || "—"}</span>
    </div>
  );

  return (
    <Modal title="Part Details" onClose={onClose} wide>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        {/* Left: Info */}
        <div style={{ flex: "1 1 280px", minWidth: 260 }}>
          <div style={{ fontSize: 18, color: "var(--white)", fontWeight: 700, marginBottom: 4 }}>{item.name}</div>
          {item.description && <div style={{ fontSize: 12, color: "var(--body)", marginBottom: 12 }}>{item.description}</div>}

          <InfoRow label="SKU" value={item.sku} />
          <InfoRow label="Part Number" value={item.part_number} accent />
          <InfoRow label="Barcode" value={item.barcode} />
          <InfoRow label="Category" value={CATEGORY_LABELS[item.category] || item.category} />
          <InfoRow label="Supplier" value={item.suppliers?.name} />
          <InfoRow label="Unit" value={item.unit} />

          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--muted)" }}>Qty on Hand</span>
            <QtyBadge qty={Number(item.quantity_on_hand)} threshold={item.reorder_threshold} />
          </div>
          <InfoRow label="Reorder Threshold" value={item.reorder_threshold ?? "Not set"} />
          <InfoRow label="Reorder Qty" value={item.reorder_quantity ?? "Not set"} />
          {item.notes && (
            <div style={{ marginTop: 12, fontSize: 12, color: "var(--body)", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "8px 12px" }}>
              {item.notes}
            </div>
          )}
        </div>

        {/* Right: Pricing + Recent History */}
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          {/* Supplier pricing */}
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Supplier Pricing</div>
          {pricing === null ? (
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>Loading…</div>
          ) : pricing.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--dim)", marginBottom: 16 }}>No pricing on file.</div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {pricing.map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 12, color: "var(--text)" }}>{p.suppliers?.name}</span>
                  <span style={{ fontSize: 12, color: "var(--white)", fontWeight: 600 }}>${Number(p.unit_cost).toFixed(2)}/{item.unit}</span>
                </div>
              ))}
            </div>
          )}

          {/* Recent transactions */}
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 8 }}>Recent Activity</div>
          {txns === null ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Loading…</div>
          ) : txns.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--dim)" }}>No transactions yet.</div>
          ) : (
            <div>
              {txns.map(t => (
                <div key={t.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 11, color: "var(--body)", minWidth: 70 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                  <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, textTransform: "uppercase", color: typeColor[t.transaction_type] || "var(--text)", minWidth: 70 }}>
                    {typeLabel[t.transaction_type] || t.transaction_type}
                  </span>
                  <span style={{ fontSize: 12, color: t.quantity_delta >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                    {t.quantity_delta > 0 ? "+" : ""}{t.quantity_delta}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notes || ""}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        {onEdit && (
          <button className="btn btn-primary" onClick={() => onEdit(item)}>
            <IcoEdit /> Edit Item
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── SUPPLIER MODAL ───────────────────────────────────────────
function SupplierModal({ supplier, onClose, onSaved }) {
  const isEdit = !!supplier?.id;
  const [form, setForm] = useState({
    name:        supplier?.name        || "",
    website_url: supplier?.website_url || "",
    notes:       supplier?.notes       || "",
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const payload = { name: form.name.trim(), website_url: form.website_url.trim() || null, notes: form.notes.trim() || null };
    const { error: err } = isEdit
      ? await supabase.from("suppliers").update(payload).eq("id", supplier.id)
      : await supabase.from("suppliers").insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); onSaved();
  };

  return (
    <Modal title={isEdit ? "Edit Supplier" : "New Supplier"} onClose={onClose}>
      <Field label="Supplier Name"><input style={inputStyle} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. O'Reilly's" /></Field>
      <Field label="Website URL"><input style={inputStyle} value={form.website_url} onChange={e => set("website_url", e.target.value)} placeholder="https://…" /></Field>
      <Field label="Notes"><textarea style={{ ...inputStyle, minHeight:60, resize:"vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} /></Field>
      {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : isEdit ? "Save Changes" : "Add Supplier"}</button>
      </div>
    </Modal>
  );
}

// ─── SUPPLIER PRICING MODAL ───────────────────────────────────
function SupplierPricingModal({ item, suppliers, onClose, onSaved }) {
  const [pricing,  setPricing]  = useState(null);
  const [adding,   setAdding]   = useState(false);
  const [newForm,  setNewForm]  = useState({ supplier_id:"", unit_cost:"", notes:"" });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [deleting, setDeleting] = useState(null);

  const load = () => {
    supabase.from("supplier_pricing")
      .select("*, suppliers(name)")
      .eq("item_id", item.id)
      .order("unit_cost")
      .then(({ data }) => setPricing(data || []));
  };
  useEffect(load, [item.id]);

  const handleAdd = async () => {
    if (!newForm.supplier_id) { setError("Select a supplier."); return; }
    if (!newForm.unit_cost || isNaN(Number(newForm.unit_cost))) { setError("Enter a valid cost."); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("supplier_pricing").upsert({
      item_id:     item.id,
      supplier_id: newForm.supplier_id,
      unit_cost:   Number(newForm.unit_cost),
      notes:       newForm.notes.trim() || null,
    }, { onConflict: "item_id,supplier_id" });
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setAdding(false); setNewForm({ supplier_id:"", unit_cost:"", notes:"" }); load(); onSaved?.();
  };

  const handleDelete = async (pid) => {
    setDeleting(pid);
    await supabase.from("supplier_pricing").delete().eq("id", pid);
    setDeleting(null); load();
  };

  const assignedSupplierIds = new Set((pricing || []).map(p => p.supplier_id));
  const availableSuppliers = suppliers.filter(s => !assignedSupplierIds.has(s.id) || newForm.supplier_id === s.id);

  return (
    <Modal title={`Supplier Pricing — ${item.name}`} onClose={onClose}>
      {pricing === null ? (
        <div style={{ fontSize:12, color:"var(--muted)", padding:"12px 0" }}>Loading…</div>
      ) : pricing.length === 0 && !adding ? (
        <div style={{ fontSize:12, color:"var(--dim)", padding:"12px 0" }}>No pricing set yet.</div>
      ) : (
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Supplier","Unit Cost","Notes",""].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"5px 8px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricing.map(p => (
              <tr key={p.id} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"7px 8px", color:"var(--text)" }}>{p.suppliers?.name}</td>
                <td style={{ padding:"7px 8px", color:"var(--white)", fontWeight:600 }}>${Number(p.unit_cost).toFixed(2)}</td>
                <td style={{ padding:"7px 8px", color:"var(--muted)" }}>{p.notes || "—"}</td>
                <td style={{ padding:"7px 8px" }}>
                  <button onClick={() => handleDelete(p.id)} disabled={deleting===p.id} style={{ background:"none", border:"none", color:"var(--red)", cursor:"pointer", padding:4 }}>
                    {deleting===p.id ? "…" : <IcoTrash />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {adding ? (
        <div style={{ background:"var(--raised)", border:"1px solid var(--border)", borderRadius:6, padding:14, marginBottom:12 }}>
          <div style={{ display:"flex", gap:10, marginBottom:10 }}>
            <div style={{ flex:2 }}>
              <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Supplier</label>
              <select style={selectStyle} value={newForm.supplier_id} onChange={e => setNewForm(f => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Select…</option>
                {availableSuppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Unit Cost ($)</label>
              <input style={inputStyle} type="number" min="0" step="0.01" value={newForm.unit_cost} onChange={e => setNewForm(f => ({ ...f, unit_cost: e.target.value }))} placeholder="0.00" />
            </div>
          </div>
          <div style={{ marginBottom:10 }}>
            <label style={{ display:"block", fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Notes</label>
            <input style={inputStyle} value={newForm.notes} onChange={e => setNewForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
          </div>
          {error && <div className="error-box" style={{ marginBottom:8 }}>{error}</div>}
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setError(""); }}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleAdd} disabled={saving}>{saving ? "Saving…" : "Add Pricing"}</button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-sm" style={{ marginBottom:12 }} onClick={() => setAdding(true)}>
          <IcoPlus /> Add Supplier Price
        </button>
      )}
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}

// ─── CREATE PO MODAL ─────────────────────────────────────────
function CreatePOModal({ items, suppliers, onClose, onSaved }) {
  const [supplierId, setSupplierId] = useState("");
  const [notes,      setNotes]      = useState("");
  const [lines,      setLines]      = useState([{ item_id:"", quantity_ordered:1, unit_cost:"" }]);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const addLine = () => setLines(l => [...l, { item_id:"", quantity_ordered:1, unit_cost:"" }]);
  const removeLine = (i) => setLines(l => l.filter((_,j) => j!==i));
  const setLine = (i, k, v) => setLines(l => { const n=[...l]; n[i]={...n[i],[k]:v}; return n; });

  // When an item is selected on a line, try to pre-fill cost from cheapest supplier pricing
  const [supplierPricing, setSupplierPricing] = useState({});
  useEffect(() => {
    if (!supplierId) return;
    supabase.from("supplier_pricing")
      .select("item_id, unit_cost")
      .eq("supplier_id", supplierId)
      .then(({ data }) => {
        const map = {};
        (data||[]).forEach(p => { map[p.item_id] = p.unit_cost; });
        setSupplierPricing(map);
      });
  }, [supplierId]);

  const handleItemSelect = (lineIdx, itemId) => {
    const cost = supplierPricing[itemId] ?? "";
    setLine(lineIdx, "item_id", itemId);
    setLine(lineIdx, "unit_cost", cost !== "" ? String(cost) : "");
  };

  const poTotal = lines.reduce((sum, l) => {
    const qty  = parseFloat(l.quantity_ordered) || 0;
    const cost = parseFloat(l.unit_cost) || 0;
    return sum + qty * cost;
  }, 0);

  const handleSave = async () => {
    if (!supplierId) { setError("Select a supplier."); return; }
    const validLines = lines.filter(l => l.item_id && l.quantity_ordered > 0);
    if (validLines.length === 0) { setError("Add at least one line item."); return; }
    for (const l of validLines) {
      if (!l.unit_cost || isNaN(Number(l.unit_cost))) { setError("All line items need a unit cost."); return; }
    }
    setSaving(true); setError("");

    const { data: po, error: e1 } = await supabase.from("purchase_orders")
      .insert({ supplier_id: supplierId, notes: notes.trim() || null })
      .select("id")
      .single();
    if (e1) { setError(e1.message); setSaving(false); return; }

    const linePayload = validLines.map(l => ({
      po_id:            po.id,
      item_id:          l.item_id,
      quantity_ordered: Number(l.quantity_ordered),
      unit_cost:        Number(l.unit_cost),
    }));
    const { error: e2 } = await supabase.from("purchase_order_lines").insert(linePayload);
    if (e2) { setError(e2.message); setSaving(false); return; }

    // Update supplier_pricing last_used_at for each item
    for (const l of validLines) {
      await supabase.from("supplier_pricing")
        .update({ unit_cost: Number(l.unit_cost), last_used_at: new Date().toISOString() })
        .eq("item_id", l.item_id)
        .eq("supplier_id", supplierId);
    }

    setSaving(false); onSaved();
  };

  return (
    <Modal title="New Purchase Order" onClose={onClose} wide>
      <div style={{ display:"flex", gap:12, marginBottom:14 }}>
        <div style={{ flex:2 }}>
          <Field label="Supplier">
            <select style={selectStyle} value={supplierId} onChange={e => setSupplierId(e.target.value)}>
              <option value="">Select supplier…</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
        </div>
        <div style={{ flex:3 }}>
          <Field label="Notes (optional)">
            <input style={inputStyle} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes for this PO" />
          </Field>
        </div>
      </div>

      {/* Line items */}
      <div style={{ marginBottom:8, fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>Line Items</div>
      <div style={{ border:"1px solid var(--border)", borderRadius:6, overflow:"hidden", marginBottom:10 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 12px", borderBottom: i < lines.length-1 ? "1px solid var(--border)" : "none", background: i%2===0 ? "var(--raised)" : "transparent" }}>
            <div style={{ flex:3 }}>
              <select style={selectStyle} value={line.item_id} onChange={e => handleItemSelect(i, e.target.value)}>
                <option value="">Select item…</option>
                {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}
              </select>
            </div>
            <div style={{ flex:1 }}>
              <input style={inputStyle} type="number" min="1" step="any" value={line.quantity_ordered} onChange={e => setLine(i, "quantity_ordered", e.target.value)} placeholder="Qty" />
            </div>
            <div style={{ flex:1 }}>
              <input style={inputStyle} type="number" min="0" step="0.01" value={line.unit_cost} onChange={e => setLine(i, "unit_cost", e.target.value)} placeholder="Unit $" />
            </div>
            <div style={{ width:60, textAlign:"right", color:"var(--muted)", fontSize:12, fontWeight:600 }}>
              {line.item_id && line.unit_cost ? `$${(parseFloat(line.quantity_ordered||0)*parseFloat(line.unit_cost||0)).toFixed(2)}` : "—"}
            </div>
            <button onClick={() => removeLine(i)} disabled={lines.length===1} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:"4px 6px" }}>×</button>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <button className="btn btn-ghost btn-sm" onClick={addLine}><IcoPlus /> Add Line</button>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:"var(--white)" }}>
          Total: <span style={{ color:"var(--accent)" }}>${poTotal.toFixed(2)}</span>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Creating PO…" : "Create PO"}</button>
      </div>
    </Modal>
  );
}

// ─── PO DETAIL MODAL ─────────────────────────────────────────
function PODetailModal({ po, onClose, onUpdated }) {
  const [poLines, setPoLines] = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    supabase.from("purchase_order_lines")
      .select("*, inventory_items(name, unit)")
      .eq("po_id", po.id)
      .then(({ data }) => setPoLines(data || []));
  }, [po.id]);

  const total = (poLines||[]).reduce((s,l) => s + Number(l.line_total||0), 0);

  const advanceStatus = async () => {
    setSaving(true); setError("");
    const nextStatus = po.status === "ordered" ? "shipped" : "received";
    const timestamp  = nextStatus === "shipped" ? { shipped_at: new Date().toISOString() } : { received_at: new Date().toISOString() };

    const { error: e1 } = await supabase.from("purchase_orders")
      .update({ status: nextStatus, ...timestamp })
      .eq("id", po.id);
    if (e1) { setError(e1.message); setSaving(false); return; }

    // On received: mark all lines as fully received (triggers inventory credit)
    if (nextStatus === "received") {
      for (const line of (poLines||[])) {
        if (line.quantity_received < line.quantity_ordered) {
          const { error: e2 } = await supabase.from("purchase_order_lines")
            .update({ quantity_received: line.quantity_ordered })
            .eq("id", line.id);
          if (e2) { setError(e2.message); setSaving(false); return; }
        }
      }
    }
    setSaving(false); onUpdated();
  };

  const btnLabel = po.status === "ordered" ? "Mark as Shipped" : po.status === "shipped" ? "Mark as Received" : null;

  return (
    <Modal title={`PO Detail — ${po.po_number}`} onClose={onClose} wide>
      <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ flex:1, minWidth:160 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Supplier</div>
          <div style={{ fontSize:13, color:"var(--text)" }}>{po.suppliers?.name || "—"}</div>
          {po.suppliers?.website_url && (
            <a href={po.suppliers.website_url} target="_blank" rel="noreferrer" style={{ fontSize:11, color:"var(--accent)", display:"inline-flex", alignItems:"center", gap:4, marginTop:4, textDecoration:"none" }}>
              <IcoLink /> Visit site
            </a>
          )}
        </div>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Status</div>
          <POStatusBadge status={po.status} />
        </div>
        <div style={{ flex:1, minWidth:120 }}>
          <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Ordered</div>
          <div style={{ fontSize:13, color:"var(--text)" }}>{po.ordered_at ? new Date(po.ordered_at).toLocaleDateString() : "—"}</div>
        </div>
        {po.shipped_at && (
          <div style={{ flex:1, minWidth:120 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Shipped</div>
            <div style={{ fontSize:13, color:"var(--text)" }}>{new Date(po.shipped_at).toLocaleDateString()}</div>
          </div>
        )}
        {po.received_at && (
          <div style={{ flex:1, minWidth:120 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4 }}>Received</div>
            <div style={{ fontSize:13, color:"var(--text)" }}>{new Date(po.received_at).toLocaleDateString()}</div>
          </div>
        )}
      </div>
      {po.notes && <div style={{ fontSize:12, color:"var(--body)", background:"var(--raised)", border:"1px solid var(--border)", borderRadius:5, padding:"8px 12px", marginBottom:16 }}>{po.notes}</div>}

      {poLines === null ? (
        <div style={{ fontSize:12, color:"var(--muted)", padding:"12px 0" }}>Loading lines…</div>
      ) : (
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Item","Qty Ordered","Unit Cost","Line Total","Received"].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"6px 10px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {poLines.map(l => (
              <tr key={l.id} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"8px 10px", color:"var(--text)" }}>{l.inventory_items?.name}</td>
                <td style={{ padding:"8px 10px", color:"var(--body)" }}>{l.quantity_ordered} {l.inventory_items?.unit}</td>
                <td style={{ padding:"8px 10px", color:"var(--body)" }}>${Number(l.unit_cost).toFixed(2)}</td>
                <td style={{ padding:"8px 10px", color:"var(--white)", fontWeight:600 }}>${Number(l.line_total||0).toFixed(2)}</td>
                <td style={{ padding:"8px 10px", color: l.quantity_received >= l.quantity_ordered ? "var(--green)" : "var(--muted)" }}>
                  {l.quantity_received} / {l.quantity_ordered}
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} style={{ padding:"8px 10px", textAlign:"right", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--muted)", letterSpacing:"0.1em" }}>Total</td>
              <td style={{ padding:"8px 10px", color:"var(--white)", fontWeight:700, fontSize:14 }}>${total.toFixed(2)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      )}

      {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        {btnLabel && (
          <button className="btn btn-primary" onClick={advanceStatus} disabled={saving}>
            {saving ? "Updating…" : btnLabel}
          </button>
        )}
      </div>
    </Modal>
  );
}

// ─── SCAN RESULT MODAL ──────────────────────────────────────
// Handles all 4 scan scenarios: no match, single match, multi match, fuzzy match
function ScanResultModal({ barcode, onClose, onRefresh, readOnly, suppliers, onScanAnother }) {
  const [status, setStatus]     = useState("loading"); // loading | no_match | single | multi | fuzzy
  const [matches, setMatches]   = useState([]);
  const [fuzzy, setFuzzy]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [addQty, setAddQty]     = useState(1);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState("");
  const [showNewItem, setShowNewItem] = useState(false);
  const [showEditIncomplete, setShowEditIncomplete] = useState(false);

  useEffect(() => {
    const lookup = async () => {
      // Exact match — join suppliers for display
      const { data: exact } = await supabase.from("inventory_items")
        .select("*, suppliers(name)")
        .eq("barcode", barcode);
      const found = exact || [];

      if (found.length === 1) {
        setMatches(found);
        setSelected(found[0]);
        setStatus("single");
        return;
      }
      if (found.length > 1) {
        setMatches(found);
        setStatus("multi");
        return;
      }

      // No exact match — try fuzzy (barcode starts with same prefix, off by 1 char)
      if (barcode.length >= 4) {
        const prefix = barcode.slice(0, -1);
        const { data: similar } = await supabase.from("inventory_items")
          .select("*, suppliers(name)")
          .like("barcode", `${prefix}%`)
          .limit(5);
        if (similar && similar.length > 0) {
          setFuzzy(similar);
          setStatus("fuzzy");
          return;
        }
      }

      setStatus("no_match");
    };
    lookup();
  }, [barcode]);

  const handleAddStock = async (andScanNew) => {
    if (!selected) return;
    const qty = parseFloat(addQty);
    if (!qty || qty <= 0) { setError("Enter a valid quantity."); return; }
    setSaving(true); setError("");

    const before = Number(selected.quantity_on_hand);
    const after = before + qty;

    const { error: e1 } = await supabase.from("inventory_items")
      .update({ quantity_on_hand: after })
      .eq("id", selected.id);
    if (e1) { setError(e1.message); setSaving(false); return; }

    await supabase.from("inventory_transactions").insert({
      item_id: selected.id,
      transaction_type: "adjustment",
      quantity_delta: qty,
      quantity_before: before,
      quantity_after: after,
      notes: `Barcode scan — added ${qty} unit(s)`,
    });

    setSaving(false);
    if (andScanNew && onScanAnother) {
      onScanAnother();
    } else {
      setDone(`Added ${qty} to "${selected.name}" (now ${after})`);
    }
  };

  const handleUseFuzzy = (item) => {
    setMatches([item]);
    setSelected(item);
    setStatus("single");
    setFuzzy([]);
  };

  // Render item card
  const ItemCard = ({ item, selectable, isSelected }) => (
    <div
      onClick={selectable ? () => setSelected(item) : undefined}
      style={{
        background: isSelected ? "var(--accent-dim)" : "var(--raised)",
        border: `1px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
        borderRadius: 6, padding: "10px 14px", marginBottom: 8,
        cursor: selectable ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "var(--white)", fontWeight: 600 }}>{item.name}</div>
        <QtyBadge qty={Number(item.quantity_on_hand)} threshold={item.reorder_threshold} />
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        {item.sku ? `SKU: ${item.sku}` : "No SKU"}
        {item.part_number ? <> · <span style={{ color: "var(--accent)" }}>Part #: {item.part_number}</span></> : ""}
        {item.suppliers?.name ? ` · ${item.suppliers.name}` : ""}
        {` · ${item.unit}`}
      </div>
    </div>
  );

  // Collect existing part numbers from matches for linking prompt
  const existingPartNumbers = [...new Set([...matches, ...fuzzy].map(m => m.part_number).filter(Boolean))];

  return (
    <Modal title="Scan Result" onClose={onClose}>
      {/* Scanned barcode display */}
      <div style={{ fontSize: 12, color: "var(--body)", marginBottom: 16 }}>
        Barcode: <strong style={{ color: "var(--white)", fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: "0.08em" }}>{barcode}</strong>
      </div>

      {/* Loading */}
      {status === "loading" && (
        <div style={{ fontSize: 12, color: "var(--muted)", padding: "20px 0", textAlign: "center" }}>Looking up barcode…</div>
      )}

      {/* Done message */}
      {done && (
        <div style={{ background: "var(--green-dim)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "var(--green)" }}>
          {done}
        </div>
      )}

      {/* No match */}
      {status === "no_match" && !done && (
        <div>
          <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 12 }}>No inventory item found for this barcode.</div>
          {!readOnly && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewItem(true)}>
              <IcoPlus /> Add as New Item
            </button>
          )}
          {readOnly && (
            <div style={{ fontSize: 12, color: "var(--dim)" }}>Contact an admin to add this item to inventory.</div>
          )}
        </div>
      )}

      {/* Single match — incomplete item (no name) */}
      {status === "single" && selected && !done && !selected.name && !readOnly && (
        <div>
          <div style={{ background: "var(--accent-dim)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 4 }}>Incomplete Item</div>
            <div style={{ fontSize: 12, color: "var(--body)" }}>This barcode is in the inventory but the item appears to be incomplete. Would you like to finish adding this item?</div>
          </div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 10 }}>
            {selected.sku ? `SKU: ${selected.sku}` : "No SKU"}
            {selected.barcode ? ` · Barcode: ${selected.barcode}` : ""}
            {selected.suppliers?.name ? ` · ${selected.suppliers.name}` : ""}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowNewItem(false) || setShowEditIncomplete(true)}>
            Complete Item Details
          </button>
        </div>
      )}

      {/* Single match — incomplete item (no name) — read-only */}
      {status === "single" && selected && !done && !selected.name && readOnly && (
        <div>
          <div style={{ background: "var(--accent-dim)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 6, padding: "12px 16px", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 4 }}>Incomplete Item</div>
            <div style={{ fontSize: 12, color: "var(--body)" }}>This barcode is in the inventory but the item appears to be incomplete. Contact an admin to finish adding this item.</div>
          </div>
        </div>
      )}

      {/* Single match — complete item */}
      {status === "single" && selected && !done && selected.name && (
        <div>
          <ItemCard item={selected} />
          {!readOnly && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Add Stock</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input
                  type="number" min="1" step="1"
                  value={addQty}
                  onChange={e => setAddQty(e.target.value)}
                  style={{
                    width: 80, background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 5,
                    padding: "7px 10px", fontSize: 13, color: "var(--white)", outline: "none", fontFamily: "'Barlow',sans-serif",
                  }}
                />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{selected.unit}(s)</span>
                <button className="btn btn-primary btn-sm" onClick={() => handleAddStock(false)} disabled={saving}>
                  {saving ? "Saving…" : `Add +${addQty || 1}`}
                </button>
                {onScanAnother && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddStock(true)} disabled={saving} style={{ background: "var(--green)", borderColor: "var(--green)" }}>
                    Add & Scan New
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiple matches */}
      {status === "multi" && !done && (
        <div>
          <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 12 }}>
            Multiple SKUs share this barcode. Select one:
          </div>
          {matches.map(m => (
            <ItemCard key={m.id} item={m} selectable isSelected={selected?.id === m.id} />
          ))}
          {selected && !readOnly && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Add Stock to Selected</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <input type="number" min="1" step="1" value={addQty} onChange={e => setAddQty(e.target.value)}
                  style={{ width: 80, background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "var(--white)", outline: "none", fontFamily: "'Barlow',sans-serif" }}
                />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{selected.unit}(s)</span>
                <button className="btn btn-primary btn-sm" onClick={() => handleAddStock(false)} disabled={saving}>
                  {saving ? "Saving…" : `Add +${addQty || 1}`}
                </button>
                {onScanAnother && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleAddStock(true)} disabled={saving} style={{ background: "var(--green)", borderColor: "var(--green)" }}>
                    Add & Scan New
                  </button>
                )}
              </div>
            </div>
          )}
          {!readOnly && (
            <div style={{ marginTop: 10 }}>
              {existingPartNumbers.length > 0 && (
                <div style={{ fontSize: 11, color: "var(--body)", marginBottom: 8 }}>
                  Adding a different vendor SKU for the same part? Select a part number to link:
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                    {existingPartNumbers.map(pn => (
                      <button key={pn} className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: "var(--accent)" }}
                        onClick={() => setShowNewItem(pn)}>
                        Link to {pn}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => setShowNewItem(true)}>
                {existingPartNumbers.length > 0 ? "Add without linking" : "None of these — Add as new item"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Fuzzy match */}
      {status === "fuzzy" && !done && (
        <div>
          <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 12 }}>
            No exact match. Similar barcode(s) found:
          </div>
          {fuzzy.map(m => (
            <div key={m.id} style={{ marginBottom: 8 }}>
              <ItemCard item={m} />
              {!readOnly && (
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 14, marginTop: -4 }} onClick={() => handleUseFuzzy(m)}>
                  This is the item
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowNewItem(true)}>
              <IcoPlus /> Add as New Item
            </button>
          )}
          {readOnly && fuzzy.length === 0 && (
            <div style={{ fontSize: 12, color: "var(--dim)" }}>Contact an admin to add this item to inventory.</div>
          )}
        </div>
      )}

      {error && <div className="error-box" style={{ marginTop: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
        <button className="btn btn-ghost" onClick={() => { if (done) { onRefresh(); } onClose(); }}>
          {done ? "Done" : "Close"}
        </button>
      </div>

      {/* Inline new item modal */}
      {showNewItem && (
        <ItemModal
          item={{ barcode }}
          suppliers={suppliers}
          prefillPartNumber={typeof showNewItem === "string" ? showNewItem : undefined}
          onClose={() => setShowNewItem(false)}
          onSaved={() => { setShowNewItem(false); setDone("New item added to inventory."); }}
          onSavedAndScan={onScanAnother ? () => { setShowNewItem(false); onScanAnother(); } : undefined}
        />
      )}

      {/* Inline edit modal for incomplete item */}
      {showEditIncomplete && selected && (
        <ItemModal
          item={selected}
          suppliers={suppliers}
          onClose={() => setShowEditIncomplete(false)}
          onSaved={() => { setShowEditIncomplete(false); setDone("Item details updated."); }}
          onSavedAndScan={onScanAnother ? () => { setShowEditIncomplete(false); onScanAnother(); } : undefined}
        />
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── ITEMS TAB ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function ItemsTab({ suppliers }) {
  const [items,      setItems]      = useState(null);
  const [filter,     setFilter]     = useState("all"); // all | low | negative
  const [catFilter,  setCatFilter]  = useState("all");
  const [search,     setSearch]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [modal,      setModal]      = useState(null); // null | {type, data}
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult]   = useState(null); // barcode string

  const load = () => {
    supabase.from("inventory_items")
      .select("*, suppliers(name)")
      .order("name")
      .limit(1000)
      .then(({ data }) => setItems(data || []));
  };
  useEffect(load, []);

  // Debounce search (300ms)
  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 300); return () => clearTimeout(t); }, [search]);

  const visible = (items || []).filter(it => {
    if (filter === "low"      && !(it.quantity_on_hand < 0 === false && it.reorder_threshold != null && it.quantity_on_hand <= it.reorder_threshold)) return false;
    if (filter === "negative" && it.quantity_on_hand >= 0) return false;
    if (catFilter !== "all"   && it.category !== catFilter) return false;
    const q = debouncedSearch.toLowerCase();
    if (q && !it.name.toLowerCase().includes(q) && !(it.sku||"").toLowerCase().includes(q) && !(it.barcode||"").toLowerCase().includes(q) && !(it.part_number||"").toLowerCase().includes(q) && !(it.suppliers?.name||"").toLowerCase().includes(q)) return false;
    return true;
  });

  const negCount = (items||[]).filter(it => it.quantity_on_hand < 0).length;
  const lowCount = (items||[]).filter(it => it.quantity_on_hand >= 0 && it.reorder_threshold != null && it.quantity_on_hand <= it.reorder_threshold).length;

  const close = () => { setModal(null); load(); };

  return (
    <div>
      {/* Controls */}
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search name, SKU, part #, or barcode…"
          style={{ ...inputStyle, width:200, flex:"0 0 auto" }}
        />
        <select style={{ ...selectStyle, width:160, flex:"0 0 auto" }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {CATEGORY_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <div style={{ display:"flex", gap:6 }}>
          {[
            { id:"all",      label:"All Items" },
            { id:"low",      label:`Low Stock${lowCount > 0 ? ` (${lowCount})` : ""}`,      color:"var(--accent)" },
            { id:"negative", label:`Negative${negCount > 0 ? ` (${negCount})` : ""}`,        color:"var(--red)"    },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              padding:"5px 12px", borderRadius:5, border:`1px solid ${filter===f.id ? (f.color||"var(--accent)") : "var(--border)"}`,
              background: filter===f.id ? "var(--accent-dim)" : "var(--raised)",
              color: filter===f.id ? (f.color||"var(--accent)") : "var(--muted)",
              cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
            }}>{f.label}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginLeft:"auto" }}><IcoRefresh /></button>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowScanner(true)} style={{ display:"inline-flex", alignItems:"center", gap:4 }}><IcoBarcode /> Scan Barcode</button>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ type:"item", data:null })}><IcoPlus /> New Item</button>
      </div>

      {/* Table */}
      {items === null ? (
        <div style={{ fontSize:12, color:"var(--muted)", padding:"32px 0", textAlign:"center" }}>Loading inventory…</div>
      ) : visible.length === 0 ? (
        <div style={{ fontSize:12, color:"var(--dim)", padding:"32px 0", textAlign:"center" }}>No items match the current filter.</div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["Name","SKU","Part #","Barcode","Supplier","Qty","Threshold",""].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"6px 10px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(it => (
                <tr key={it.id} onClick={() => setModal({ type:"detail", data:it })} style={{ borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--raised)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <td style={{ padding:"9px 10px", color:"var(--white)", fontWeight:600 }}>{it.name}</td>
                  <td style={{ padding:"9px 10px", color:"var(--muted)", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:"0.04em" }}>{it.sku || "—"}</td>
                  <td style={{ padding:"9px 10px", color:"var(--accent)", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:600, letterSpacing:"0.04em" }}>{it.part_number || "—"}</td>
                  <td style={{ padding:"9px 10px", color:"var(--body)", fontSize:11, fontFamily:"'Barlow Condensed',sans-serif", letterSpacing:"0.04em" }}>{it.barcode || "—"}</td>
                  <td style={{ padding:"9px 10px", color:"var(--muted)" }}>{it.suppliers?.name || "—"}</td>
                  <td style={{ padding:"9px 10px" }}><QtyBadge qty={Number(it.quantity_on_hand)} threshold={it.reorder_threshold} /></td>
                  <td style={{ padding:"9px 10px", color:"var(--dim)", fontSize:11 }}>{it.reorder_threshold != null ? it.reorder_threshold : "—"}</td>
                  <td style={{ padding:"9px 10px" }} onClick={e => e.stopPropagation()}>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button title="Transaction History" onClick={() => setModal({ type:"history", data:it })} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5 }}><IcoPkg /></button>
                      <button title="Supplier Pricing" onClick={() => setModal({ type:"pricing", data:it })} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5 }}><IcoLink /></button>
                      <button title="Manual Adjustment" onClick={() => setModal({ type:"adjust", data:it })} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5 }}><IcoAdjust /></button>
                      <button title="Edit" onClick={() => setModal({ type:"item", data:it })} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5 }}><IcoEdit /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {modal?.type === "detail"  && <ItemDetailModal  item={modal.data}    onClose={close} suppliers={suppliers} onEdit={(it) => setModal({ type:"item", data:it })} />}
      {modal?.type === "item"    && <ItemModal       item={modal.data}     onClose={close} onSaved={close} suppliers={suppliers} />}
      {modal?.type === "adjust"  && <AdjustModal     item={modal.data}     onClose={close} onSaved={close} />}
      {modal?.type === "history" && <ItemHistoryModal item={modal.data}    onClose={close} />}
      {modal?.type === "pricing" && <SupplierPricingModal item={modal.data} suppliers={suppliers} onClose={close} onSaved={load} />}

      {/* Barcode scanner */}
      {showScanner && (
        <BarcodeScanner
          onScan={(code) => { setShowScanner(false); setScanResult(code); }}
          onClose={() => setShowScanner(false)}
        />
      )}
      {scanResult && (
        <ScanResultModal
          barcode={scanResult}
          suppliers={suppliers}
          onClose={() => setScanResult(null)}
          onRefresh={() => { setScanResult(null); load(); }}
          onScanAnother={() => { setScanResult(null); load(); setShowScanner(true); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── ORDERS TAB ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function OrdersTab({ items, suppliers }) {
  const [orders,    setOrders]    = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal,     setModal]     = useState(null);

  const load = () => {
    supabase.from("purchase_orders")
      .select("*, suppliers(name, website_url)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data || []));
  };
  useEffect(load, []);

  const [lineCounts, setLineCounts] = useState({});
  const [lineTotals, setLineTotals] = useState({});
  useEffect(() => {
    if (!orders || orders.length === 0) return;
    supabase.from("purchase_order_lines")
      .select("po_id, line_total")
      .in("po_id", orders.map(o => o.id))
      .then(({ data }) => {
        const counts = {};
        const totals = {};
        (data||[]).forEach(l => {
          counts[l.po_id] = (counts[l.po_id]||0) + 1;
          totals[l.po_id] = (totals[l.po_id]||0) + Number(l.line_total||0);
        });
        setLineCounts(counts);
        setLineTotals(totals);
      });
  }, [orders]);

  const visible = (orders||[]).filter(o => statusFilter === "all" || o.status === statusFilter);
  const close = () => { setModal(null); load(); };

  return (
    <div>
      {/* Reorder suggestions panel */}
      <ReorderSuggestionsPanel items={items} suppliers={suppliers} onCreatePO={() => setModal({ type:"create" })} />

      <div style={{ display:"flex", gap:10, marginBottom:16, alignItems:"center", flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6 }}>
          {["all","ordered","shipped","received"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding:"5px 12px", borderRadius:5,
              border:`1px solid ${statusFilter===s ? "var(--accent)" : "var(--border)"}`,
              background: statusFilter===s ? "var(--accent-dim)" : "var(--raised)",
              color: statusFilter===s ? "var(--accent)" : "var(--muted)",
              cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em",
            }}>{s === "all" ? "All Orders" : s.charAt(0).toUpperCase()+s.slice(1)}</button>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load} style={{ marginLeft:"auto" }}><IcoRefresh /></button>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ type:"create" })}><IcoPlus /> New PO</button>
      </div>

      {orders === null ? (
        <div style={{ fontSize:12, color:"var(--muted)", padding:"32px 0", textAlign:"center" }}>Loading orders…</div>
      ) : visible.length === 0 ? (
        <div style={{ fontSize:12, color:"var(--dim)", padding:"32px 0", textAlign:"center" }}>No purchase orders found.</div>
      ) : (
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid var(--border)" }}>
                {["PO #","Supplier","Ordered","Status","Lines","Total",""].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"6px 10px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(o => (
                <tr key={o.id} onClick={() => setModal({ type:"detail", data:o })} style={{ borderBottom:"1px solid var(--border)", cursor:"pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background="var(--raised)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                >
                  <td style={{ padding:"9px 10px", color:"var(--white)", fontWeight:700, fontFamily:"'Barlow Condensed',sans-serif" }}>{o.po_number}</td>
                  <td style={{ padding:"9px 10px", color:"var(--text)" }}>{o.suppliers?.name || "—"}</td>
                  <td style={{ padding:"9px 10px", color:"var(--body)" }}>{o.ordered_at ? new Date(o.ordered_at).toLocaleDateString() : "—"}</td>
                  <td style={{ padding:"9px 10px" }}><POStatusBadge status={o.status} /></td>
                  <td style={{ padding:"9px 10px", color:"var(--muted)" }}>{lineCounts[o.id] ?? "—"}</td>
                  <td style={{ padding:"9px 10px", color:"var(--white)", fontWeight:600 }}>{lineTotals[o.id] != null ? `$${Number(lineTotals[o.id]).toFixed(2)}` : "—"}</td>
                  <td style={{ padding:"9px 10px" }}>
                    <span style={{ color:"var(--accent)", fontSize:16 }}><IcoChevron /></span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === "create" && <CreatePOModal items={items} suppliers={suppliers} onClose={close} onSaved={close} />}
      {modal?.type === "detail" && <PODetailModal po={modal.data} onClose={close} onUpdated={close} />}
    </div>
  );
}

// ─── REORDER SUGGESTIONS PANEL ───────────────────────────────
function ReorderSuggestionsPanel({ items, suppliers }) {
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    supabase.from("supplier_pricing")
      .select("item_id, supplier_id, unit_cost, suppliers(name)")
      .then(({ data }) => setPricing(data || []));
  }, []);

  if (!items || !pricing) return null;

  // Items at or below threshold
  const lowItems = items.filter(it => it.reorder_threshold != null && it.quantity_on_hand <= it.reorder_threshold);
  if (lowItems.length === 0) return null;

  // For each low item, find cheapest supplier
  const suggestions = lowItems.map(it => {
    const prices = pricing.filter(p => p.item_id === it.id).sort((a,b) => a.unit_cost - b.unit_cost);
    const best = prices[0] || null;
    return { item: it, best };
  });

  return (
    <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid var(--accent-rim)", borderRadius:8, padding:"14px 16px", marginBottom:18 }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--accent)", marginBottom:10 }}>
        Low Stock — Reorder Suggestions
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {suggestions.map(({ item: it, best }) => (
          <div key={it.id} style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
            <div style={{ flex:2, minWidth:140 }}>
              <span style={{ fontSize:13, color:"var(--white)", fontWeight:600 }}>{it.name}</span>
              <span style={{ fontSize:11, color:"var(--muted)", marginLeft:8 }}>
                {Number(it.quantity_on_hand)} {it.unit} on hand · threshold {it.reorder_threshold}
              </span>
            </div>
            <div style={{ flex:1, minWidth:140, fontSize:12 }}>
              {best ? (
                <span style={{ color:"var(--green)" }}>
                  Cheapest: <strong>{best.suppliers?.name}</strong> @ ${Number(best.unit_cost).toFixed(2)}/{it.unit}
                </span>
              ) : (
                <span style={{ color:"var(--dim)" }}>No pricing on file</span>
              )}
            </div>
            <div style={{ fontSize:11, color:"var(--muted)" }}>
              {it.reorder_quantity ? `Suggested qty: ${it.reorder_quantity}` : "No reorder qty set"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── SUPPLIERS TAB ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
function SuppliersTab({ suppliers, reload }) {
  const [modal,    setModal]    = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [confirm,  setConfirm]  = useState(null);

  const handleDelete = async (s) => {
    if (confirm !== s.id) { setConfirm(s.id); return; }
    setDeleting(s.id); setConfirm(null);
    await supabase.from("suppliers").delete().eq("id", s.id);
    setDeleting(null); reload();
  };

  const close = () => { setModal(null); reload(); };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => setModal({ data:null })}><IcoPlus /> New Supplier</button>
      </div>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Supplier","Website","Notes",""].map(h => (
                <th key={h} style={{ textAlign:"left", padding:"6px 10px", fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} style={{ borderBottom:"1px solid var(--border)" }}>
                <td style={{ padding:"9px 10px", color:"var(--white)", fontWeight:600 }}>{s.name}</td>
                <td style={{ padding:"9px 10px" }}>
                  {s.website_url
                    ? <a href={s.website_url} target="_blank" rel="noreferrer" style={{ color:"var(--accent)", fontSize:12, textDecoration:"none", display:"inline-flex", alignItems:"center", gap:4 }}><IcoLink />{s.website_url.replace(/^https?:\/\//, "")}</a>
                    : <span style={{ color:"var(--dim)" }}>—</span>
                  }
                </td>
                <td style={{ padding:"9px 10px", color:"var(--muted)" }}>{s.notes || "—"}</td>
                <td style={{ padding:"9px 10px" }}>
                  <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                    <button onClick={() => setModal({ data:s })} style={{ background:"none", border:"none", color:"var(--muted)", cursor:"pointer", padding:5 }}><IcoEdit /></button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deleting===s.id}
                      style={{ background:"none", border:"none", color: confirm===s.id ? "var(--red)" : "var(--muted)", cursor:"pointer", padding:5, fontFamily:"'Barlow',sans-serif", fontSize:12 }}
                    >
                      {confirm===s.id ? "Confirm?" : deleting===s.id ? "…" : <IcoTrash />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && <SupplierModal supplier={modal.data} onClose={close} onSaved={close} />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ─── ROOT EXPORT ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════
export default function AdminInventory() {
  const [subTab,     setSubTab]     = useState("items");
  const [suppliers,  setSuppliers]  = useState([]);
  const [items,      setItems]      = useState([]);

  const loadSuppliers = () => {
    supabase.from("suppliers").select("*").order("name").then(({ data }) => setSuppliers(data||[]));
  };
  const loadItems = () => {
    supabase.from("inventory_items").select("*").order("name").then(({ data }) => setItems(data||[]));
  };

  useEffect(() => { loadSuppliers(); loadItems(); }, []);

  const SUB_TABS = [
    { id:"items",     label:"Items"            },
    { id:"orders",    label:"Purchase Orders"  },
    { id:"suppliers", label:"Suppliers"        },
  ];

  return (
    <div>
      {/* Sub-tab nav */}
      <div style={{ display:"flex", gap:4, marginBottom:22, borderBottom:"1px solid var(--border)", paddingBottom:0 }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSubTab(t.id)} style={{
            padding:"8px 16px", background:"none", border:"none",
            borderBottom:`2px solid ${subTab===t.id ? "var(--accent)" : "transparent"}`,
            color: subTab===t.id ? "var(--accent)" : "var(--muted)",
            cursor:"pointer", fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:13, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em",
            marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>

      {subTab === "items"     && <ItemsTab suppliers={suppliers} />}
      {subTab === "orders"    && <OrdersTab items={items} suppliers={suppliers} />}
      {subTab === "suppliers" && <SuppliersTab suppliers={suppliers} reload={loadSuppliers} />}
    </div>
  );
}
