export default function StatusBadge({ value, type = "status" }) {
  const statusMap = {
    // task status
    "todo":        "badge-gray",
    "in-progress": "badge-blue",
    "review":      "badge-amber",
    "completed":   "badge-green",
    // priority
    "low":    "badge-gray",
    "medium": "badge-amber",
    "high":   "badge-red",
    // project status
    "active":    "badge-green",
    "on-hold":   "badge-amber",
    // role
    "admin":    "badge-purple",
    "manager":  "badge-blue",
    "employee": "badge-gray",
  };

  const labelMap = {
    "in-progress": "In Progress",
    "on-hold":     "On Hold",
  };

  const cls = statusMap[value] || "badge-gray";
  const label = labelMap[value] || (value ? value.charAt(0).toUpperCase() + value.slice(1) : "—");

  return <span className={`badge ${cls}`}>{label}</span>;
}