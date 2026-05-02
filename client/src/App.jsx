import { useMemo, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import Loader from "./components/common/Loader";
import ProtectedRoute from "./components/common/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import Projects from "./pages/admin/Projects";
import Teams from "./pages/admin/Teams";
import EmployeeDashboard from "./pages/employee/Dashboard";
import EmployeeTasks from "./pages/employee/MyTasks";
import ManagerDashboard from "./pages/manager/Dashboard";
import ManagerMyTasks from "./pages/manager/MyTasks";
import MyTeam from "./pages/manager/MyTeam";
import TaskBoard from "./pages/manager/TaskBoard";
import CreateTask from "./pages/manager/CreateTask";

function AppShell() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <Loader fullPage />;
  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={`/${user.role}`} replace />;
}

function RoleLandingRedirect() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return <Navigate to="/login" replace />;

  const targetPrefix = `/${user.role}`;
  if (!location.pathname.startsWith(targetPrefix)) {
    return <Navigate to={targetPrefix} replace />;
  }

  return <Outlet />;
}

function LoginPage() {
  const { login, loading, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [formError, setFormError] = useState("");

  const pageError = formError || error;

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
    if (error) clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    try {
      const data = await login(form);
      navigate(`/${data.role}`, { replace: true });
    } catch (err) {
      setFormError(err.message || "Login failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          {/* <div className="auth-logo-mark">⬡</div> */}
          <h1>Task Assignment</h1>
          <p>Sign in to open your workspace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required
            />
          </div>

          {pageError ? (
            <div className="badge badge-red" style={{ width: "100%", justifyContent: "center" }}>
              {pageError}
            </div>
          ) : null}

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-footer">
          Need an account?{" "}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: 0, border: 0, background: "transparent", color: "var(--accent2)" }}
            onClick={() => navigate("/register")}
          >
            Register here
          </button>
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { register, loading, user, error, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [formError, setFormError] = useState("");

  const pageError = formError || error;

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (formError) setFormError("");
    if (error) clearError();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    try {
      const data = await register(form);
      navigate(`/${data.role}`, { replace: true });
    } catch (err) {
      setFormError(err.message || "Registration failed");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          {/* <div className="auth-logo-mark">⬡</div> */}
          <h1>Create Account</h1>
          <p>Register an admin account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full name</label>
            <input
              className="form-input"
              type="text"
              placeholder="Jane Smith"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@company.com"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Minimum 6 characters"
              minLength={6}
              value={form.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required
            />
          </div>

          <div className="form-group">
  <label className="form-label">Role</label>
  <select
    className="form-select"
    value="admin"
    disabled
  >
    <option value="admin">Admin</option>
  </select>
</div>

          {pageError ? (
            <div className="badge badge-red" style={{ width: "100%", justifyContent: "center" }}>
              {pageError}
            </div>
          ) : null}

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: "0.25rem" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{" "}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: 0, border: 0, background: "transparent", color: "var(--accent2)" }}
            onClick={() => navigate("/login")}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  const { user } = useAuth();

  const message = useMemo(() => {
    if (!user) return "Please sign in to continue.";
    if (user.role === "employee") return "You do not have access to that page.";
    return "This build is currently focused on the employee workspace.";
  }, [user]);

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">
          <div className="auth-logo-mark">!</div>
          <h1>Access limited</h1>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route element={<RoleLandingRedirect />}>
          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={["employee"]}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<EmployeeDashboard />} />
            <Route path="my-tasks" element={<EmployeeTasks />} />
          </Route>

          <Route
            path="/manager"
            element={
              <ProtectedRoute roles={["manager"]}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<ManagerDashboard />} />
            <Route path="my-tasks" element={<ManagerMyTasks />} />
            <Route path="my-team" element={<MyTeam />} />
            <Route path="task-board" element={<TaskBoard />} />
            <Route path="create-task" element={<CreateTask />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["admin"]}>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="projects" element={<Projects />} />
            <Route path="teams" element={<Teams />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
