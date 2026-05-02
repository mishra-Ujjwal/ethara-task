import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import { getTaskStatsApi } from "../../api/taskApi";
import { getAllUsersApi } from "../../api/userApi";
import { getProjectsApi } from "../../api/projectApi";
import { getTasksApi } from "../../api/taskApi";
import StatusBadge from "../../components/common/StatusBadge";

export default function AdminDashboard() {
  const [stats, setStats]     = useState(null);
  const [users, setUsers]     = useState([]);
  const [projects, setProjects] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getTaskStatsApi(),
      getAllUsersApi(),
      getProjectsApi(),
      getTasksApi(),
    ]).then(([s, u, p, t]) => {
      setStats(s.data);
      setUsers(u.data);
      setProjects(p.data);
      setRecentTasks(t.data.slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const managers  = users.filter(u => u.role === "manager").length;
  const employees = users.filter(u => u.role === "employee").length;

  return (
    <div className="fade-in">
      <Navbar title="Dashboard" subtitle="Welcome back, here's your workspace overview." />

      <div className="stats-grid">
        {[
          { label:"Total Tasks",   value: stats?.total    ?? 0, color:"var(--accent2)" },
          { label:"Completed",     value: stats?.completed ?? 0, color:"var(--green)" },
          { label:"In Progress",   value: stats?.inProgress ?? 0, color:"var(--blue)" },
          { label:"Overdue",       value: stats?.overdue  ?? 0, color:"var(--red)" },
          { label:"Projects",      value: projects.length, color:"var(--amber)" },
          { label:"Managers",      value: managers,        color:"var(--accent2)" },
          { label:"Employees",     value: employees,       color:"var(--text2)" },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <p className="stat-label">{s.label}</p>
            <p className="stat-value" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1.5rem" }}>
        {/* Recent Tasks */}
        <div className="card">
          <h2 style={{ fontSize:"0.95rem", fontWeight:600, marginBottom:"1rem" }}>Recent Tasks</h2>
          {recentTasks.length === 0 ? (
            <div className="empty-state"><p>No tasks yet</p></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {recentTasks.map(t => (
                <div key={t._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.6rem 0", borderBottom:"1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize:"0.875rem", fontWeight:500 }}>{t.title}</p>
                    <p style={{ fontSize:"0.75rem", color:"var(--text3)" }}>{t.assignedTo?.name}</p>
                  </div>
                  <StatusBadge value={t.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="card">
          <h2 style={{ fontSize:"0.95rem", fontWeight:600, marginBottom:"1rem" }}>Projects</h2>
          {projects.length === 0 ? (
            <div className="empty-state"><p>No projects yet</p></div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {projects.slice(0,5).map(p => (
                <div key={p._id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0.6rem 0", borderBottom:"1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontSize:"0.875rem", fontWeight:500 }}>{p.name}</p>
                    <p style={{ fontSize:"0.75rem", color:"var(--text3)" }}>{p.assignedManagers?.length} managers</p>
                  </div>
                  <StatusBadge value={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}