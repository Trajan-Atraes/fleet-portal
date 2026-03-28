import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";
import { UserTypeBadge } from "../components/UserTypeBadge";

const IcoRefresh = () => <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
const IcoPlus    = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ─── USER MANAGEMENT ──────────────────────────────────────────
export default function UserManagement({ onAdminDisplayNameChange }) {
  const [mechanics, setMechanics]           = useState([]);
  const [admins, setAdmins]                 = useState([]);
  const [companyUsers, setCompanyUsers]     = useState([]);
  const [companies, setCompanies]           = useState([]);
  const [accountManagers, setAccountManagers] = useState([]);
  const [amCompanies, setAmCompanies]       = useState([]); // { account_manager_id, company_id }
  const [loading, setLoading]               = useState(true);

  // add modal: null | "mechanic" | "company_user" | "account_manager"
  const [addModal, setAddModal]   = useState(null);
  const [mechForm, setMechForm]   = useState({ name:"", email:"", password:"" });
  const [userForm, setUserForm]   = useState({ email:"", password:"", company_id:"" });
  const [amForm, setAmForm]       = useState({ email:"", password:"", display_name:"" });

  // edit modal: null | { type:"mechanic"|"company_user"|"admin"|"account_manager", record }
  const [editModal, setEditModal]                 = useState(null);
  const [editName, setEditName]                   = useState("");
  const [editCompanyId, setEditCompanyId]         = useState("");
  const [editDisplayName, setEditDisplayName]     = useState("");
  const [editAssignCompanyId, setEditAssignCompanyId] = useState("");

  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [amSearch,   setAmSearch]   = useState("");
  const [mechSearch, setMechSearch] = useState("");
  const [cuSearch,   setCuSearch]   = useState("");
  const [adminSearch,setAdminSearch]= useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: mechs }, { data: adms }, { data: cus }, { data: cos }, { data: ams }, { data: amc }] = await Promise.all([
      supabase.from("mechanics").select("id, email, name, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("admins").select("id, email, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("company_users").select("*").order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("account_managers").select("id, email, display_name, created_at").order("created_at", { ascending: false }),
      supabase.from("account_manager_companies").select("account_manager_id, company_id"),
    ]);
    setMechanics(mechs || []);
    setAdmins(adms || []);
    setCompanyUsers(cus || []);
    setCompanies(cos || []);
    setAccountManagers(ams || []);
    setAmCompanies(amc || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const companiesMap = Object.fromEntries((companies || []).map(c => [c.id, c.name]));

  const handleCreateMechanic = async () => {
    if (!mechForm.name || !mechForm.email || !mechForm.password) { setError("All fields are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-mechanic`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ name: mechForm.name, email: mechForm.email, password: mechForm.password }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${mechForm.name} (${mechForm.email}) created as mechanic.`);
    setMechForm({ name:"", email:"", password:"" });
    setAddModal(null);
    load();
  };

  const handleSaveMechName = async (id) => {
    if (!editName.trim()) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("mechanics").update({
      name: editName.trim(),
      display_name: editDisplayName.trim() || null,
    }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditName("");
    setEditDisplayName("");
    setSuccess("Mechanic updated.");
    load();
  };

  const handleRemoveMechanic = async (id, name) => {
    if (!window.confirm(`Remove ${name} as a mechanic? This will revoke their portal access.`)) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("mechanics").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSuccess(`${name} removed.`);
    load();
  };

  const handleCreateAccountManager = async () => {
    if (!amForm.email || !amForm.password) { setError("Email and password are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-account-manager-user`, {
        method: "POST",
        headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
        body: JSON.stringify({ email: amForm.email, password: amForm.password, display_name: amForm.display_name || undefined }),
      });
      const result = await res.json();
      if (result.error) { setError(result.error); return; }
      setSuccess(`${amForm.email} created as Account Manager.`);
      setAmForm({ email:"", password:"", display_name:"" });
      setAddModal(null);
      load();
    } catch (e) {
      setError(e.message || "Unexpected error creating account manager.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAMDisplayName = async (id) => {
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_managers")
      .update({ display_name: editDisplayName.trim() || null }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditDisplayName("");
    setSuccess("Account Manager updated.");
    load();
  };

  const handleRemoveAccountManager = async (id, label) => {
    if (!window.confirm(`Remove ${label} as an Account Manager? This will revoke their portal access.`)) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_managers").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSuccess(`${label} removed.`);
    load();
  };

  const handleAssignCompanyToAM = async (amId) => {
    if (!editAssignCompanyId) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("account_manager_companies")
      .insert({ account_manager_id: amId, company_id: editAssignCompanyId });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditAssignCompanyId("");
    load();
  };

  const handleUnassignCompanyFromAM = async (amId, companyId) => {
    setError(""); setSuccess("");
    await supabase.from("account_manager_companies")
      .delete().eq("account_manager_id", amId).eq("company_id", companyId);
    load();
  };

  const handleCreateCompanyUser = async () => {
    if (!userForm.email || !userForm.password || !userForm.company_id) { setError("All fields are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-user`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ email: userForm.email, password: userForm.password, company_id: userForm.company_id }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${userForm.email} added to ${companiesMap[userForm.company_id]}.`);
    setUserForm({ email:"", password:"", company_id:"" });
    setAddModal(null);
    load();
  };

  const handleReassignCompany = async (userId) => {
    if (!editCompanyId) return;
    setSaving(true); setError(""); setSuccess("");
    const { error: err } = await supabase.from("company_users").update({
      company_id: editCompanyId,
      display_name: editDisplayName.trim() || null,
    }).eq("user_id", userId);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setEditModal(null);
    setEditCompanyId("");
    setEditDisplayName("");
    setSuccess("User updated.");
    load();
  };

  const handleRemoveCompanyUser = async (userId, companyId) => {
    if (!window.confirm("Remove this user from their company? This will revoke their client portal access.")) return;
    setError(""); setSuccess("");
    const { error: err } = await supabase.from("company_users").delete().eq("user_id", userId).eq("company_id", companyId);
    if (err) { setError(err.message); return; }
    setSuccess("User removed.");
    load();
  };

  const fmt = d => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });

  const handleSaveAdminDisplayName = async (id) => {
    setSaving(true); setError(""); setSuccess("");
    const newName = editDisplayName.trim() || null;
    const { error: err } = await supabase.from("admins").update({ display_name: newName }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id === id) onAdminDisplayNameChange?.(newName);
    setEditModal(null);
    setEditDisplayName("");
    setSuccess("Display name updated.");
    load();
  };

  const openEdit = (type, record) => {
    setError(""); setSuccess("");
    if (type === "mechanic")         { setEditName(record.name); setEditDisplayName(record.display_name || ""); }
    if (type === "company_user")     { setEditCompanyId(record.company_id); setEditDisplayName(record.display_name || ""); }
    if (type === "admin")            { setEditDisplayName(record.display_name || ""); }
    if (type === "account_manager")  { setEditDisplayName(record.display_name || ""); setEditAssignCompanyId(""); }
    setEditModal({ type, record });
  };

  const q = s => s.toLowerCase();
  const filteredAMs    = accountManagers.filter(am => q(am.display_name || "").includes(q(amSearch))   || q(am.email).includes(q(amSearch)));
  const filteredMechs  = mechanics.filter(m  => q(m.display_name || "").includes(q(mechSearch)) || q(m.name  || "").includes(q(mechSearch)) || q(m.email).includes(q(mechSearch)));
  const filteredCUs    = companyUsers.filter(u  => q(u.display_name || "").includes(q(cuSearch))    || q(u.user_id || "").includes(q(cuSearch)) || q(companiesMap[u.company_id] || "").includes(q(cuSearch)));
  const filteredAdmins = admins.filter(a  => q(a.display_name || "").includes(q(adminSearch)) || q(a.email).includes(q(adminSearch)));

  const SectionHeader = ({ label, count, children }) => (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--snow)" }}>
        {label} <span style={{ color:"var(--muted)", fontWeight:400 }}>({count})</span>
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">User Management</div>
          <div className="page-sub">Manage mechanic, client, account manager, and admin accounts across all portals</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}><IcoRefresh /></button>
      </div>

      <div className="stats-row stats-5">
        <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{admins.length + mechanics.length + companyUsers.length + accountManagers.length}</div></div>
        <div className="stat-card"><div className="stat-label">Admins</div><div className="stat-value c-amber">{admins.length}</div></div>
        <div className="stat-card"><div className="stat-label">Mechanics</div><div className="stat-value" style={{ color:"#2dd4bf" }}>{mechanics.length}</div></div>
        <div className="stat-card"><div className="stat-label">Client Users</div><div className="stat-value c-blue">{companyUsers.length}</div></div>
        <div className="stat-card"><div className="stat-label">Acct Managers</div><div className="stat-value" style={{ color:"#a78bfa" }}>{accountManagers.length}</div></div>
      </div>

      {error   && <div className="error-box"   style={{ marginBottom:10 }}>{error}</div>}
      {success && <div className="success-box" style={{ marginBottom:10 }}>{success}</div>}

      {loading ? <div className="loading-row">Loading users…</div> : (
        <>

          {/* ── ACCOUNT MANAGERS ── */}
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="Account Managers" count={amSearch ? `${filteredAMs.length}/${accountManagers.length}` : accountManagers.length}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input value={amSearch} onChange={e => setAmSearch(e.target.value)} placeholder="Search…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:160, outline:"none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => { setAddModal("account_manager"); setError(""); setSuccess(""); setAmForm({ email:"", password:"", display_name:"" }); }}>
                  <IcoPlus /> Add Account Manager
                </button>
              </div>
            </SectionHeader>
            {accountManagers.length === 0 ? (
              <div className="empty-state"><p>No account managers yet.</p></div>
            ) : filteredAMs.length === 0 ? (
              <div className="empty-state"><p>No results for "{amSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredAMs.map(am => {
                      const assigned = amCompanies.filter(a => a.account_manager_id === am.id);
                      return (
                        <tr key={am.id} style={{ cursor:"default" }}>
                          <td>
                            <div style={{ fontWeight:600, fontSize:13 }}>{am.display_name || am.email}</div>
                            {am.display_name && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{am.email}</div>}
                          </td>
                          <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(139,92,246,0.12)", color:"#a78bfa", border:"1px solid rgba(139,92,246,0.22)" }}>Acct Manager</span></td>
                          <td style={{ fontSize:12, color:"var(--soft)" }}>{assigned.length === 0 ? <span style={{ color:"var(--muted)" }}>No companies</span> : <span>{assigned.length} {assigned.length === 1 ? "company" : "companies"}</span>}</td>
                          <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(am.created_at)}</td>
                          <td style={{ textAlign:"right" }}>
                            <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => openEdit("account_manager", am)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAccountManager(am.id, am.display_name || am.email)}>Remove</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── MECHANICS ── */}
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="Mechanics" count={mechSearch ? `${filteredMechs.length}/${mechanics.length}` : mechanics.length}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input value={mechSearch} onChange={e => setMechSearch(e.target.value)} placeholder="Search…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:160, outline:"none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => { setAddModal("mechanic"); setError(""); setSuccess(""); setMechForm({ name:"", email:"", password:"" }); }}>
                  <IcoPlus /> Add Mechanic
                </button>
              </div>
            </SectionHeader>
            {mechanics.length === 0 ? (
              <div className="empty-state"><p>No mechanics yet.</p></div>
            ) : filteredMechs.length === 0 ? (
              <div className="empty-state"><p>No results for "{mechSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredMechs.map(m => (
                      <tr key={m.id} style={{ cursor:"default" }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{m.display_name || m.name}</div>
                          <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{m.email}</div>
                        </td>
                        <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(45,212,191,0.12)", color:"#2dd4bf", border:"1px solid rgba(45,212,191,0.22)" }}>Mechanic</span></td>
                        <td style={{ fontSize:12, color:"var(--muted)" }}>—</td>
                        <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(m.created_at)}</td>
                        <td style={{ textAlign:"right" }}>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit("mechanic", m)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMechanic(m.id, m.name)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── COMPANY USERS ── */}
          <div style={{ marginBottom:28 }}>
            <SectionHeader label="DSP Users" count={cuSearch ? `${filteredCUs.length}/${companyUsers.length}` : companyUsers.length}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <input value={cuSearch} onChange={e => setCuSearch(e.target.value)} placeholder="Search name or DSP…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:180, outline:"none" }} />
                <button className="btn btn-primary btn-sm" onClick={() => { setAddModal("company_user"); setError(""); setSuccess(""); setUserForm({ email:"", password:"", company_id:"" }); }}>
                  <IcoPlus /> Add DSP User
                </button>
              </div>
            </SectionHeader>
            {companyUsers.length === 0 ? (
              <div className="empty-state"><p>No company users yet.</p></div>
            ) : filteredCUs.length === 0 ? (
              <div className="empty-state"><p>No results for "{cuSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredCUs.map(u => (
                      <tr key={u.id} style={{ cursor:"default" }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{u.display_name || <span className="mono" style={{ fontSize:11, fontWeight:400 }}>{u.user_id}</span>}</div>
                          {u.display_name && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }} className="mono">{u.user_id}</div>}
                        </td>
                        <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(96,165,250,0.12)", color:"#60a5fa", border:"1px solid rgba(96,165,250,0.22)" }}>Client</span></td>
                        <td style={{ fontSize:12, color:"var(--soft)" }}>{companiesMap[u.company_id] || <span style={{ color:"var(--muted)" }}>—</span>}</td>
                        <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(u.created_at)}</td>
                        <td style={{ textAlign:"right" }}>
                          <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit("company_user", u)}>Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRemoveCompanyUser(u.user_id, u.company_id)}>Remove</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── ADMINS ── */}
          <div>
            <SectionHeader label="Admins" count={adminSearch ? `${filteredAdmins.length}/${admins.length}` : admins.length}>
              <input value={adminSearch} onChange={e => setAdminSearch(e.target.value)} placeholder="Search…" style={{ padding:"4px 10px", fontSize:12, borderRadius:6, border:"1px solid var(--border)", background:"var(--raised)", color:"var(--text)", width:160, outline:"none" }} />
            </SectionHeader>
            <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>Admin accounts are managed directly via SQL — see CLAUDE.md. Display name is editable here.</div>
            {admins.length === 0 ? (
              <div className="empty-state"><p>No admins found.</p></div>
            ) : filteredAdmins.length === 0 ? (
              <div className="empty-state"><p>No results for "{adminSearch}".</p></div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>User</th><th>Role</th><th>Details</th><th>Added</th><th></th></tr></thead>
                  <tbody>
                    {filteredAdmins.map(a => (
                      <tr key={a.id} style={{ cursor:"default" }}>
                        <td>
                          <div style={{ fontWeight:600, fontSize:13 }}>{a.display_name || a.email}</div>
                          {a.display_name && <div style={{ fontSize:11, color:"var(--muted)", marginTop:1 }}>{a.email}</div>}
                        </td>
                        <td><span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:10, fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", background:"rgba(245,158,11,0.12)", color:"var(--accent)", border:"1px solid rgba(245,158,11,0.22)" }}>Admin</span></td>
                        <td style={{ fontSize:12, color:"var(--muted)" }}>—</td>
                        <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>{fmt(a.created_at)}</td>
                        <td style={{ textAlign:"right" }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => openEdit("admin", a)}>Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

      {/* ── ADD MECHANIC MODAL ── */}
      {addModal === "mechanic" && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>New Mechanic</h3>
                <div className="modal-head-sub">Create a mechanic account and grant portal access</div>
              </div>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field"><label>Full Name *</label><input value={mechForm.name} onChange={e => setMechForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" autoFocus /></div>
              <div className="field"><label>Email *</label><input type="email" value={mechForm.email} onChange={e => setMechForm(f=>({...f,email:e.target.value}))} placeholder="jane@company.com" /></div>
              <div className="field"><label>Password *</label><input type="password" value={mechForm.password} onChange={e => setMechForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreateMechanic} disabled={saving}>{saving ? "Creating…" : "Create Mechanic"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ACCOUNT MANAGER MODAL ── */}
      {addModal === "account_manager" && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>New Account Manager</h3>
                <div className="modal-head-sub">Create an account manager account and grant portal access</div>
              </div>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field"><label>Email *</label><input type="email" value={amForm.email} onChange={e => setAmForm(f=>({...f,email:e.target.value}))} placeholder="manager@company.com" autoFocus /></div>
              <div className="field"><label>Password *</label><input type="password" value={amForm.password} onChange={e => setAmForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
              <div className="field"><label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional)</span></label><input value={amForm.display_name} onChange={e => setAmForm(f=>({...f,display_name:e.target.value}))} placeholder="e.g. Sarah K." /></div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreateAccountManager} disabled={saving}>{saving ? "Creating…" : "Create Account Manager"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD COMPANY USER MODAL ── */}
      {addModal === "company_user" && (
        <div className="modal-overlay" onClick={() => setAddModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>New DSP User</h3>
                <div className="modal-head-sub">Create a client account and link to a DSP</div>
              </div>
              <button className="modal-close" onClick={() => setAddModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              <div className="field"><label>Email *</label><input type="email" value={userForm.email} onChange={e => setUserForm(f=>({...f,email:e.target.value}))} placeholder="user@company.com" autoFocus /></div>
              <div className="field"><label>Password *</label><input type="password" value={userForm.password} onChange={e => setUserForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
              <div className="field">
                <label>DSP *</label>
                <select value={userForm.company_id} onChange={e => setUserForm(f=>({...f,company_id:e.target.value}))}>
                  <option value="">— Select DSP —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setAddModal(null)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleCreateCompanyUser} disabled={saving}>{saving ? "Creating…" : "Create User"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{editModal.type === "mechanic" ? "Edit Mechanic" : editModal.type === "admin" ? "Edit Admin" : editModal.type === "account_manager" ? "Edit Account Manager" : "Edit DSP User"}</h3>
                <div className="modal-head-sub">{editModal.record.email || editModal.record.user_id}</div>
              </div>
              <button className="modal-close" onClick={() => setEditModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {error && <div className="error-box" style={{ marginBottom:12 }}>{error}</div>}
              {editModal.type === "mechanic" && (
                <>
                  <div className="field">
                    <label>Full Name *</label>
                    <input value={editName} onChange={e => setEditName(e.target.value)} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditModal(null); }} />
                  </div>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of name)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder={editName || "e.g. Jake M."} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={editModal.record.email} disabled style={{ opacity:0.5 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveMechName(editModal.record.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </>
              )}
              {editModal.type === "company_user" && (
                <>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of user ID)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder="e.g. Acme Driver" autoFocus />
                  </div>
                  <div className="field">
                    <label>DSP *</label>
                    <select value={editCompanyId} onChange={e => setEditCompanyId(e.target.value)}>
                      <option value="">— Select DSP —</option>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="field">
                    <label>User ID</label>
                    <input value={editModal.record.user_id} disabled style={{ opacity:0.5, fontFamily:"monospace", fontSize:12 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleReassignCompany(editModal.record.user_id)} disabled={saving || !editCompanyId}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </>
              )}
              {editModal.type === "admin" && (
                <>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of email)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder={editModal.record.email} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditModal(null); }} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={editModal.record.email} disabled style={{ opacity:0.5 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveAdminDisplayName(editModal.record.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                </>
              )}
              {editModal.type === "account_manager" && (
                <>
                  <div className="field">
                    <label>Display Name <span style={{ color:"var(--muted)", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(optional — shown in place of email)</span></label>
                    <input value={editDisplayName} onChange={e => setEditDisplayName(e.target.value)} placeholder={editModal.record.email} autoFocus
                      onKeyDown={e => { if (e.key === "Escape") setEditModal(null); }} />
                  </div>
                  <div className="field">
                    <label>Email</label>
                    <input value={editModal.record.email} disabled style={{ opacity:0.5 }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditModal(null)}>Cancel</button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSaveAMDisplayName(editModal.record.id)} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
                  </div>
                  <div style={{ borderTop:"1px solid var(--rim)", marginTop:16, paddingTop:14 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#a78bfa", marginBottom:8 }}>Assigned DSPs</div>
                    {amCompanies.filter(a => a.account_manager_id === editModal.record.id).length === 0 ? (
                      <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>No DSPs assigned yet.</div>
                    ) : (
                      amCompanies.filter(a => a.account_manager_id === editModal.record.id).map(a => (
                        <div key={a.company_id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                          <span style={{ fontSize:13 }}>{companiesMap[a.company_id] || a.company_id}</span>
                          <button className="btn btn-danger btn-sm" onClick={() => handleUnassignCompanyFromAM(editModal.record.id, a.company_id)}>Remove</button>
                        </div>
                      ))
                    )}
                    <div style={{ display:"flex", gap:6, marginTop:8 }}>
                      <select style={{ flex:1, background:"var(--surface-2)", border:"1px solid var(--rim)", borderRadius:5, color:"var(--snow)", padding:"6px 8px", fontSize:13 }}
                        value={editAssignCompanyId} onChange={e => setEditAssignCompanyId(e.target.value)}>
                        <option value="">— Add DSP —</option>
                        {companies.filter(c => !amCompanies.some(a => a.account_manager_id === editModal.record.id && a.company_id === c.id))
                          .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAssignCompanyToAM(editModal.record.id)} disabled={saving || !editAssignCompanyId}>{saving ? "…" : "Add"}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
