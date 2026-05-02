import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import { getMyTeamApi } from "../../api/teamApi";
import { getTasksApi } from "../../api/taskApi";

export default function MyTeam() {
  const [team, setTeam]       = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyTeamApi(), getTasksApi()])
      .then(([t, tk]) => { setTeam(t.data); setTasks(tk.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const getEmpStats = (empId) => {
    const empTasks = tasks.filter(t => t.assignedTo?._id === empId);
    return {
      total:     empTasks.length,
      completed: empTasks.filter(t => t.status === "completed").length,
      overdue:   empTasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== "completed").length,
    };
  };

  return (
    <div className="fade-in">
      <Navbar
        title="My Team"
        subtitle={`${team?.employees?.length ?? 0} members in your team`}
      />

      {!team?.employees?.length ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p>No employees assigned to you yet. Ask your Admin to assign team members.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
          {team.employees.map(emp => {
            const s = getEmpStats(emp._id);
            const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
            return (
              <div className="card" key={emp._id} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "var(--blue-bg)", border: "1px solid rgba(96,165,250,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 600, color: "var(--blue)", flexShrink: 0,
                  }}>{emp.name?.charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{emp.name}</p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.email}</p>
                  </div>
                  <span className={`badge ${emp.isActive ? "badge-green" : "badge-red"}`}>
                    {emp.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
                  {[
                    { label: "Tasks",     value: s.total },
                    { label: "Done",      value: s.completed, color: "var(--green)" },
                    { label: "Overdue",   value: s.overdue,   color: s.overdue > 0 ? "var(--red)" : undefined },
                  ].map(st => (
                    <div key={st.label} style={{ background: "var(--bg3)", borderRadius: "var(--radius)", padding: "0.6rem", textAlign: "center" }}>
                      <p style={{ fontSize: "1.1rem", fontWeight: 600, color: st.color || "var(--text)" }}>{st.value}</p>
                      <p style={{ fontSize: "0.68rem", color: "var(--text3)", marginTop: "0.1rem" }}>{st.label}</p>
                    </div>
                  ))}
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text3)" }}>Completion</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text2)", fontFamily: "var(--mono)" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "var(--bg4)", borderRadius: 99 }}>
                    <div style={{
                      height: "100%", borderRadius: 99,
                      width: `${pct}%`,
                      background: pct === 100 ? "var(--green)" : "var(--accent)",
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}