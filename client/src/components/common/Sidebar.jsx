import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useRole } from "../../hooks/useRole";

const adminLinks = [
  { to: "/admin",          label: "Dashboard",    icon: "⬡" },
  { to: "/admin/users",    label: "Users",        icon: "◈" },
  { to: "/admin/projects", label: "Projects",     icon: "◫" },
  { to: "/admin/teams",    label: "Teams",        icon: "◎" },
];

const managerLinks = [
  { to: "/manager",             label: "Dashboard",  icon: "⬡" },
  { to: "/manager/my-tasks",    label: "My Tasks",   icon: "◉" },
  { to: "/manager/my-team",     label: "My Team",    icon: "◎" },
  { to: "/manager/task-board",  label: "Task Board", icon: "◫" },
  { to: "/manager/create-task", label: "New Task",   icon: "+" },
];

const employeeLinks = [
  { to: "/employee",           label: "Dashboard", icon: "⬡" },
  { to: "/employee/my-tasks",  label: "My Tasks",  icon: "◫" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { isAdmin, isManager } = useRole();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = isAdmin ? adminLinks : isManager ? managerLinks : employeeLinks;

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate("/login");
  };

  const roleColor = isAdmin ? "var(--accent2)" : isManager ? "var(--blue)" : "var(--green)";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <aside className={`sidebar-shell ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Logo */}
      <div className="sidebar-section sidebar-brand">
        <div className="sidebar-brand-row">
          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
            <div style={{
              width:32, height:32, borderRadius:8, background:"var(--accent-bg)",
              border:"1px solid rgba(124,106,247,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.25rem",
            }}>⬡</div>
            <span style={{ fontWeight:600, fontSize:"1rem", letterSpacing:"-0.02em" }}>Task Assignment</span>
          </div>
          <button
            type="button"
            className="sidebar-menu-toggle"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        <div className="theme-switcher sidebar-collapsible">
          <button
            type="button"
            className={`theme-toggle ${theme === "dark" ? "active" : ""}`}
            onClick={() => {
              setTheme("dark");
              setMobileOpen(false);
            }}
          >
            Dark
          </button>
          <button
            type="button"
            className={`theme-toggle ${theme === "light" ? "active" : ""}`}
            onClick={() => {
              setTheme("light");
              setMobileOpen(false);
            }}
          >
            Light
          </button>
        </div>
      </div>

      {/* User pill */}
      <div className="sidebar-section sidebar-user sidebar-collapsible">
        <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
          <div style={{
            width:32, height:32, borderRadius:"50%",
            background:`linear-gradient(135deg, ${roleColor}33, ${roleColor}11)`,
            border:`1px solid ${roleColor}44`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"0.8rem", fontWeight:600, color: roleColor,
          }}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:"0.82rem", fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user?.name}</p>
            <p style={{ fontSize:"0.72rem", color: roleColor, textTransform:"capitalize" }}>{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="sidebar-nav sidebar-collapsible">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setMobileOpen(false)}
            end={link.to.split("/").length === 2}
            style={({ isActive }) => ({
              display:"flex", alignItems:"center", gap:"0.65rem",
              padding:"0.55rem 0.75rem", borderRadius:"var(--radius)",
              fontSize:"0.875rem", fontWeight:500, textDecoration:"none",
              color: isActive ? "var(--text)" : "var(--text2)",
              background: isActive ? "var(--bg3)" : "transparent",
              transition:"all var(--transition)",
            })}
          >
            <span style={{ fontSize:"0.9rem", opacity:0.7 }}>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="sidebar-logout sidebar-collapsible">
        <button className="btn btn-ghost" style={{ width:"100%", justifyContent:"flex-start", gap:"0.65rem" }} onClick={handleLogout}>
          <span style={{ opacity:0.6 }}>↩</span> Logout
        </button>
      </div>
    </aside>
  );
}
