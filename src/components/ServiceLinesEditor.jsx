import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL     = "https://kiayjlepwmdacojhpisq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_b7zg8JgNWZuMjkG7_HnLeg_yylvj3MH";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ─── NEXT AVAILABLE LETTER ────────────────────────────────────
function nextLetter(lines) {
  const used = new Set(lines.map(l => l.line_letter));
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(65 + i); // A, B, C…
    if (!used.has(ch)) return ch;
  }
  return null;
}

// ─── PARTS TAG INPUT ──────────────────────────────────────────
function PartsTagInput({ parts, onChange, readOnly }) {
  const [input, setInput] = useState("");

  const commit = () => {
    const t = input.trim().replace(/,+$/, "");
    if (t && !parts.includes(t)) onChange([...parts, t]);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(); }
    if (e.key === "Backspace" && !input && parts.length > 0) {
      onChange(parts.slice(0, -1));
    }
  };

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center",
      background: "var(--plate)", border: "1px solid var(--border)", borderRadius: 5,
      padding: "6px 10px", minHeight: 36, cursor: readOnly ? "default" : "text",
    }}
      onClick={!readOnly ? (e) => e.currentTarget.querySelector("input")?.focus() : undefined}
    >
      {parts.map((p, i) => (
        <span key={i} style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          background: "var(--raised)", border: "1px solid var(--border)",
          borderRadius: 3, padding: "1px 7px", fontSize: 11,
          fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700,
          letterSpacing: "0.06em", color: "var(--text)", textTransform: "uppercase",
        }}>
          {p}
          {!readOnly && (
            <button
              onClick={e => { e.stopPropagation(); onChange(parts.filter((_, j) => j !== i)); }}
              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, lineHeight: 1, padding: "0 0 0 2px" }}
            >×</button>
          )}
        </span>
      ))}
      {!readOnly && (
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          placeholder={parts.length === 0 ? "Add part, press Enter…" : ""}
          style={{
            background: "transparent", border: "none", outline: "none",
            fontSize: 12, color: "var(--text)", fontFamily: "'Barlow',sans-serif",
            minWidth: 100, flex: 1, padding: 0,
          }}
        />
      )}
      {readOnly && parts.length === 0 && (
        <span style={{ fontSize: 12, color: "var(--dim)" }}>—</span>
      )}
    </div>
  );
}

// ─── SINGLE LINE CARD ─────────────────────────────────────────
function LineCard({ line, onChange, readOnly }) {
  return (
    <div style={{
      background: "var(--plate)", border: `1px solid ${line.is_completed ? "rgba(16,185,129,0.3)" : "var(--border)"}`,
      borderRadius: 6, padding: "14px 16px", marginBottom: 10,
    }}>
      {/* Line header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{
          fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 900,
          textTransform: "uppercase", letterSpacing: "0.15em",
          color: line.is_completed ? "var(--green)" : "var(--accent)",
        }}>
          Line {line.line_letter} ///
        </div>
        {line.is_completed && (
          <span style={{
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.2em", textTransform: "uppercase",
            background: "rgba(16,185,129,0.12)", color: "var(--green)",
            border: "1px solid rgba(16,185,129,0.3)", borderRadius: 3, padding: "2px 7px",
          }}>Completed</span>
        )}
      </div>

      {/* Service name */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 5 }}>
          Service Name
        </label>
        {readOnly
          ? <div style={{ fontSize: 13, color: "var(--text)" }}>{line.service_name || <span style={{ color: "var(--dim)" }}>—</span>}</div>
          : <input
              value={line.service_name || ""}
              onChange={e => onChange("service_name", e.target.value)}
              placeholder="e.g. Brake Replacement, Oil Change…"
              style={{ width: "100%", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "var(--white)", outline: "none", fontFamily: "'Barlow',sans-serif", boxSizing: "border-box" }}
            />
        }
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 10 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 5 }}>
          Notes / Description
        </label>
        {readOnly
          ? <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{line.notes || <span style={{ color: "var(--dim)" }}>—</span>}</div>
          : <textarea
              value={line.notes || ""}
              onChange={e => onChange("notes", e.target.value)}
              placeholder="Work performed, observations, next steps…"
              style={{ width: "100%", background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 5, padding: "7px 10px", fontSize: 13, color: "var(--white)", outline: "none", fontFamily: "'Barlow',sans-serif", resize: "vertical", minHeight: 72, lineHeight: 1.5, boxSizing: "border-box" }}
            />
        }
      </div>

      {/* Parts */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 10, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 5 }}>
          Parts Used
        </label>
        <PartsTagInput
          parts={Array.isArray(line.parts) ? line.parts : []}
          onChange={val => onChange("parts", val)}
          readOnly={readOnly}
        />
      </div>

      {/* Completed toggle */}
      {!readOnly && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", userSelect: "none" }}>
          <input
            type="checkbox"
            checked={!!line.is_completed}
            onChange={e => onChange("is_completed", e.target.checked)}
            style={{ accentColor: "var(--green)", width: 14, height: 14 }}
          />
          <span style={{ fontSize: 12, color: line.is_completed ? "var(--green)" : "var(--body)", fontWeight: line.is_completed ? 700 : 400 }}>
            This service is completed
          </span>
        </label>
      )}
    </div>
  );
}

