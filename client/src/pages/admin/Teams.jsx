import { useEffect, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Loader from "../../components/common/Loader";
import { getAllTeamsApi } from "../../api/teamApi";

export default function Teams() {
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTeamsApi().then(r => setTeams(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="fade-in">
      <Navbar title="Teams" subtitle={`${teams.length} teams across all managers`} />

      {teams.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <p>No teams yet. Create users to form teams.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {teams.map(team => (
            <div className="card" key={team._id}>
              {/* Manager header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "50%",
                  background: "var(--accent-bg)", border: "1px solid rgba(124,106,247,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.9rem", fontWeight: 600, color: "var(--accent2)",
                }}>
                  {team.manager?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>{team.manager?.name}</p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text3)" }}>{team.manager?.email}</p>
                </div>
                <span style={{
                  marginLeft: "auto", fontSize: "0.72rem", background: "var(--bg4)",
                  color: "var(--text3)", padding: "0.2rem 0.6rem", borderRadius: "99px",
                }}>
                  {team.employees?.length} members
                </span>
              </div>

              {/* Employees */}
              {team.employees?.length === 0 ? (
                <p style={{ fontSize: "0.8rem", color: "var(--text3)", textAlign: "center", padding: "0.5rem 0" }}>No employees assigned</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {team.employees.map(emp => (
                    <div key={emp._id} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%", background: "var(--bg4)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.7rem", fontWeight: 600, color: "var(--text2)", flexShrink: 0,
                      }}>{emp.name?.charAt(0).toUpperCase()}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "0.82rem", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{emp.name}</p>
                      </div>
                      <span className={`badge ${emp.isActive ? "badge-green" : "badge-red"}`} style={{ fontSize: "0.68rem" }}>
                        {emp.isActive ? "Active" : "Off"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}