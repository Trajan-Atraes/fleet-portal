import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { SUPABASE_URL } from "../lib/supabase";

const IcoPlus = () => <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

// ─── MECHANICS ────────────────────────────────────────────────
export default function Mechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState({ name:"", email:"", password:"" });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("mechanics").select("id, email, name, display_name, created_at").order("created_at", { ascending: false });
    setMechanics(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError("All fields are required."); return; }
    setSaving(true); setError(""); setSuccess("");
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-mechanic`, {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${session.access_token}` },
      body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
    });
    const result = await res.json();
    setSaving(false);
    if (result.error) { setError(result.error); return; }
    setSuccess(`${form.name} (${form.email}) created as mechanic.`);
    setForm({ name:"", email:"", password:"" });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} as a mechanic? This will revoke their portal access.`)) return;
    const { error: err } = await supabase.from("mechanics").delete().eq("id", id);
    if (err) { setError(err.message); return; }
    setSuccess(`${name} removed.`);
    load();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mechanics</div>
          <div className="page-sub">Manage mechanic accounts with access to service requests</div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><IcoPlus /> New Mechanic</>}
        </button>
      </div>

      {error   && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-title">New Mechanic Account</div>
          <div className="form-grid-3">
            <div className="field"><label>Full Name *</label><input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Jane Smith" /></div>
            <div className="field"><label>Email *</label><input type="email" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} placeholder="jane@company.com" /></div>
            <div className="field"><label>Password *</label><input type="password" value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} placeholder="Temporary password" /></div>
          </div>
          <div style={{ display:"flex", justifyContent:"flex-end", gap:8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create Mechanic"}</button>
          </div>
        </div>
      )}

      {loading ? <div className="loading-row">Loading…</div> : mechanics.length === 0 ? (
        <div className="empty-state">
          <h3>No mechanics yet</h3>
          <p>Create your first mechanic account above.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mechanics.map(m => (
                <tr key={m.id}>
                  <td style={{ fontWeight:600 }}>{m.display_name || m.name}</td>
                  <td style={{ color:"var(--soft)", fontSize:12 }}>{m.email}</td>
                  <td style={{ color:"var(--muted)", fontSize:11, whiteSpace:"nowrap" }}>
                    {new Date(m.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                  </td>
                  <td style={{ textAlign:"right" }}>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id, m.name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