// ─── PARTS SUMMARY (read-only, for admin/AM views) ────────────
export function PartsSummary({ srId }) {
  const [lines, setLines] = useState(null);

  useState(() => {
    if (!srId) return;
    supabase.from("service_lines")
      .select("line_letter, service_name, parts")
      .eq("sr_id", srId)
      .order("line_letter")
      .then(({ data }) => setLines(data || []));
  });

  if (lines === null) return (
    <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Loading parts…</div>
  );

  const allParts = lines.flatMap(l =>
    (Array.isArray(l.parts) ? l.parts : []).map(p => ({ part: p, letter: l.line_letter, service: l.service_name }))
  );

  if (allParts.length === 0) return (
    <div style={{ fontSize: 12, color: "var(--dim)", padding: "4px 0" }}>No parts recorded yet.</div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {allParts.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
          <span style={{
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 9, fontWeight: 700,
            letterSpacing: "0.15em", textTransform: "uppercase",
            background: "var(--plate)", border: "1px solid var(--border)",
            borderRadius: 3, padding: "1px 5px", color: "var(--accent)", flexShrink: 0,
          }}>
            Line {item.letter}
          </span>
          <span style={{ color: "var(--text)" }}>{item.part}</span>
          {item.service && <span style={{ color: "var(--muted)", fontSize: 11 }}>({item.service})</span>}
        </div>
      ))}
    </div>
  );
}

