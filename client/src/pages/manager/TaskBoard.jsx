import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getTasksApi, updateTaskApi, deleteTaskApi } from "../../api/taskApi";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

const COLUMNS = [
  { key: "todo",        label: "To Do",      color: "var(--text3)" },
  { key: "in-progress", label: "In Progress", color: "var(--blue)" },
  { key: "review",      label: "Review",      color: "var(--amber)" },
  { key: "completed",   label: "Completed",   color: "var(--green)" },
];

export default function TaskBoard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState({ priority: "all", search: "" });
  const [editTask, setEditTask] = useState(null);
  const [savingTaskId, setSavingTaskId] = useState("");

  const fetchTasks = () =>
    getTasksApi().then(r => setTasks(r.data)).finally(() => setLoading(false));

  useEffect(() => { fetchTasks(); }, []);

  const moveTask = async (id, status) => {
    try {
      await updateTaskApi(id, { status });
      setTasks(prev => prev.map(t => t._id === id ? { ...t, status } : t));
      toast.success("Status updated");
    } catch { toast.error("Failed to update"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTaskApi(id);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success("Task deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    try {
      await updateTaskApi(editTask._id, {
        title: editTask.title,
        description: editTask.description,
        priority: editTask.priority,
        deadline: editTask.deadline,
        status: editTask.status,
        estimatedMinutes: editTask.estimatedMinutes,
        completionNote: editTask.completionNote,
      });
      toast.success("Task updated!");
      setEditTask(null);
      fetchTasks();
    } catch { toast.error("Update failed"); }
  };

  const handleTimer = async (taskId, timerAction) => {
    setSavingTaskId(taskId);
    try {
      const { data } = await updateTaskApi(taskId, { timerAction });
      setTasks(prev => prev.map(task => task._id === taskId ? data : task));
      toast.success(timerAction === "start" ? "Timer started" : "Timer stopped");
    } catch {
      toast.error("Timer update failed");
    } finally {
      setSavingTaskId("");
    }
  };

  const filteredTasks = tasks.filter(t => {
    const matchPriority = filter.priority === "all" || t.priority === filter.priority;
    const matchSearch   = t.title.toLowerCase().includes(filter.search.toLowerCase()) ||
                          (t.assignedTo?.name || "").toLowerCase().includes(filter.search.toLowerCase());
    return matchPriority && matchSearch;
  });

  const getCol = (key) => filteredTasks.filter(t => t.status === key);

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar
        title="Task Board"
        subtitle={`${tasks.length} total tasks`}
        actions={
          <button className="btn btn-primary" onClick={() => navigate("/manager/create-task")}>
            + New Task
          </button>
        }
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <input
          className="form-input" style={{ maxWidth: 220 }}
          placeholder="Search tasks or people…"
          value={filter.search}
          onChange={e => setFilter(p => ({ ...p, search: e.target.value }))}
        />
        {["all", "high", "medium", "low"].map(p => (
          <button
            key={p}
            className={`btn btn-sm ${filter.priority === p ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(f => ({ ...f, priority: p }))}
            style={{ textTransform: "capitalize" }}
          >{p}</button>
        ))}
      </div>

      {/* Kanban columns */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", alignItems: "start" }}>
        {COLUMNS.map(col => {
          const colTasks = getCol(col.key);
          return (
            <div key={col.key}>
             
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", padding: "0 0.25rem" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.8rem", fontWeight: 600, color: col.color }}>{col.label}</span>
                <span style={{
                  marginLeft: "auto", fontSize: "0.7rem", fontFamily: "var(--mono)",
                  background: "var(--bg4)", color: "var(--text3)",
                  padding: "0.1rem 0.5rem", borderRadius: "99px",
                }}>{colTasks.length}</span>
              </div>

          
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minHeight: 80 }}>
                {colTasks.length === 0 ? (
                  <div style={{
                    border: "1px dashed var(--border)", borderRadius: "var(--radius)",
                    padding: "1.5rem", textAlign: "center",
                    color: "var(--text3)", fontSize: "0.78rem",
                  }}>Empty</div>
                ) : colTasks.map(task => (
                  <TaskBoardCard
                    key={task._id}
                    task={task}
                    currentUserId={user?._id}
                    savingTaskId={savingTaskId}
                    columns={COLUMNS}
                    onMove={moveTask}
                    onEdit={() => setEditTask({
                      ...task,
                      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
                      estimatedMinutes: task.estimatedMinutes || 0,
                      completionNote: task.completionNote || "",
                    })}
                    onDelete={handleDelete}
                    onTimer={handleTimer}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editTask && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditTask(null)}>
          <div className="modal" style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Task</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setEditTask(null)}>✕</button>
            </div>
            <form onSubmit={handleEditSave} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" required value={editTask.title}
                  onChange={e => setEditTask(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={editTask.description || ""}
                  onChange={e => setEditTask(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Completion Summary</label>
                <textarea
                  className="form-textarea"
                  value={editTask.completionNote || ""}
                  onChange={e => setEditTask(p => ({ ...p, completionNote: e.target.value }))}
                  placeholder="What was done on this task?"
                />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={editTask.priority}
                    onChange={e => setEditTask(p => ({ ...p, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={editTask.status}
                    disabled={editTask.status === "completed"}
                    onChange={e => setEditTask(p => ({ ...p, status: e.target.value }))}>
                    {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" value={editTask.deadline}
                  onChange={e => setEditTask(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Time (minutes)</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={editTask.estimatedMinutes}
                  onChange={e => setEditTask(p => ({ ...p, estimatedMinutes: Number(e.target.value) || 0 }))}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setEditTask(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskBoardCard({ task, currentUserId, savingTaskId, columns, onMove, onEdit, onDelete, onTimer }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "completed";
  const nextCols  = columns.filter(c => c.key !== task.status);
  const canRunTimer = task.assignedTo?._id === currentUserId;
  const timerRunning = Boolean(task.timerStartedAt);

  return (
    <div className="card card-sm" style={{ display: "flex", flexDirection: "column", gap: "0.6rem", cursor: "default" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.4rem" }}>
        <p style={{ fontSize: "0.855rem", fontWeight: 500, lineHeight: 1.4, flex: 1 }}>{task.title}</p>
        <StatusBadge value={task.priority} />
      </div>

      {task.description && (
        <p style={{ fontSize: "0.75rem", color: "var(--text3)", lineHeight: 1.5,
          overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {task.description}
        </p>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text3)" }}>
        {task.assignedTo?.name && (
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%", background: "var(--bg4)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 600, color: "var(--text2)",
            }}>{task.assignedTo.name.charAt(0)}</span>
            {task.assignedTo.name}
          </span>
        )}
        {isOverdue && <span className="badge badge-red" style={{ fontSize: "0.65rem" }}>Overdue</span>}
        {task.deadline && !isOverdue && (
          <span> {new Date(task.deadline).toLocaleDateString()}</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.45rem", fontSize: "0.72rem" }}>
        <span style={{ color: "var(--text3)" }}>Assigned: {formatMinutes(task.estimatedMinutes || 0)}</span>
        <span style={{ color: "var(--text3)", textAlign: "right" }}>Tracked: {formatMinutes(task.trackedMinutes || 0)}</span>
      </div>
      {task.completionNote ? (
        <div style={{ fontSize: "0.75rem", lineHeight: 1.5, color: "var(--text2)", background: "var(--bg3)", borderRadius: "var(--radius)", padding: "0.65rem 0.75rem" }}>
          <strong style={{ color: "var(--text)" }}>Done:</strong> {task.completionNote}
        </div>
      ) : null}

      {/* Actions */}
      {/* <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: "0.5rem" }}>
        {nextCols.slice(0, 2).map(c => (
          <button key={c.key} className="btn btn-ghost btn-sm"
            style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
            onClick={() => onMove(task._id, c.key)}>
            → {c.label}
          </button>
        ))}
        {canRunTimer && (
          <button
            className={`btn btn-sm ${timerRunning ? "btn-danger" : "btn-primary"}`}
            style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
            disabled={savingTaskId === task._id || task.status === "completed"}
            onClick={() => onTimer(task._id, timerRunning ? "stop" : "start")}
          >
            {savingTaskId === task._id ? "..." : timerRunning ? "Stop Timer" : "Start Timer"}
          </button>
        )}
        <button className="btn btn-ghost btn-sm"
          style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem", marginLeft: "auto" }}
          onClick={onEdit}>✏</button>
        <button className="btn btn-danger btn-sm"
          style={{ fontSize: "0.7rem", padding: "0.2rem 0.5rem" }}
          onClick={() => onDelete(task._id)}>✕</button>
      </div> */}
    </div>
  );
}

function formatMinutes(minutes) {
  const safeMinutes = Number(minutes) || 0;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (!hours) return `${rest}m`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
