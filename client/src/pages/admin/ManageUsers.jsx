import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getAllUsersApi, createUserApi, updateUserApi, deleteUserApi } from "../../api/userApi";
import toast from "react-hot-toast";

const EMPTY = { name:"", email:"", password:"", role:"manager", managerId:"" };

export default function ManageUsers() {
  const [users, setUsers]     = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const fetchUsers = () => {
    getAllUsersApi().then(r => {
      setUsers(r.data);
      setManagers(r.data.filter(u => u.role === "manager"));
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createUserApi(form);
      toast.success("User created!");
      setModal(false); setForm(EMPTY); fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const toggleActive = async (user) => {
    try {
      await updateUserApi(user._id, { isActive: !user.isActive });
      toast.success(user.isActive ? "User deactivated" : "User activated");
      fetchUsers();
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await deleteUserApi(id);
      toast.success("User deleted");
      fetchUsers();
    } catch { toast.error("Failed to delete"); }
  };

  const filtered = users.filter(u => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar
        title="Users"
        subtitle={`${users.length} total members`}
        actions={<button className="btn btn-primary" onClick={() => setModal(true)}>+ Add User</button>}
      />

      {/* Filters */}
      <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        <input
          className="form-input" style={{ maxWidth:240 }}
          placeholder="Search users…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
        {["all","admin","manager","employee"].map(r => (
          <button
            key={r} className={`btn ${roleFilter===r?"btn-primary":"btn-ghost"} btn-sm`}
            onClick={() => setRoleFilter(r)}
            style={{ textTransform:"capitalize" }}
          >{r}</button>
        ))}
      </div>

      <div className="card" style={{ padding:0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Manager</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign:"center", color:"var(--text3)", padding:"2rem" }}>No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                      <div style={{
                        width:28, height:28, borderRadius:"50%", background:"var(--bg4)",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontSize:"0.75rem", fontWeight:600, color:"var(--text2)", flexShrink:0,
                      }}>{u.name.charAt(0).toUpperCase()}</div>
                      <span style={{ fontWeight:500, color:"var(--text)" }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily:"var(--mono)", fontSize:"0.8rem" }}>{u.email}</td>
                  <td><StatusBadge value={u.role} /></td>
                  <td style={{ color:"var(--text3)", fontSize:"0.82rem" }}>{u.managerId?.name || "—"}</td>
                  <td>
                    <span className={`badge ${u.isActive ? "badge-green" : "badge-red"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:"flex", gap:"0.4rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                        {u.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Add User</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" required value={form.name}
                  onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" required value={form.email}
                  onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="jane@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input className="form-input" type="password" required minLength={6} value={form.password}
                  onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder="Min. 6 characters" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={form.role}
                    onChange={e => setForm(p => ({...p, role: e.target.value, managerId:""}))}>
                    <option value="manager">Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
                {form.role === "employee" && (
                  <div className="form-group">
                    <label className="form-label">Assign Manager</label>
                    <select className="form-select" required value={form.managerId}
                      onChange={e => setForm(p => ({...p, managerId: e.target.value}))}>
                      <option value="">Select manager</option>
                      {managers.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Creating…" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}