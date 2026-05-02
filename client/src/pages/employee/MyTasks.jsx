import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getTasksApi, updateTaskApi } from "../../api/taskApi";

const FILTER_STATUSES = ["all", "todo", "in-progress", "review", "completed"];

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    priority: "all",
  });

  useEffect(() => {
    getTasksApi()
      .then((response) => setTasks(response.data))
      .finally(() => setLoading(false));
  }, []);

  const filteredTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => {
          const search = filters.search.trim().toLowerCase();
          const matchesSearch =
            !search ||
            task.title.toLowerCase().includes(search) ||
            (task.project?.name || "").toLowerCase().includes(search) ||
            (task.description || "").toLowerCase().includes(search);
          const matchesStatus = filters.status === "all" || task.status === filters.status;
          const matchesPriority = filters.priority === "all" || task.priority === filters.priority;
          return matchesSearch && matchesStatus && matchesPriority;
        })
        .sort((first, second) => {
          const firstDate = first.deadline ? new Date(first.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          const secondDate = second.deadline ? new Date(second.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          return firstDate - secondDate;
        }),
    [filters, tasks]
  );

  const handleStatusChange = async (taskId, status) => {
    setSavingTaskId(taskId);
    try {
      await updateTaskApi(taskId, { status });
      setTasks((prev) => prev.map((task) => (task._id === taskId ? { ...task, status } : task)));
    } finally {
      setSavingTaskId("");
    }
  };

  const handleTimerAction = async (taskId, timerAction) => {
    setSavingTaskId(taskId);
    try {
      const { data } = await updateTaskApi(taskId, { timerAction });
      setTasks((prev) => prev.map((task) => (task._id === taskId ? data : task)));
    } finally {
      setSavingTaskId("");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar
        title="My Tasks"
        subtitle="Every row is backed by the employee task API and can update status live."
      />

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="responsive-filter-grid">
          <input
            className="form-input"
            placeholder="Search by title, project, or description"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />

          <select
            className="form-select"
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
          >
            {FILTER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All statuses" : formatStatus(status)}
              </option>
            ))}
          </select>

          <select
            className="form-select"
            value={filters.priority}
            onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gap: "1rem" }}>
        {!filteredTasks.length ? (
          <div className="card">
            <div className="empty-state" style={{ padding: "3rem 1rem" }}>
              <p>No tasks match the current filters.</p>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const overdue = Boolean(task.deadline) && new Date(task.deadline) < new Date() && task.status !== "completed";

            return (
              <div className="card" key={task._id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem" }}>{task.title}</h2>
                    <p style={{ color: "var(--text2)", fontSize: "0.86rem" }}>
                      {task.project?.name || "No project"} • Assigned by {task.assignedBy?.name || "Manager"}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <StatusBadge value={task.priority} />
                    <StatusBadge value={task.status} />
                    {overdue ? <span className="badge badge-red">Overdue</span> : null}
                  </div>
                </div>

                <p style={{ color: "var(--text2)", marginBottom: "1rem" }}>
                  {task.description || "No description added for this task."}
                </p>

                <div className="responsive-info-grid-4" style={{ marginBottom: "1rem" }}>
                  <InfoBlock label="Deadline" value={formatDate(task.deadline)} />
                  <InfoBlock label="Created" value={formatDate(task.createdAt)} />
                  <InfoBlock label="Updated" value={formatDate(task.updatedAt)} />
                  <InfoBlock label="Task ID" value={task._id.slice(-6).toUpperCase()} />
                </div>

                <div className="responsive-info-grid-3" style={{ marginBottom: "1rem" }}>
                  <InfoBlock label="Assigned Time" value={formatMinutes(task.estimatedMinutes || 0)} />
                  <InfoBlock label="Tracked Time" value={formatMinutes(task.trackedMinutes || 0)} />
                  <InfoBlock label="Timer" value={task.timerStartedAt ? "Running" : "Stopped"} />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Update status
                  </label>
                  <select
                    className="form-select"
                    style={{ maxWidth: 220 }}
                    value={task.status}
                    disabled={savingTaskId === task._id}
                    onChange={(event) => handleStatusChange(task._id, event.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                  {savingTaskId === task._id ? (
                    <span style={{ fontSize: "0.82rem", color: "var(--text3)" }}>Saving...</span>
                  ) : null}
                  <button
                    type="button"
                    className={`btn btn-sm ${task.timerStartedAt ? "btn-danger" : "btn-primary"}`}
                    onClick={() => handleTimerAction(task._id, task.timerStartedAt ? "stop" : "start")}
                    disabled={savingTaskId === task._id}
                  >
                    {task.timerStartedAt ? "Stop Timer" : "Start Timer"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div style={{ background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "0.85rem 1rem" }}>
      <p className="stat-label" style={{ marginBottom: "0.2rem" }}>{label}</p>
      <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>{value}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString();
}

function formatStatus(value) {
  if (value === "in-progress") return "In Progress";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatMinutes(minutes) {
  const safeMinutes = Number(minutes) || 0;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (!hours) return `${rest}m`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
