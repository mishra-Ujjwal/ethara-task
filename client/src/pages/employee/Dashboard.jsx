import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getTaskStatsApi, getTasksApi, updateTaskApi } from "../../api/taskApi";
import { useAuth } from "../../hooks/useAuth";

const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "review", label: "Review" },
  { value: "completed", label: "Completed" },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState("");

  useEffect(() => {
    Promise.all([getTaskStatsApi(), getTasksApi()])
      .then(([statsResponse, tasksResponse]) => {
        setStats(statsResponse.data);
        setTasks(tasksResponse.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((first, second) => new Date(second.updatedAt || second.createdAt) - new Date(first.updatedAt || first.createdAt))
        .slice(0, 5),
    [tasks]
  );

  const nextUpTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.status !== "completed")
        .sort((first, second) => {
          const firstDeadline = first.deadline ? new Date(first.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          const secondDeadline = second.deadline ? new Date(second.deadline).getTime() : Number.MAX_SAFE_INTEGER;
          return firstDeadline - secondDeadline;
        })
        .slice(0, 4),
    [tasks]
  );

  const completionRate = stats?.total ? Math.round(((stats.completed || 0) / stats.total) * 100) : 0;

  const updateTaskStatus = async (taskId, status) => {
    setSavingTaskId(taskId);
    try {
      await updateTaskApi(taskId, { status });
      setTasks((prev) => {
        const nextTasks = prev.map((task) => (task._id === taskId ? { ...task, status } : task));
        setStats(buildStatsFromTasks(nextTasks));
        return nextTasks;
      });
    } finally {
      setSavingTaskId("");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar
        title={`Welcome, ${user?.name?.split(" ")[0] || "Employee"}`}
        subtitle="Your task summary is pulled live from the backend."
      />

      <div className="stats-grid">
        {[
          { label: "Assigned Tasks", value: stats?.total ?? 0, color: "var(--accent2)" },
          { label: "To Do", value: stats?.todo ?? 0, color: "var(--text2)" },
          { label: "In Progress", value: stats?.inProgress ?? 0, color: "var(--blue)" },
          { label: "Review", value: stats?.review ?? 0, color: "var(--amber)" },
          { label: "Completed", value: stats?.completed ?? 0, color: "var(--green)" },
          { label: "Overdue", value: stats?.overdue ?? 0, color: "var(--red)" },
          { label: "Assigned Time", value: formatMinutes(stats?.estimatedMinutes ?? 0), color: "var(--accent2)" },
          { label: "Tracked Time", value: formatMinutes(stats?.trackedMinutes ?? 0), color: "var(--blue)" },
        ].map((item) => (
          <div className="stat-card" key={item.label}>
            <p className="stat-label">{item.label}</p>
            <p className="stat-value" style={{ color: item.color }}>
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="responsive-two-panel">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 600 }}>Recent Tasks</h2>
              <p className="page-subtitle">Quick status updates sync directly to `/api/tasks/:id`.</p>
            </div>
            <div className="badge badge-blue">{completionRate}% done</div>
          </div>

          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks assigned yet.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((task) => (
                    <tr key={task._id}>
                      <td>
                        <div>
                          <p style={{ fontWeight: 500, color: "var(--text)" }}>{task.title}</p>
                          <p style={{ fontSize: "0.75rem", color: "var(--text3)" }}>
                            {task.description || "No description"}
                          </p>
                        </div>
                      </td>
                      <td>{task.project?.name || "Unassigned"}</td>
                      <td>
                        <StatusBadge value={task.priority} />
                      </td>
                      <td>
                        <select
                          className="form-select"
                          style={{ minWidth: 150 }}
                          value={task.status}
                          disabled={savingTaskId === task._id}
                          onChange={(event) => updateTaskStatus(task._id, event.target.value)}
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>{formatDate(task.deadline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "1.5rem" }}>
          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Focus Queue</h2>
            {!nextUpTasks.length ? (
              <div className="empty-state" style={{ padding: "2rem 1rem" }}>
                <p>Everything is wrapped up.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "0.75rem" }}>
                {nextUpTasks.map((task) => (
                  <div className="card card-sm" key={task._id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.5rem" }}>
                      <p style={{ fontWeight: 500 }}>{task.title}</p>
                      <StatusBadge value={task.status} />
                    </div>
                    <p style={{ color: "var(--text2)", fontSize: "0.82rem", marginBottom: "0.65rem" }}>
                      {task.project?.name || "No project linked"}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                      <StatusBadge value={task.priority} />
                      <span style={{ fontSize: "0.78rem", color: "var(--text3)" }}>
                        Due {formatDate(task.deadline)}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.55rem", fontSize: "0.75rem", color: "var(--text3)" }}>
                      <span>Assigned {formatMinutes(task.estimatedMinutes || 0)}</span>
                      <span>Tracked {formatMinutes(task.trackedMinutes || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem" }}>Activity Snapshot</h2>
            <div style={{ display: "grid", gap: "0.85rem" }}>
              {STATUS_OPTIONS.map((item) => (
                <div key={item.value}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                    <span style={{ fontSize: "0.84rem", color: "var(--text2)" }}>{item.label}</span>
                    <span style={{ fontSize: "0.84rem", color: "var(--text)" }}>{countByStatus(tasks, item.value)}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "var(--bg4)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${tasks.length ? (countByStatus(tasks, item.value) / tasks.length) * 100 : 0}%`,
                        height: "100%",
                        background: getStatusColor(item.value),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function countByStatus(tasks, status) {
  return tasks.filter((task) => task.status === status).length;
}

function getStatusColor(status) {
  if (status === "completed") return "var(--green)";
  if (status === "review") return "var(--amber)";
  if (status === "in-progress") return "var(--blue)";
  return "var(--accent2)";
}

function formatDate(value) {
  if (!value) return "No deadline";
  return new Date(value).toLocaleDateString();
}

function buildStatsFromTasks(tasks) {
  const now = Date.now();

  return {
    total: tasks.length,
    todo: countByStatus(tasks, "todo"),
    inProgress: countByStatus(tasks, "in-progress"),
    review: countByStatus(tasks, "review"),
    completed: countByStatus(tasks, "completed"),
    estimatedMinutes: tasks.reduce((sum, task) => sum + (Number(task.estimatedMinutes) || 0), 0),
    trackedMinutes: tasks.reduce((sum, task) => sum + (Number(task.trackedMinutes) || 0), 0),
    overdue: tasks.filter(
      (task) => task.deadline && new Date(task.deadline).getTime() < now && task.status !== "completed"
    ).length,
  };
}

function formatMinutes(minutes) {
  const safeMinutes = Number(minutes) || 0;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;

  if (!hours) return `${rest}m`;
  if (!rest) return `${hours}h`;
  return `${hours}h ${rest}m`;
}
