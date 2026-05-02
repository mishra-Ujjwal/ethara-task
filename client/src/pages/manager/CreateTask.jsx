import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import { createTaskApi } from "../../api/taskApi";
import { getMyTeamApi } from "../../api/teamApi";
import { getProjectsApi } from "../../api/projectApi";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const EMPTY = {
  title: "",
  description: "",
  project: "",
  assignedTo: "",
  priority: "medium",
  deadline: "",
  estimatedHours: "",
};

export default function CreateTask() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm]       = useState(EMPTY);
  const [team, setTeam]       = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    Promise.all([getMyTeamApi(), getProjectsApi()])
      .then(([t, p]) => { setTeam(t.data); setProjects(p.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await createTaskApi({
        ...form,
        estimatedMinutes: form.estimatedHours ? Math.round(Number(form.estimatedHours) * 60) : 0,
      });
      toast.success("Task created!");
      navigate("/manager/task-board");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create task");
    } finally { setSaving(false); }
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
        <div style={{display:"flex", flexDirection:"column",alignItems:"center"}}>
      <Navbar title="Create Task" subtitle="Assign work to your team or to yourself, with planned time included." />

      <div className="responsive-create-wrap">
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <div className="form-group">
              <label className="form-label">Task Title</label>
              <input className="form-input" required value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Design homepage wireframe" autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe what needs to be done…" />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Project</label>
                <select className="form-select" required value={form.project}
                  onChange={e => setForm(p => ({ ...p, project: e.target.value }))}>
                  <option value="">Select project</option>
                  {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign To</label>
                <select className="form-select" required value={form.assignedTo}
                  onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))}>
                  <option value="">Select assignee</option>
                  <option value={user?._id}>Myself ({user?.name})</option>
                  {team?.employees?.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-select" value={form.priority}
                  onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Assigned Time (hours)</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="0.25"
                value={form.estimatedHours}
                onChange={e => setForm(p => ({ ...p, estimatedHours: e.target.value }))}
                placeholder="e.g. 2.5"
              />
            </div>

            {/* Priority preview */}
            <div style={{
              padding: "0.75rem 1rem", borderRadius: "var(--radius)",
              background: form.priority === "high" ? "var(--red-bg)" : form.priority === "medium" ? "var(--amber-bg)" : "var(--bg4)",
              border: `1px solid ${form.priority === "high" ? "rgba(248,113,113,0.2)" : form.priority === "medium" ? "rgba(251,191,36,0.2)" : "var(--border)"}`,
              fontSize: "0.8rem",
              color: form.priority === "high" ? "var(--red)" : form.priority === "medium" ? "var(--amber)" : "var(--text3)",
            }}>
              {form.priority === "high" && "🔴 High priority — this task needs urgent attention"}
              {form.priority === "medium" && "🟡 Medium priority — complete within the sprint"}
              {form.priority === "low" && "⚪ Low priority — complete when time allows"}
            </div>

            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
              <button type="button" className="btn btn-ghost" onClick={() => navigate("/manager/task-board")}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Creating…" : "Create Task →"}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}
