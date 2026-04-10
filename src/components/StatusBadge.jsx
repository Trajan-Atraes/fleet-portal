import { useState } from "react";
import { STATUS_LABELS } from "../lib/constants";

export function SvcPreviewCell({ svc }) {
  const [tipPos, setTipPos] = useState(null);
  if (!svc?.full) return <span style={{ color:"var(--dim)", fontSize:12 }}>—</span>;
  return (
    <>
      <span
        style={{ fontSize:12, color:"var(--body)" }}
        onMouseEnter={e => {
          if (!svc.truncated) return;
          const r = e.currentTarget.getBoundingClientRect();
          setTipPos({ x: r.left, y: r.bottom + 4 });
        }}
        onMouseLeave={() => setTipPos(null)}
      >
        {svc.short}
      </span>
      {tipPos && (
        <div style={{
          position:"fixed", left:tipPos.x, top:tipPos.y, zIndex:9999,
          background:"var(--surface)", border:"1px solid var(--border)", borderRadius:5,
          padding:"8px 10px", fontSize:12, color:"var(--body)", whiteSpace:"normal",
          wordWrap:"break-word", minWidth:200, maxWidth:300, lineHeight:1.5,
          boxShadow:"0 4px 12px rgba(0,0,0,0.3)", pointerEvents:"none",
        }}>
          {svc.full}
        </div>
      )}
    </>
  );
}

export function StatusBadge({ status }) {
  return (
    <span className={`badge ${status}`}>
      <span className="badge-dot" />
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export function InvoiceBillingBadge({ status, label }) {
  const map = {
    draft:         { color:"#526a84",  bg:"rgba(55,79,104,0.3)",    label:"Draft"      },
    submitted:     { color:"#fbbf24",  bg:"rgba(245,158,11,0.12)",  label:"Submitted"  },
    approved:      { color:"#34d399",  bg:"rgba(16,185,129,0.12)",  label:"Approved"   },
    rejected:      { color:"#f87171",  bg:"rgba(239,68,68,0.12)",   label:"Rejected"   },
    revise:        { color:"#fb923c",  bg:"rgba(249,115,22,0.12)",  label:"Revise"     },
    client_billed:            { color:"#60a5fa",  bg:"rgba(59,130,246,0.12)",  label:"Billed"            },
    paid:                     { color:"#6ee7b7",  bg:"rgba(16,185,129,0.22)",  label:"Paid"              },
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
      display:"inline-flex", alignItems:"center", gap:5, padding:"2px 7px",
      minHeight:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {displayLabel}
    </span>
  );
}

export function LineInvoiceBadges({ linesInvoiceData }) {
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
        <InvoiceBillingBadge key={line_letter} status={status} label={`Line ${line_letter}`} />
      ))}
    </div>
  );
}

export function SRStatusBadge({ status }) {
  if (!status) return <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>;
  const map = {
    pending:     { color:"#fbbf24", bg:"rgba(245,158,11,0.12)"  },
    in_progress: { color:"#60a5fa", bg:"rgba(59,130,246,0.12)"  },
    completed:   { color:"#34d399", bg:"rgba(16,185,129,0.12)"  },
    cancelled:   { color:"#6b7280", bg:"rgba(75,85,99,0.12)"    },
  };
  const s = map[status] || { color:"var(--muted)", bg:"rgba(255,255,255,0.05)" };
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"2px 7px",
      minHeight:18, borderRadius:3, fontFamily:"'Barlow Condensed',sans-serif",
      fontSize:10, fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
      background:s.bg, color:s.color, border:`1px solid ${s.color}44`,
    }}>
      <span style={{ width:5, height:5, borderRadius:"50%", background:s.color, flexShrink:0 }} />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
