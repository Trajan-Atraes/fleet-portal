import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";
import { IcoPlus } from "../components/Icons";

// ─── COMPANIES ────────────────────────────────────────────────
export default function Companies() {
  const [companies, setCompanies]   = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [selected, setSelected]     = useState(null);
  const [form, setForm]             = useState({ name:"", email:"", phone:"", address:"" });
  const [inviteEmail, setInviteEmail]       = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState("");

  // Company detail editing
  const [editingDetails, setEditingDetails] = useState(false);
  const [detailForm, setDetailForm]         = useState({ name:"", email:"", phone:"", address:"" });

  const [accountManagers, setAccountManagers] = useState([]);
  const [amAssignments, setAmAssignments]     = useState([]);
  const [amSelect, setAmSelect]               = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: cos }, { data: cus }, { data: ams }, { data: amc }] = await Promise.all([
      supabase.from("companies").select("*").order("name"),
      supabase.from("company_users").select("*"),
      supabase.from("account_managers").select("id, email, display_name").order("email"),
      supabase.from("account_manager_companies").select("account_manager_id, company_id"),
    ]);
    setCompanies(cos || []);
    setUsers(cus || []);
    setAccountManagers(ams || []);
    setAmAssignments(amc || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreateCompany = async () => {
    if (!form.name) { setError("Company name is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("companies").insert(form);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess("Company created.");
    setForm({ name:"", email:"", phone:"", address:"" });
    setShowForm(false);
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
    await supabase.from("company_users").delete().eq("user_id", userId).eq("company_id", companyId);
    load();
  };

  const handleAssignAM = async (companyId) => {
    if (!amSelect) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_manager_companies")
      .insert({ account_manager_id: amSelect, company_id: companyId });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setAmSelect("");
    load();
  };

  const handleRemoveAM = async (amId, companyId) => {
    setError(""); setSuccess("");
    await supabase.from("account_manager_companies")
      .delete().eq("account_manager_id", amId).eq("company_id", companyId);
    load();
  };

  const handleSaveDetails = async () => {
    if (!selected || !detailForm.name) { setError("DSP name is required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("companies")
      .update({ name: detailForm.name, email: detailForm.email, phone: detailForm.phone, address: detailForm.address })
      .eq("id", selected.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess("DSP details updated.");
    setEditingDetails(false);
    load();
  };

  const startEditDetails = (c) => {
    setDetailForm({ name: c.name || "", email: c.email || "", phone: c.phone || "", address: c.address || "" });
    setEditingDetails(true);
  };

  const companyUserCount = id => users.filter(u => u.company_id === id).length;
  const companyAMCount   = id => amAssignments.filter(a => a.company_id === id).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">DSPs</div>
          <div className="page-sub">Manage client DSPs and their portal users</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><IcoPlus /> New DSP</>}
        </button>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-title">New DSP</div>
          <div className="form-grid">
            <div className="field"><label>DSP Name *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Acme Fleet Co." /></div>
            <div className="field"><label>Email</label><input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="contact@acme.com" /></div>
            <div className="field"><label>Phone</label><input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="(702) 555-0100" /></div>
            <div className="field"><label>Address</label><input value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} placeholder="123 Main St, Las Vegas, NV" /></div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreateCompany} disabled={saving}>{saving ? "Saving…" : "Create DSP"}</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-row">Loading…</div> : companies.length === 0 ? (
        <div className="empty-state">
          <h3>No DSPs yet</h3>
          <p>Create your first DSP above.</p>
        </div>
      ) : (
        <div className="company-grid">
          {companies.map(c => (
            <div key={c.id}
              className={`company-card ${selected?.id === c.id ? "selected" : ""}`}
              onClick={() => { if (selected?.id !== c.id) { setAmSelect(""); setError(""); setSuccess(""); setEditingDetails(false); } setSelected(selected?.id === c.id ? null : c); }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div className="company-name">{c.name}</div>
                  <div className="company-meta">
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                    {c.address && <div>{c.address}</div>}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                  <div className="company-user-count">{companyUserCount(c.id)} user{companyUserCount(c.id) !== 1 ? "s" : ""}</div>
                  {companyAMCount(c.id) > 0 && <div style={{ fontSize:10, color:"#a78bfa", fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, letterSpacing:"0.08em" }}>{companyAMCount(c.id)} acct mgr{companyAMCount(c.id) !== 1 ? "s" : ""}</div>}
                </div>
              </div>

              {selected?.id === c.id && (
                <div className="company-expanded" onClick={e => e.stopPropagation()}>
                  {/* Contact Info Editing */}
                  <div style={{ marginBottom:14 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div className="expanded-label" style={{ marginBottom:0 }}>Contact Info</div>
                      {!editingDetails && (
                        <button className="btn btn-ghost btn-sm" onClick={() => startEditDetails(c)}
                          style={{ fontSize:10, padding:"2px 8px" }}>Edit</button>
                      )}
                    </div>
                    {editingDetails ? (
                      <div>
                        <div className="form-grid" style={{ gap:6, marginBottom:8 }}>
                          <div className="field"><label>DSP Name *</label><input value={detailForm.name} onChange={e => setDetailForm(f=>({...f,name:e.target.value}))} /></div>
                          <div className="field"><label>Email</label><input value={detailForm.email} onChange={e => setDetailForm(f=>({...f,email:e.target.value}))} /></div>
                          <div className="field"><label>Phone</label><input value={detailForm.phone} onChange={e => setDetailForm(f=>({...f,phone:e.target.value}))} /></div>
                          <div className="field"><label>Address</label><input value={detailForm.address} onChange={e => setDetailForm(f=>({...f,address:e.target.value}))} /></div>
                        </div>
                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditingDetails(false)}>Cancel</button>
                          <button className="btn btn-primary btn-sm" onClick={handleSaveDetails} disabled={saving}>{saving ? "Saving…" : "Save Details"}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="company-meta" style={{ fontSize:12, lineHeight:1.6 }}>
                        {c.email && <div>{c.email}</div>}
                        {c.phone && <div>{c.phone}</div>}
                        {c.address && <div>{c.address}</div>}
                        {!c.email && !c.phone && !c.address && <div style={{ color:"var(--dim)" }}>No contact info set.</div>}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop:"1px solid var(--rim)", paddingTop:12 }}>
                  <div className="expanded-label">Users</div>

                  {users.filter(u => u.company_id === c.id).length === 0 ? (
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>No users linked yet.</div>
                  ) : (
                    users.filter(u => u.company_id === c.id).map(u => (
                      <div key={u.id} className="user-row">
                        <span className="user-id-text">{u.display_name ? <><strong style={{ color:"var(--text)" }}>{u.display_name}</strong> <span className="mono" style={{ fontSize:10 }}>{u.user_id.slice(0,8)}…</span></> : <span className="mono">{u.user_id}</span>}</span>
                        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize:9, padding:"1px 7px", color: u.is_billing_user ? "#60a5fa" : "var(--muted)", borderColor: u.is_billing_user ? "rgba(59,130,246,0.35)" : undefined }}
                            onClick={async (e) => { e.stopPropagation(); await supabase.from("company_users").update({ is_billing_user: !u.is_billing_user }).eq("id", u.id); load(); }}
                          >{u.is_billing_user ? "Billing ✓" : "Billing"}</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemoveUser(u.user_id, c.id)}>Remove</button>
                        </div>
                      </div>
                    ))
                  )}

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

                  <div style={{ marginTop:14, borderTop:"1px solid var(--rim)", paddingTop:12 }}>
                    <div className="expanded-label" style={{ marginBottom:6, color:"#a78bfa" }}>Account Managers</div>
                    {amAssignments.filter(a => a.company_id === c.id).length === 0 ? (
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>No account managers assigned.</div>
                    ) : (
                      amAssignments.filter(a => a.company_id === c.id).map(a => {
                        const am = accountManagers.find(m => m.id === a.account_manager_id);
                        return (
                          <div key={a.account_manager_id} className="user-row">
                            <span style={{ fontSize:12 }}>{am ? (am.display_name || am.email) : a.account_manager_id}</span>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAM(a.account_manager_id, c.id)}>Remove</button>
                          </div>
                        );
                      })
                    )}
                    <div style={{ display:"flex", gap:6, marginTop:6 }}>
                      <select className="inline-input" style={{ flex:1 }} value={amSelect} onChange={e => setAmSelect(e.target.value)}>
                        <option value="">— Assign Account Manager —</option>
                        {accountManagers
                          .filter(am => !amAssignments.some(a => a.account_manager_id === am.id && a.company_id === c.id))
                          .map(am => <option key={am.id} value={am.id}>{am.display_name || am.email}</option>)
                        }
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssignAM(c.id)} disabled={saving || !amSelect}>
                        {saving ? "…" : "Assign"}
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
