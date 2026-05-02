export default function Navbar({ title, subtitle, actions }) {
  return (
    <div className="page-header fade-in">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display:"flex", gap:"0.5rem" }}>{actions}</div>}
    </div>
  );
}