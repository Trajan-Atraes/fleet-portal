export function VehicleStatusBadge({ status }) {
  const s = status || "Road Worthy";
  const map = {
    "Road Worthy":     { bg:"var(--green-dim)", color:"var(--green)", border:"rgba(16,185,129,0.22)" },
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

export default VehicleStatusBadge;
