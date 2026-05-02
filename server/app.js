const express = require("express");
const cors = require("cors");

const authRoutes    = require("./routes/auth.routes");
const userRoutes    = require("./routes/user.routes");
const projectRoutes = require("./routes/project.routes");
const teamRoutes    = require("./routes/team.routes");
const taskRoutes    = require("./routes/task.routes");

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/auth",     authRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams",    teamRoutes);
app.use("/api/tasks",    taskRoutes);

// Health check
app.get("/", (req, res) => res.json({ message: "API is running" }));

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server Error" });
});

module.exports = app;