// ─── SERVICE LINES EDITOR (mechanic main component) ───────────
export default function ServiceLinesEditor({ srId, initialLines, mechanic, srStatus, onSaved, onSubmitted }) {
  const [lines, setLines] = useState(() =>
    (initialLines || []).map(l => ({ ...l, _new: false, _dirty: false }))
  );
  const [saving, setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const updateLine = (idx, key, val) => {
    setLines(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [key]: val, _dirty: true };
      return next;
    });
  };

  const addLine = () => {
    const letter = nextLetter(lines);
    if (!letter) return;
    setLines(prev => [...prev, {
      id: null, sr_id: srId, line_letter: letter,
      service_name: "", notes: "", parts: [], is_completed: false,
      _new: true, _dirty: true,
    }]);
  };

  // After saving a line, pre-populate the linked draft invoice with service name + parts.
  // Only touches draft invoices — never overwrites submitted/approved/etc.
  const syncInvoiceParts = async (lineId, serviceName, parts) => {
    const { data: inv } = await supabase
      .from("invoices")
      .select("id")
      .eq("service_line_id", lineId)
      .eq("status", "draft")
      .maybeSingle();
    if (!inv) return;

    const lineItems = {
      services: [{
        name:        serviceName || "",
        labor_hours: "",
        labor_rate:  "220",
        parts: (parts || []).map(p => ({ description: p, quantity: "1", rate: "" })),
      }],
      settings: { taxType: "none", taxValue: "0", discountType: "none", discountValue: "0" },
    };

    await supabase.from("invoices").update({
      line_items:   lineItems,
      service_type: serviceName || null,
    }).eq("id", inv.id);
  };

  const persistLines = async () => {
    const dirty = lines.filter(l => l._dirty);
    if (dirty.length === 0) return true;

    const savedIds = {};
    for (const line of dirty) {
      if (line._new) {
        const { data, error: err } = await supabase.from("service_lines").insert({
          sr_id:        srId,
          line_letter:  line.line_letter,
          service_name: line.service_name || null,
          notes:        line.notes        || null,
          parts:        line.parts        || [],
          is_completed: !!line.is_completed,
        }).select("id").single();
        if (err) { setError("Save failed: " + err.message); return false; }
        savedIds[line.line_letter] = data.id;
        await syncInvoiceParts(data.id, line.service_name, line.parts);
      } else {
        const { error: err } = await supabase.from("service_lines").update({
          service_name: line.service_name || null,
          notes:        line.notes        || null,
          parts:        line.parts        || [],
          is_completed: !!line.is_completed,
        }).eq("id", line.id);
        if (err) { setError("Save failed: " + err.message); return false; }
        await syncInvoiceParts(line.id, line.service_name, line.parts);
      }
    }

    // Mark all dirty lines clean, update IDs for new lines
    setLines(prev => prev.map(l => {
      if (!l._dirty) return l;
      const newId = savedIds[l.line_letter];
      return { ...l, id: newId || l.id, _new: false, _dirty: false };
    }));
    return true;
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSavedMsg("");
    const ok = await persistLines();
    setSaving(false);
    if (ok) {
      setSavedMsg("Progress saved.");
      setTimeout(() => setSavedMsg(""), 2500);
      onSaved?.();
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true); setError(""); setSavedMsg("");
    const ok = await persistLines();
    if (!ok) { setSubmitting(false); return; }

    // Set SR status to in_progress (only if currently pending)
    if (srStatus === "pending") {
      const { error: err } = await supabase.from("service_requests").update({
        status:           "in_progress",
        updated_by_id:    mechanic.id,
        updated_by_name:  mechanic.display_name || mechanic.name,
        updated_by_email: mechanic.email,
      }).eq("id", srId);
      if (err) { setError("Status update failed: " + err.message); setSubmitting(false); return; }
    }
    setSubmitting(false);
    onSubmitted?.();
  };

  return (
    <div>
      {/* Lines */}
      {lines.length === 0 && (
        <div style={{ background: "var(--plate)", border: "1px solid var(--border)", borderRadius: 6, padding: "20px 16px", textAlign: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>No service lines yet.</div>
          <div style={{ fontSize: 11, color: "var(--dim)" }}>Click "+ Add Line" to document the work being performed.</div>
        </div>
      )}

      {lines.map((line, idx) => (
        <LineCard
          key={line.id || `new-${line.line_letter}`}
          line={line}
          onChange={(key, val) => updateLine(idx, key, val)}
          readOnly={false}
        />
      ))}

      {/* Add Line */}
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 14, width: "100%", justifyContent: "center", borderStyle: "dashed" }}
        onClick={addLine}
      >
        + Add Line {nextLetter(lines) ? `(Line ${nextLetter(lines)})` : ""}
      </button>

      {error    && <div className="error-box"   style={{ marginBottom: 10 }}>{error}</div>}
      {savedMsg && <div className="success-box" style={{ marginBottom: 10 }}>{savedMsg}</div>}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button
          className="btn btn-ghost"
          onClick={handleSave}
          disabled={saving || submitting}
        >
          {saving ? "Saving…" : "Save Progress"}
        </button>
        {srStatus === "pending" && (
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={saving || submitting}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        )}
      </div>
    </div>
  );
}
