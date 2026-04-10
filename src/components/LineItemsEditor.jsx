import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { DEFAULT_RATE } from "../lib/constants";

// ─── CSS injected once ──────────────────────────────────────
const STYLE_ID = "line-items-editor-css";
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .li-editor input[type=number]::-webkit-inner-spin-button,
    .li-editor input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
    .li-editor input[type=number] { -moz-appearance:textfield; }
    .li-editor textarea.li-desc {
      background:var(--plate); border:1px solid var(--border); border-radius:4px;
      padding:2px 8px; font-size:12px; color:var(--text); outline:none;
      font-family:'Barlow',sans-serif; resize:none; overflow:hidden;
      width:100%; min-height:22px; line-height:1.4; box-sizing:border-box;
    }
    .li-editor textarea.li-desc:focus { border-color:var(--rim); }
  `;
  document.head.appendChild(style);
}

// ─── DRAG GRIP ICON ──────────────────────────────────────────
function DragGrip() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" style={{ opacity:0.4, cursor:"grab" }}>
      <circle cx="2" cy="2" r="1.2"/><circle cx="8" cy="2" r="1.2"/>
      <circle cx="2" cy="6" r="1.2"/><circle cx="8" cy="6" r="1.2"/>
      <circle cx="2" cy="10" r="1.2"/><circle cx="8" cy="10" r="1.2"/>
      <circle cx="2" cy="14" r="1.2"/><circle cx="8" cy="14" r="1.2"/>
    </svg>
  );
}

// ─── TRASH ICON ──────────────────────────────────────────────
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  );
}

// ─── COLUMN LAYOUT ───────────────────────────────────────────
// Fixed cols in px; service + description use fr units to fill remaining space
const FIXED_COLS = { num: 36, qty: 60, rate: 80, amount: 90, tax: 44, del: 36 };
const GRID_TEMPLATE = `${FIXED_COLS.num}px 2fr 3fr ${FIXED_COLS.qty}px ${FIXED_COLS.rate}px ${FIXED_COLS.amount}px ${FIXED_COLS.tax}px ${FIXED_COLS.del}px`;

// ─── AUTO-RESIZE TEXTAREA ────────────────────────────────────
function AutoTextarea({ value, onChange, placeholder, className, style }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "22px";
      if (value) {
        ref.current.style.height = ref.current.scrollHeight + "px";
      }
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      className={className}
      style={style}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={1}
    />
  );
}

// ─── SERVICE PRESETS AUTOCOMPLETE ────────────────────────────
function ServiceAutocomplete({ value, onChange, presets, onSavePreset, canSavePresets }) {
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const [dropPos, setDropPos] = useState({ top:0, left:0, width:0 });

  const filtered = value.trim()
    ? presets.filter(p => p.name.toLowerCase().includes(value.toLowerCase()))
    : presets;

  const exactMatch = presets.some(p => p.name.toLowerCase() === value.trim().toLowerCase());

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Recalc dropdown position when open
  useEffect(() => {
    if (open && focused && inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 2, left: r.left, width: r.width });
    }
  }, [open, focused, value]);

  return (
    <div ref={ref} style={{ position:"relative", width:"100%" }}>
      <input
        ref={inputRef}
        className="inline-input"
        style={{ width:"100%" }}
        placeholder="Service name"
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => { setFocused(true); setOpen(true); }}
        onBlur={() => setFocused(false)}
      />
      {open && focused && (filtered.length > 0 || (canSavePresets && value.trim() && !exactMatch)) && (
        <div style={{
          position:"fixed", top:dropPos.top, left:dropPos.left, width:dropPos.width, zIndex:9999,
          background:"var(--raised)", border:"1px solid var(--border)", borderRadius:4,
          maxHeight:180, overflowY:"auto", boxShadow:"0 4px 12px rgba(0,0,0,0.5)",
        }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onMouseDown={(e) => { e.preventDefault(); onChange(p.name, p); setOpen(false); }}
              style={{
                padding:"6px 10px", fontSize:12, color:"var(--text)", cursor:"pointer",
                borderBottom:"1px solid var(--border)",
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--plate)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              <div style={{ fontWeight:600 }}>{p.name}</div>
              {p.default_description && <div style={{ fontSize:10, color:"var(--dim)", marginTop:1 }}>{p.default_description}</div>}
              {p.default_rate && <div style={{ fontSize:10, color:"var(--muted)", marginTop:1 }}>Rate: ${Number(p.default_rate).toFixed(2)}</div>}
              {p.labor_hours && <div style={{ fontSize:10, color:"var(--soft)", marginTop:1 }}>+ Labor: {p.labor_hours}hr × ${p.labor_rate != null ? Number(p.labor_rate).toFixed(2) : DEFAULT_RATE + " (default)"}</div>}
            </div>
          ))}
          {canSavePresets && value.trim() && !exactMatch && (
            <div
              onMouseDown={(e) => { e.preventDefault(); onSavePreset(value.trim()); }}
              style={{
                padding:"6px 10px", fontSize:11, color:"var(--accent)", cursor:"pointer",
                borderTop: filtered.length > 0 ? "1px solid var(--border)" : "none",
                fontWeight:600,
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--plate)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              + Save "{value.trim()}" as preset
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── ADD PRESET MODAL ────────────────────────────────────────
function AddPresetModal({ onClose, onSave }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [taxable, setTaxable] = useState(false);
  const [laborRate, setLaborRate] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborUseDefault, setLaborUseDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const { error: err } = await onSave({
      name: name.trim(),
      default_description: description.trim() || null,
      default_rate: rate ? parseFloat(rate) : null,
      default_taxable: taxable,
      labor_rate: laborUseDefault ? null : (laborRate ? parseFloat(laborRate) : null),
      labor_hours: laborHours ? parseFloat(laborHours) : null,
    });
    setSaving(false);
    if (err) setError(err.message || "Failed to save preset.");
  };

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 420 }}>
        <div className="modal-head">
          <div>
            <h3>Add Service Preset</h3>
            <div className="modal-head-sub">Create a reusable service/part for quick entry</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-box">{error}</div>}
          <div className="field">
            <label>Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Brake Replacement, Oil Filter" autoFocus />
          </div>
          <div className="field">
            <label>Default Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Auto-fills Description column (optional)" />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"end", marginBottom:14 }}>
            <div className="field" style={{ marginBottom:0 }}>
              <label>Default Rate</label>
              <input type="number" min="0" step="0.01" value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00 (optional)" />
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8, height:32, paddingBottom:2 }}>
              <input type="checkbox" checked={taxable} onChange={e => setTaxable(e.target.checked)}
                style={{ accentColor:"var(--accent)", cursor:"pointer", width:16, height:16 }} />
              <label style={{ fontSize:12, color:"var(--text)", cursor:"pointer", margin:0, letterSpacing:0, textTransform:"none", fontWeight:500 }} onClick={() => setTaxable(t => !t)}>Taxable</label>
            </div>
          </div>
          {/* Labor line section */}
          <div style={{ borderTop:"1px solid var(--border)", paddingTop:12, marginBottom:14 }}>
            <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)", marginBottom:8 }}>Accompanying Labor Line</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:8 }}>
              <div className="field" style={{ marginBottom:0 }}>
                <label>Labor Rate</label>
                {laborUseDefault ? (
                  <input style={{ opacity:0.5 }} value={`$${DEFAULT_RATE}/hr (default)`} readOnly />
                ) : (
                  <input type="number" min="0" step="0.01" value={laborRate} onChange={e => setLaborRate(e.target.value)} placeholder="$/hr" />
                )}
              </div>
              <div className="field" style={{ marginBottom:0 }}>
                <label>Labor Hours</label>
                <input type="number" min="0" step="0.1" value={laborHours} onChange={e => setLaborHours(e.target.value)} placeholder="Hrs (optional)" />
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <input type="checkbox" checked={laborUseDefault} onChange={e => setLaborUseDefault(e.target.checked)}
                style={{ accentColor:"var(--accent)", cursor:"pointer", width:14, height:14 }} />
              <label style={{ fontSize:11, color:"var(--body)", cursor:"pointer", margin:0, letterSpacing:0, textTransform:"none", fontWeight:500 }}
                onClick={() => setLaborUseDefault(v => !v)}>Use default labor rate (${DEFAULT_RATE}/hr)</label>
            </div>
          </div>
          <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>{saving ? "Saving…" : "Save Preset"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MANAGE PRESETS MODAL ────────────────────────────────────
function ManagePresetsModal({ presets, onClose, onUpdate, onDelete }) {
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null); // preset id being edited
  const [form, setForm] = useState({ name: "", default_description: "", default_rate: "", default_taxable: false, labor_rate: "", labor_hours: "", labor_use_default: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null); // preset id pending delete confirm
  const [error, setError] = useState("");

  const filtered = search.trim()
    ? presets.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.default_description || "").toLowerCase().includes(search.toLowerCase()))
    : presets;

  const startEdit = (p) => {
    setEditing(p.id);
    setForm({ name: p.name || "", default_description: p.default_description || "", default_rate: p.default_rate != null ? String(p.default_rate) : "", default_taxable: !!p.default_taxable, labor_rate: p.labor_rate != null ? String(p.labor_rate) : "", labor_hours: p.labor_hours != null ? String(p.labor_hours) : "", labor_use_default: p.labor_rate == null });
    setError("");
  };

  const cancelEdit = () => { setEditing(null); setError(""); };

  const saveEdit = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true); setError("");
    const updates = {
      name: form.name.trim(),
      default_description: form.default_description.trim() || null,
      default_rate: form.default_rate ? parseFloat(form.default_rate) : null,
      default_taxable: form.default_taxable,
      labor_rate: form.labor_use_default ? null : (form.labor_rate ? parseFloat(form.labor_rate) : null),
      labor_hours: form.labor_hours ? parseFloat(form.labor_hours) : null,
    };
    const { error: err } = await supabase.from("service_presets").update(updates).eq("id", editing);
    setSaving(false);
    if (err) { setError(err.message || "Failed to save."); return; }
    onUpdate(editing, updates);
    setEditing(null);
  };

  const handleDelete = async (id) => {
    const { error: err } = await supabase.from("service_presets").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    onDelete(id);
    setDeleting(null);
    if (editing === id) setEditing(null);
  };

  return (
    <div className="modal-overlay" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 540 }}>
        <div className="modal-head">
          <div>
            <h3>Manage Service Presets</h3>
            <div className="modal-head-sub">{presets.length} preset{presets.length !== 1 ? "s" : ""}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ maxHeight: "60vh", overflowY: "auto" }}>
          {/* Search */}
          <div style={{ marginBottom: 12 }}>
            <input
              placeholder="Search presets…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{ width: "100%" }}
            />
          </div>

          {error && <div className="error-box" style={{ marginBottom: 10 }}>{error}</div>}

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--dim)", fontSize: 13 }}>
              {search.trim() ? "No presets match your search." : "No presets yet."}
            </div>
          )}

          {/* Preset list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {filtered.map(p => (
              <div key={p.id} style={{
                border: "1px solid var(--border)", borderRadius: 6, background: editing === p.id ? "var(--surface)" : "var(--plate)",
                overflow: "hidden",
              }}>
                {editing === p.id ? (
                  /* ─── Edit form ─── */
                  <div style={{ padding: "12px 14px" }}>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <label>Name *</label>
                      <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>
                    <div className="field" style={{ marginBottom: 10 }}>
                      <label>Default Description</label>
                      <input value={form.default_description} onChange={e => setForm(f => ({ ...f, default_description: e.target.value }))} placeholder="Optional" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end", marginBottom: 12 }}>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label>Default Rate</label>
                        <input type="number" min="0" step="0.01" value={form.default_rate} onChange={e => setForm(f => ({ ...f, default_rate: e.target.value }))} placeholder="0.00" />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32, paddingBottom: 2 }}>
                        <input type="checkbox" checked={form.default_taxable} onChange={e => setForm(f => ({ ...f, default_taxable: e.target.checked }))}
                          style={{ accentColor: "var(--accent)", cursor: "pointer", width: 16, height: 16 }} />
                        <label style={{ fontSize: 12, color: "var(--text)", cursor: "pointer", margin: 0, letterSpacing: 0, textTransform: "none", fontWeight: 500 }}
                          onClick={() => setForm(f => ({ ...f, default_taxable: !f.default_taxable }))}>Taxable</label>
                      </div>
                    </div>
                    <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginBottom: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 6 }}>Accompanying Labor Line</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 8 }}>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Labor Rate</label>
                          {form.labor_use_default ? (
                            <input style={{ opacity: 0.5 }} value={`$${DEFAULT_RATE}/hr (default)`} readOnly />
                          ) : (
                            <input type="number" min="0" step="0.01" value={form.labor_rate} onChange={e => setForm(f => ({ ...f, labor_rate: e.target.value }))} placeholder="$/hr" />
                          )}
                        </div>
                        <div className="field" style={{ marginBottom: 0 }}>
                          <label>Labor Hours</label>
                          <input type="number" min="0" step="0.1" value={form.labor_hours} onChange={e => setForm(f => ({ ...f, labor_hours: e.target.value }))} placeholder="Hrs" />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <input type="checkbox" checked={form.labor_use_default} onChange={e => setForm(f => ({ ...f, labor_use_default: e.target.checked }))}
                          style={{ accentColor: "var(--accent)", cursor: "pointer", width: 14, height: 14 }} />
                        <label style={{ fontSize: 11, color: "var(--body)", cursor: "pointer", margin: 0, letterSpacing: 0, textTransform: "none", fontWeight: 500 }}
                          onClick={() => setForm(f => ({ ...f, labor_use_default: !f.labor_use_default }))}>Use default labor rate (${DEFAULT_RATE}/hr)</label>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>Cancel</button>
                      <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                    </div>
                  </div>
                ) : (
                  /* ─── Display row ─── */
                  <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", cursor: "pointer", gap: 12 }}
                    onClick={() => startEdit(p)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)" }}>{p.name}</div>
                      <div style={{ display: "flex", gap: 12, marginTop: 2, flexWrap: "wrap" }}>
                        {p.default_description && <span style={{ fontSize: 11, color: "var(--dim)" }}>{p.default_description}</span>}
                        {p.default_rate != null && <span style={{ fontSize: 11, color: "var(--muted)" }}>Rate: ${Number(p.default_rate).toFixed(2)}</span>}
                        {p.default_taxable && <span style={{ fontSize: 10, color: "var(--accent)", fontWeight: 600 }}>TAX</span>}
                        {p.labor_hours && <span style={{ fontSize: 11, color: "var(--soft)" }}>Labor: {p.labor_hours}hr × ${p.labor_rate != null ? Number(p.labor_rate).toFixed(2) : DEFAULT_RATE + " (default)"}</span>}
                      </div>
                    </div>
                    {deleting === p.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }} onClick={e => e.stopPropagation()}>
                        <span style={{ fontSize: 11, color: "var(--dim)" }}>Delete?</span>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: "#ef4444", padding: "2px 8px" }} onClick={() => handleDelete(p.id)}>Yes</button>
                        <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: "2px 8px" }} onClick={() => setDeleting(null)}>No</button>
                      </div>
                    ) : (
                      <button
                        onClick={e => { e.stopPropagation(); setDeleting(p.id); }}
                        style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: "1px solid rgba(239,68,68,0.25)", background: "transparent", color: "#ef4444", cursor: "pointer", flexShrink: 0 }}
                        title="Delete preset"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────
export default function LineItemsEditor({ lineItems, onChange, canSavePresets = false }) {
  const [presets, setPresets] = useState([]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  useEffect(() => { ensureStyles(); }, []);

  // Load presets
  useEffect(() => {
    supabase.from("service_presets").select("*").order("name").then(({ data }) => setPresets(data || []));
  }, []);

  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showManagePresets, setShowManagePresets] = useState(false);

  const handleSavePreset = async (preset) => {
    const { data, error } = await supabase.from("service_presets").insert(preset).select().single();
    if (!error && data) setPresets(p => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
    return { data, error };
  };

  const handleQuickSavePreset = async (name) => {
    await handleSavePreset({ name });
  };

  // ─── Line item helpers ───
  const updateLine = (idx, key, val) => {
    const updated = lineItems.map((li, i) => i === idx ? { ...li, [key]: val } : li);
    onChange(updated);
  };

  const addLine = () => {
    onChange([...lineItems, { service: "", description: "", qty: "1", rate: "", taxable: false }]);
  };

  const removeLine = (idx) => {
    onChange(lineItems.filter((_, i) => i !== idx));
  };

  const clearAll = () => {
    onChange([{ service: "", description: "", qty: "1", rate: "", taxable: false }]);
  };

  const handleServiceSelect = (idx, name, preset) => {
    const updated = lineItems.map((li, i) => {
      if (i !== idx) return li;
      return {
        ...li,
        service: name,
        ...(preset?.default_rate ? { rate: String(preset.default_rate) } : {}),
        ...(preset?.default_description ? { description: preset.default_description } : {}),
        ...(preset ? { taxable: !!preset.default_taxable } : {}),
      };
    });
    // Insert accompanying labor line if preset has labor hours
    if (preset?.labor_hours) {
      const laborLine = {
        service: "Labor",
        description: "",
        qty: String(preset.labor_hours),
        rate: String(preset.labor_rate != null ? preset.labor_rate : DEFAULT_RATE),
        taxable: false,
      };
      updated.splice(idx + 1, 0, laborLine);
    }
    onChange(updated);
  };

  // ─── Drag-to-reorder (grip handle only) ───
  const handleDragStart = (e, idx) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(idx));
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };

  const handleDrop = (e, dropIdx) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const items = [...lineItems];
    const [moved] = items.splice(dragIdx, 1);
    items.splice(dropIdx, 0, moved);
    onChange(items);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const gridTemplate = GRID_TEMPLATE;

  const lineTotal = (li) => (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0);

  const headerDefs = [
    { key:"num",         label:"#",            align:"center" },
    { key:"service",     label:"Service/Part", align:"left" },
    { key:"description", label:"Description",  align:"left" },
    { key:"qty",         label:"Qty",          align:"center" },
    { key:"rate",        label:"Rate",         align:"center" },
    { key:"amount",      label:"Amount",       align:"center" },
    { key:"tax",         label:"Tax",          align:"center" },
    { key:"del",         label:"",             align:"center" },
  ];

  return (
    <div className="li-editor" style={{ marginBottom: 14 }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
        <div style={{ fontSize:10, fontWeight:600, letterSpacing:"0.18em", textTransform:"uppercase", color:"var(--muted)" }}>Line Items</div>
      </div>

      {/* Table */}
      <div style={{ border:"1px solid var(--border)", borderRadius:6, overflow:"hidden", background:"var(--plate)" }}>
        {/* Column headers */}
        <div style={{ display:"grid", gridTemplateColumns: gridTemplate, borderBottom:"1px solid var(--border)", background:"var(--surface)", minWidth:0 }}>
          {headerDefs.map((col) => (
            <div key={col.key} style={{
              padding:"8px 6px", fontSize:10, fontWeight:600,
              letterSpacing:"0.15em", textTransform:"uppercase", color:"var(--muted)",
              display:"flex", alignItems:"center", minWidth:0,
              justifyContent: col.align === "left" ? "flex-start" : col.align === "right" ? "flex-end" : "center",
            }}>
              {col.label}
            </div>
          ))}
        </div>

        {/* Rows */}
        {lineItems.map((li, idx) => (
          <div
            key={idx}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            style={{
              display:"grid", gridTemplateColumns: gridTemplate,
              borderBottom:"1px solid var(--border)",
              alignItems:"center", minWidth:0,
              background: dragOverIdx === idx ? "rgba(245,158,11,0.06)" : "transparent",
              opacity: dragIdx === idx ? 0.5 : 1,
              transition: "background 0.1s",
            }}
          >
            {/* # + drag handle (ONLY this element is draggable) */}
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"8px 2px", color:"var(--dim)", fontSize:12, fontWeight:600, cursor:"grab" }}
            >
              <DragGrip />
              {idx + 1}
            </div>

            {/* Service */}
            <div style={{ padding:"4px 4px", minWidth:0, overflow:"hidden" }}>
              <ServiceAutocomplete
                value={li.service}
                onChange={(val, preset) => handleServiceSelect(idx, val, preset)}
                presets={presets}
                onSavePreset={handleQuickSavePreset}
                canSavePresets={canSavePresets}
              />
            </div>

            {/* Description (textarea, wraps text) */}
            <div style={{ padding:"4px 4px", minWidth:0, overflow:"hidden" }}>
              <AutoTextarea
                className="li-desc"
                placeholder="Description"
                value={li.description}
                onChange={e => updateLine(idx, "description", e.target.value)}
              />
            </div>

            {/* Qty */}
            <div style={{ padding:"4px 4px" }}>
              <input className="inline-input" style={{ width:"100%", textAlign:"center" }} type="number" min="0" step="0.1" placeholder="0"
                value={li.qty} onChange={e => updateLine(idx, "qty", e.target.value)} />
            </div>

            {/* Rate */}
            <div style={{ padding:"4px 4px" }}>
              <input className="inline-input" style={{ width:"100%", textAlign:"center" }} type="number" min="0" step="0.01" placeholder="0.00"
                value={li.rate} onChange={e => updateLine(idx, "rate", e.target.value)} />
            </div>

            {/* Amount (computed) */}
            <div style={{ padding:"8px 6px", textAlign:"center", fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:"var(--soft)" }}>
              ${lineTotal(li).toFixed(2)}
            </div>

            {/* Tax checkbox */}
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"8px 4px" }}>
              <input type="checkbox" checked={!!li.taxable}
                onChange={e => updateLine(idx, "taxable", e.target.checked)}
                style={{ accentColor:"var(--accent)", cursor:"pointer", width:16, height:16 }} />
            </div>

            {/* Delete */}
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", padding:"8px 4px" }}>
              <button
                onClick={() => removeLine(idx)}
                style={{
                  width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center",
                  borderRadius:4, border:"1px solid rgba(239,68,68,0.25)", background:"transparent",
                  color:"var(--red,#ef4444)", cursor:"pointer",
                }}
                title="Delete line"
              >
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}

        {/* Empty last row for quick add */}
        <div
          style={{ display:"grid", gridTemplateColumns: gridTemplate, alignItems:"center", opacity:0.5, cursor:"pointer" }}
          onClick={addLine}
          title="Click to add a new line"
        >
          <div style={{ padding:"6px 2px", textAlign:"center", color:"var(--dim)", fontSize:12, fontWeight:600 }}>{lineItems.length + 1}</div>
          <div style={{ padding:"4px 4px" }}><div className="inline-input" style={{ width:"100%", opacity:0.4 }}>&nbsp;</div></div>
          <div style={{ padding:"4px 4px" }}><div className="inline-input" style={{ width:"100%", opacity:0.4 }}>&nbsp;</div></div>
          <div style={{ padding:"4px 4px" }}><div className="inline-input" style={{ width:"100%", opacity:0.4 }}>&nbsp;</div></div>
          <div style={{ padding:"4px 4px" }}><div className="inline-input" style={{ width:"100%", opacity:0.4 }}>&nbsp;</div></div>
          <div style={{ padding:"6px 6px" }} />
          <div style={{ padding:"6px 4px" }} />
          <div style={{ padding:"6px 4px" }} />
        </div>
      </div>

      {/* Bottom buttons */}
      <div style={{ display:"flex", gap:8, marginTop:8 }}>
        {canSavePresets && (
          <>
            <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => setShowPresetModal(true)}>
              + Add Preset
            </button>
            <button className="btn btn-ghost btn-sm" style={{ fontSize:11 }} onClick={() => setShowManagePresets(true)}>
              Manage Presets
            </button>
          </>
        )}
        {lineItems.length > 1 && (
          <button className="btn btn-ghost btn-sm" style={{ fontSize:11, color:"var(--dim)" }} onClick={clearAll}>
            Clear all lines
          </button>
        )}
      </div>

      {/* Add Preset Modal */}
      {showPresetModal && (
        <AddPresetModal
          onClose={() => setShowPresetModal(false)}
          onSave={async (preset) => {
            const { error } = await handleSavePreset(preset);
            if (!error) setShowPresetModal(false);
            return { error };
          }}
        />
      )}

      {/* Manage Presets Modal */}
      {showManagePresets && (
        <ManagePresetsModal
          presets={presets}
          onClose={() => setShowManagePresets(false)}
          onUpdate={(id, updates) => setPresets(p => p.map(x => x.id === id ? { ...x, ...updates } : x).sort((a, b) => a.name.localeCompare(b.name)))}
          onDelete={(id) => setPresets(p => p.filter(x => x.id !== id))}
        />
      )}
    </div>
  );
}

// ─── CONVERSION HELPERS ─────────────────────────────────────
// Convert old services format → flat lineItems
export function servicestolineItems(li) {
  if (!li) return [{ service: "", description: "", qty: "1", rate: "", taxable: false }];

  const obj = li;

  // New format already
  if (!Array.isArray(obj) && obj.lineItems) return obj.lineItems;

  // Current format: { services: [...], settings: {...} }
  if (!Array.isArray(obj) && obj.services) {
    const items = [];
    obj.services.forEach(svc => {
      const lh = parseFloat(svc.labor_hours) || 0;
      const lr = parseFloat(svc.labor_rate) || 0;
      if (lh > 0 || svc.name) {
        items.push({
          service: svc.name || "",
          description: "Labor",
          qty: String(lh || ""),
          rate: String(lr || ""),
          taxable: true,
        });
      }
      (svc.parts || []).forEach(p => {
        items.push({
          service: svc.name || "",
          description: p.description || "",
          qty: String(p.quantity || "1"),
          rate: String(p.rate != null ? p.rate : (p.amount || "")),
          taxable: !!p.taxable,
        });
      });
    });
    return items.length > 0 ? items : [{ service: "", description: "", qty: "1", rate: "", taxable: false }];
  }

  // Old array format
  if (Array.isArray(obj) && obj.length > 0 && obj[0].parts !== undefined) {
    const items = [];
    obj.forEach(svc => {
      const lh = parseFloat(svc.labor_hours) || 0;
      const lr = parseFloat(svc.labor_rate) || 0;
      if (lh > 0 || svc.name) {
        items.push({ service: svc.name || "", description: "Labor", qty: String(lh || ""), rate: String(lr || ""), taxable: true });
      }
      (svc.parts || []).forEach(p => {
        items.push({ service: svc.name || "", description: p.description || "", qty: String(p.quantity || "1"), rate: String(p.rate != null ? p.rate : (p.amount || "")), taxable: !!p.taxable });
      });
    });
    return items.length > 0 ? items : [{ service: "", description: "", qty: "1", rate: "", taxable: false }];
  }

  // Very old flat format
  if (Array.isArray(obj) && obj.length > 0) {
    return obj.map(i => ({
      service: "", description: i.description || "", qty: String(i.quantity || "1"),
      rate: String(i.rate || i.amount || ""), taxable: false,
    }));
  }

  return [{ service: "", description: "", qty: "1", rate: "", taxable: false }];
}

// Compute totals from lineItems array
export function computeLineItemTotals(lineItems, settings) {
  const itemsTotal = lineItems.reduce((s, li) => s + (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0), 0);
  const taxableTotal = lineItems.reduce((s, li) => li.taxable ? s + (parseFloat(li.qty) || 0) * (parseFloat(li.rate) || 0) : s, 0);

  const discountAmt = settings.discountType === "flat" ? (parseFloat(settings.discountValue) || 0)
    : settings.discountType === "pct" ? itemsTotal * (parseFloat(settings.discountValue) || 0) / 100
    : 0;
  const afterDiscount = Math.max(itemsTotal - discountAmt, 0);
  const taxableAfterDiscount = itemsTotal > 0 ? afterDiscount * (taxableTotal / itemsTotal) : 0;
  const taxAmt = settings.taxType === "pct"
    ? taxableAfterDiscount * (parseFloat(settings.taxValue) || 0) / 100
    : parseFloat(settings.taxValue) || 0;
  const grandTotal = afterDiscount + taxAmt;

  return { itemsTotal, taxableTotal, discountAmt, afterDiscount, taxAmt, grandTotal };
}
