import StatusBadge from "./StatusBadge";

export default function TaskCard({ task, onStatusChange, onDelete, showActions = true }) {
  const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "completed";

  return (
    <div className="card card-sm fade-in" style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:"0.5rem" }}>
        <div style={{ flex:1 }}>
          <p style={{ fontWeight:500, fontSize:"0.9rem", marginBottom:"0.25rem" }}>{task.title}</p>
          {task.description && (
            <p style={{ fontSize:"0.8rem", color:"var(--text3)", lineHeight:1.5 }}>{task.description}</p>
          )}
        </div>
        <StatusBadge value={task.priority} />
      </div>

      <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", alignItems:"center" }}>
        <StatusBadge value={task.status} />
        {task.project?.name && (
          <span style={{ fontSize:"0.72rem", color:"var(--text3)", background:"var(--bg4)", padding:"0.2rem 0.6rem", borderRadius:"99px" }}>
            {task.project.name}
          </span>
        )}
        {isOverdue && (
          <span className="badge badge-red">Overdue</span>
        )}
      </div>

      {(task.assignedTo || task.deadline) && (
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"0.78rem", color:"var(--text3)" }}>
          {task.assignedTo?.name && <span>👤 {task.assignedTo.name}</span>}
          {task.deadline && <span> {new Date(task.deadline).toLocaleDateString()}</span>}
        </div>
      )}

      {showActions && onStatusChange && (
        <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.25rem" }}>
          {["todo","in-progress","review","completed"]
            .filter(s => s !== task.status)
            .slice(0,2)
            .map(s => (
              <button key={s} className="btn btn-ghost btn-sm" onClick={() => onStatusChange(task._id, s)}>
                → {s === "in-progress" ? "In Progress" : s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          {onDelete && (
            <button className="btn btn-danger btn-sm" style={{ marginLeft:"auto" }} onClick={() => onDelete(task._id)}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}