export default function Loader({ fullPage = false }) {
  if (fullPage)
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh" }}>
        <div className="spinner" />
      </div>
    );
  return (
    <div className="loader-wrap">
      <div className="spinner" />
    </div>
  );
}