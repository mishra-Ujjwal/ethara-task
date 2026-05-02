import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import { getTaskStatsApi, getTasksApi } from "../../api/taskApi";
import { getMyTeamApi } from "../../api/teamApi";
import { useAuth } from "../../hooks/useAuth";

export default function ManagerDashboard() {
  const { user } = useAuth();
  const [stats, setStats]       = useState(null);
  const [team, setTeam]         = useState(null);
  const [recentTasks, setTasks] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getTaskStatsApi(), getMyTeamApi(), getTasksApi()])
      .then(([s, t, tk]) => {
        setStats(s.data);
        setTeam(t.data);
        setTasks(tk.data.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar title={`Hey, ${user?.name?.split(" ")[0]} `} subtitle="Here's your team's progress today." />

      <div className="stats-grid">
        {[
          { label: "Total Tasks",  value: stats?.total     ?? 0, color: "var(--accent2)" },
          { label: "In Progress",  value: stats?.inProgress ?? 0, color: "var(--blue)" },
          { label: "Under Review", value: stats?.review    ?? 0, color: "var(--amber)" },
          { label: "Completed",    value: stats?.completed ?? 0, color: "var(--green)" },
          { label: "Overdue",      value: stats?.overdue   ?? 0, color: "var(--red)" },
          { label: "Team Size",    value: team?.employees?.length ?? 0, color: "var(--text2)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1rem" }}>
        {/* Recent Tasks */}
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <div className="empty-state"><p>No tasks yet. Create one to get started.</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Task</th><th>Assigned To</th><th>Priority</th><th>Status</th><th>Deadline</th></tr>
                </thead>
                <tbody>
                  {recentTasks.map(t => (
                    <tr key={t._id}>
                      <td style={{ fontWeight: 500, color: "var(--text)" }}>{t.title}</td>
                      <td>{t.assignedTo?.name || "—"}</td>
                      <td><StatusBadge value={t.priority} /></td>
                      <td><StatusBadge value={t.status} /></td>
                      <td>{t.deadline ? new Date(t.deadline).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Team */}
        <div className="card">
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>
            My Team <span style={{ color: "var(--text3)", fontWeight: 400 }}>({team?.employees?.length ?? 0})</span>
          </h2>
          {!team?.employees?.length ? (
            <div className="empty-state"><p>No employees assigned yet.</p></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {team.employees.map(emp => (
                <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--blue-bg)", border: "1px solid rgba(96,165,250,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "0.8rem", fontWeight: 600, color: "var(--blue)", flexShrink: 0,
                  }}>{emp.name?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 500 }}>{emp.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</p>
                  </div>
                  <span className={`badge ${emp.isActive ? "badge-green" : "badge-red"}`} style={{ fontSize: "0.68rem" }}>
                    {emp.isActive ? "Active" : "Off"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}