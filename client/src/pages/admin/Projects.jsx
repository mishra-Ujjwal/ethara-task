import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getProjectsApi, createProjectApi, updateProjectApi, deleteProjectApi } from "../../api/projectApi";
import { getAllUsersApi } from "../../api/userApi";
import toast from "react-hot-toast";

const EMPTY = { name: "", description: "", assignedManagers: [], deadline: "", status: "active" };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);

  const fetchAll = () =>
    Promise.all([getProjectsApi(), getAllUsersApi("manager")])
      .then(([p, u]) => { setProjects(p.data); setManagers(u.data); })
      .finally(() => setLoading(false));

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditTarget(null); setForm(EMPTY); setModal(true); };
  const openEdit   = (p) => {
    setEditTarget(p);
    setForm({
      name: p.name, description: p.description || "",
      assignedManagers: p.assignedManagers?.map(m => m._id) || [],
      deadline: p.deadline ? p.deadline.slice(0, 10) : "",
      status: p.status,
    });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editTarget) {
        await updateProjectApi(editTarget._id, form);
        toast.success("Project updated!");
      } else {
        await createProjectApi(form);
        toast.success("Project created!");
      }
      setModal(false); fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this project?")) return;
    try { await deleteProjectApi(id); toast.success("Deleted"); fetchAll(); }
    catch { toast.error("Failed to delete"); }
  };

  const toggleManager = (id) =>
    setForm(p => ({
      ...p,
      assignedManagers: p.assignedManagers.includes(id)
        ? p.assignedManagers.filter(m => m !== id)
        : [...p.assignedManagers, id],
    }));

  if (loading) return <Loader />;

  return (
    <div className="">
      <Navbar
        title="Projects"
        subtitle={`${projects.length} projects`}
        actions={<button className="btn btn-primary" onClick={openCreate}>+ New Project</button>}
      />

      {projects.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">◫</div>
            <p>No projects yet — create your first one.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid",  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {projects.map(p => (
            <div className="card" key={p._id} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.25rem" }}>{p.name}</p>
                  {p.description && (
                    <p style={{ fontSize: "0.8rem", color: "var(--text3)", lineHeight: 1.5 }}>{p.description}</p>
                  )}
                </div>
                <StatusBadge value={p.status} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {p.assignedManagers?.map(m => (
                  <span key={m._id} style={{
                    fontSize: "0.92rem", background: "var(--bg4)", color: "var(--text2)",
                    padding: "0.4rem 0.7rem", borderRadius: "19px",
                  }}> {m.name}</span>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text3)" }}>
                  {p.deadline ? ` ${new Date(p.deadline).toLocaleDateString()}` : "No deadline"}
                </span>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? "Edit Project" : "New Project"}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input className="form-input" required value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Website Redesign" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description…" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input className="form-input" type="date" value={form.deadline}
                    onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Assign Managers</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.25rem" }}>
                  {managers.map(m => {
                    const selected = form.assignedManagers.includes(m._id);
                    return (
                      <button type="button" key={m._id}
                        onClick={() => toggleManager(m._id)}
                        className={`btn btn-sm ${selected ? "btn-primary" : "btn-ghost"}`}>
                        {m.name}
                      </button>
                    );
                  })}
                  {managers.length === 0 && <span style={{ fontSize: "0.8rem", color: "var(--text3)" }}>No managers yet</span>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}