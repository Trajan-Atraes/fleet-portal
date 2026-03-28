export function UserTypeBadge({ type }) {
  const styles = {
    admin:           { bg:"rgba(245,158,11,0.12)",  color:"#fbbf24", label:"Admin"          },
    mechanic:        { bg:"rgba(13,148,136,0.12)",  color:"#2dd4bf", label:"Mechanic"       },
    client:          { bg:"rgba(59,130,246,0.12)",  color:"#60a5fa", label:"Client"         },
    account_manager: { bg:"rgba(139,92,246,0.12)",  color:"#a78bfa", label:"Acct Manager"   },
  };
  const s = styles[type] || styles.client;
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

export default UserTypeBadge;
