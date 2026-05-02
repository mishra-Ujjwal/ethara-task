import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getTasksApi, updateTaskApi } from "../../api/taskApi";
import { useAuth } from "../../hooks/useAuth";

const FILTER_STATUSES = ["all", "todo", "in-progress", "review", "completed"];

export default function ManagerMyTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState("");
  const [filters, setFilters] = useState({ search: "", status: "all", priority: "all" });
  const [completionDrafts, setCompletionDrafts] = useState({});
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    getTasksApi()
      .then((response) => setTasks(response.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const myTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.assignedTo?._id === user?._id)
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
        .sort((first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()),
    [filters, tasks, user?._id]
  );

  const persistTaskPatch = async (taskId, payload) => {
    setSavingTaskId(taskId);
    try {
      const { data } = await updateTaskApi(taskId, payload);
      setTasks((prev) => prev.map((task) => (task._id === taskId ? data : task)));
      if (payload.completionNote !== undefined) {
        setCompletionDrafts((prev) => ({ ...prev, [taskId]: payload.completionNote }));
      }
    } finally {
      setSavingTaskId("");
    }
  };

  const handleStatusChange = async (task, status) => {
    const payload = { status };
    const draftNote = completionDrafts[task._id] ?? task.completionNote ?? "";

    if (status === "completed") {
      payload.completionNote = draftNote.trim();
    }

    await persistTaskPatch(task._id, payload);
  };

  const handleTimerAction = async (task, timerAction) => {
    if (task.status === "completed") return;
    await persistTaskPatch(task._id, { timerAction });
  };

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar
        title="My Tasks"
        subtitle="Your own manager tasks with live time tracking and locked completed work."
      />

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div className="responsive-filter-grid">
          <input
            className="form-input"
            placeholder="Search my tasks"
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

      <div className="responsive-content-center" style={{ display: "grid", gap: "1rem" }}>
        {!myTasks.length ? (
          <div className="card">
            <div className="empty-state" style={{ padding: "3rem 1rem" }}>
              <p>No manager self-tasks found.</p>
            </div>
          </div>
        ) : (
          myTasks.map((task) => {
            const completionNote = completionDrafts[task._id] ?? task.completionNote ?? "";
            const liveTrackedMinutes = getLiveTrackedMinutes(task, now);
            const completedLocked = task.status === "completed";

            return (
              <div className="card" key={task._id}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem", alignItems: "flex-start" }}>
                  <div>
                    <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "0.35rem" }}>{task.title}</h2>
                    <p style={{ color: "var(--text2)", fontSize: "0.86rem" }}>
                      {task.project?.name || "No project"} • Assigned by {task.assignedBy?.name || "Manager"}
                    </p>
                    <p style={{ color: "var(--text3)", fontSize: "0.8rem", marginTop: "0.4rem" }}>
                      Created {getRelativeLabel(task.createdAt)} • {getDaysGoneLabel(task.createdAt)}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <StatusBadge value={task.priority} />
                    <StatusBadge value={task.status} />
                  </div>
                </div>

                <p style={{ color: "var(--text2)", marginBottom: "1rem" }}>
                  {task.description || "No description added for this task."}
                </p>

                <div className="responsive-info-grid-4" style={{ marginBottom: "1rem" }}>
                  <InfoBlock label="Deadline" value={`${getRelativeLabel(task.deadline)}${task.deadline ? ` • ${getDaysOffsetLabel(task.deadline)}` : ""}`} />
                  <InfoBlock label="Assigned Time" value={formatDuration(task.estimatedMinutes || 0)} />
                  <InfoBlock label="Tracked Time" value={formatDuration(liveTrackedMinutes)} />
                  <InfoBlock label="Timer" value={task.timerStartedAt ? "Running live" : completedLocked ? "Closed" : "Stopped"} />
                </div>

                <div style={{ display: "grid", gap: "0.85rem", marginBottom: "1rem" }}>
                  <label className="form-label">Work Summary</label>
                  <textarea
                    className="form-textarea"
                    placeholder="What did you complete on this task?"
                    value={completionNote}
                    onChange={(event) => setCompletionDrafts((prev) => ({ ...prev, [task._id]: event.target.value }))}
                  />
                </div>

                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Update status
                  </label>
                  <select
                    className="form-select"
                    style={{ maxWidth: 240 }}
                    value={task.status}
                    disabled={savingTaskId === task._id || completedLocked}
                    onChange={(event) => handleStatusChange(task, event.target.value)}
                  >
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button
                    type="button"
                    className={`btn btn-sm ${task.timerStartedAt ? "btn-danger" : "btn-primary"}`}
                    disabled={savingTaskId === task._id || completedLocked}
                    onClick={() => handleTimerAction(task, task.timerStartedAt ? "stop" : "start")}
                  >
                    {task.timerStartedAt ? `Stop Timer (${formatDuration(liveTrackedMinutes)})` : "Start Timer"}
                  </button>
                  {completedLocked ? (
                    <span className="badge badge-green">Completed tasks stay locked</span>
                  ) : null}
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
      <p style={{ fontSize: "0.9rem", color: "var(--text)" }}>{value || "Not set"}</p>
    </div>
  );
}

function getLiveTrackedMinutes(task, now) {
  const base = Number(task.trackedMinutes) || 0;
  if (!task.timerStartedAt) return base;
  const elapsedMinutes = Math.max(0, Math.floor((now - new Date(task.timerStartedAt).getTime()) / 60000));
  return base + elapsedMinutes;
}

function formatDuration(minutes) {
  const safeMinutes = Number(minutes) || 0;
  const hours = Math.floor(safeMinutes / 60);
  const rest = safeMinutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}

function formatStatus(value) {
  if (value === "in-progress") return "In Progress";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRelativeLabel(value) {
  if (!value) return "No date";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString();
}

function getDaysGoneLabel(value) {
  if (!value) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff <= 0) return "started today";
  if (diff === 1) return "1 day gone";
  return `${diff} days gone`;
}

function getDaysOffsetLabel(value) {
  if (!value) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "due today";
  if (diff > 0) return diff === 1 ? "1 day left" : `${diff} days left`;
  const gone = Math.abs(diff);
  return gone === 1 ? "1 day gone" : `${gone} days gone`;
}
