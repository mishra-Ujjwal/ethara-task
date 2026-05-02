import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import toast from "react-hot-toast";

export default function Login() {
  const { login, loading, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(`/${user.role}`, { replace: true });
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form);
      toast.success(`Welcome back, ${data.name}!`);
      navigate(`/${data.role}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          {/* <div className="auth-logo-mark">⬡</div> */}
          <h1>Task Assignment</h1>
          <p>Sign in to your workspace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
            />
          </div>

          <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", marginTop:"0.25rem" }} disabled={loading}>
            {loading ? "Signing in…" : "Sign in →"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}