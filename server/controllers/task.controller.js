const Task = require("../models/Task");
const Team = require("../models/Team");

const toSafeMinutes = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
};

const stopRunningTimer = (task) => {
  if (!task.timerStartedAt) return;

  const elapsedMs = Date.now() - new Date(task.timerStartedAt).getTime();
  const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60000));

  task.trackedMinutes = (task.trackedMinutes || 0) + elapsedMinutes;
  task.timerStartedAt = null;
  task.timerStartedBy = null;
};

const requireCompletionNote = (task, body) => {
  const nextStatus = body.status;
  if (nextStatus !== "completed") return;

  const note = typeof body.completionNote === "string" ? body.completionNote.trim() : task.completionNote?.trim();
  if (!note) {
    const error = new Error("Add what you completed before marking this task as completed");
    error.statusCode = 400;
    throw error;
  }
};

// @desc   Manager: create & assign task to an employee
// @route  POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, deadline, estimatedMinutes } = req.body;

    const isSelfAssigned = String(assignedTo) === String(req.user._id);

    if (!isSelfAssigned) {
      const team = await Team.findOne({ manager: req.user._id });
      if (!team || !team.employees.map(String).includes(String(assignedTo))) {
        return res.status(403).json({ message: "Employee is not in your team" });
      }
    }

    const task = await Task.create({
      title,
      description,
      project,
      assignedBy: req.user._id,
      assignedTo,
      priority,
      estimatedMinutes: toSafeMinutes(estimatedMinutes),
      deadline,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get tasks — Admin: all | Manager: tasks they created | Employee: tasks assigned to them
// @route  GET /api/tasks
const getTasks = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === "manager") filter.assignedBy = req.user._id;
    if (req.user.role === "employee") filter.assignedTo = req.user._id;

    if (req.query.status) filter.status = req.query.status;
    if (req.query.priority) filter.priority = req.query.priority;
    if (req.query.project) filter.project = req.query.project;

    const tasks = await Task.find(filter)
      .populate("project", "name status")
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("timerStartedBy", "name email");

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single task
// @route  GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name status")
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("timerStartedBy", "name email");

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Update task — Manager: full update | Employee: status only | Admin: anything
// @route  PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const { timerAction } = req.body;

    if (timerAction) {
      const canControlTimer =
        req.user.role === "admin" || String(task.assignedTo) === String(req.user._id);

      if (!canControlTimer) {
        return res.status(403).json({ message: "Only the assignee can control this timer" });
      }

      if (timerAction === "start") {
        if (task.status === "completed") {
          return res.status(400).json({ message: "Completed tasks cannot restart the timer" });
        }
        if (!task.timerStartedAt) {
          task.timerStartedAt = new Date();
          task.timerStartedBy = req.user._id;
          if (task.status === "todo") task.status = "in-progress";
        }
      } else if (timerAction === "stop") {
        stopRunningTimer(task);
      } else {
        return res.status(400).json({ message: "Invalid timer action" });
      }

      const updatedTimerTask = await task.save();
      const populated = await Task.findById(updatedTimerTask._id)
        .populate("project", "name status")
        .populate("assignedBy", "name email")
        .populate("assignedTo", "name email")
        .populate("timerStartedBy", "name email");

      return res.json(populated);
    }

    if (task.status === "completed" && req.body.status && req.body.status !== "completed" && req.user.role !== "admin") {
      return res.status(400).json({ message: "Completed tasks cannot move back to another status" });
    }

    if (req.user.role === "employee") {
      if (String(task.assignedTo) !== String(req.user._id)) {
        return res.status(403).json({ message: "Not your task" });
      }
      requireCompletionNote(task, req.body);
      task.status = req.body.status || task.status;
      if (req.body.completionNote !== undefined) task.completionNote = String(req.body.completionNote || "").trim();
      if (task.status === "completed") stopRunningTimer(task);
    } else if (req.user.role === "manager") {
      if (String(task.assignedBy) !== String(req.user._id)) {
        return res.status(403).json({ message: "Not your task" });
      }
      requireCompletionNote(task, req.body);
      const { title, description, assignedTo, status, priority, deadline, estimatedMinutes } = req.body;
      if (title) task.title = title;
      if (description) task.description = description;
      if (assignedTo) {
        const isSelfAssigned = String(assignedTo) === String(req.user._id);
        if (!isSelfAssigned) {
          const team = await Team.findOne({ manager: req.user._id });
          if (!team || !team.employees.map(String).includes(String(assignedTo))) {
            return res.status(403).json({ message: "Employee is not in your team" });
          }
        }
        task.assignedTo = assignedTo;
      }
      if (status) task.status = status;
      if (req.body.completionNote !== undefined) task.completionNote = String(req.body.completionNote || "").trim();
      if (task.status === "completed") stopRunningTimer(task);
      if (priority) task.priority = priority;
      if (deadline) task.deadline = deadline;
      if (estimatedMinutes !== undefined) task.estimatedMinutes = toSafeMinutes(estimatedMinutes);
    } else {
      requireCompletionNote(task, req.body);
      if (req.body.estimatedMinutes !== undefined) {
        req.body.estimatedMinutes = toSafeMinutes(req.body.estimatedMinutes);
      }
      if (req.body.completionNote !== undefined) {
        req.body.completionNote = String(req.body.completionNote || "").trim();
      }
      Object.assign(task, req.body);
      if (task.status === "completed") stopRunningTimer(task);
    }

    const updated = await task.save();
    const populated = await Task.findById(updated._id)
      .populate("project", "name status")
      .populate("assignedBy", "name email")
      .populate("assignedTo", "name email")
      .populate("timerStartedBy", "name email");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Manager/Admin: delete task
// @route  DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role === "manager" && String(task.assignedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to delete this task" });
    }

    await task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Dashboard stats
// @route  GET /api/tasks/stats
const getTaskStats = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "manager") filter.assignedBy = req.user._id;
    if (req.user.role === "employee") filter.assignedTo = req.user._id;

    const now = new Date();

    const [total, todo, inProgress, review, completed, overdue, timeSummary] = await Promise.all([
      Task.countDocuments(filter),
      Task.countDocuments({ ...filter, status: "todo" }),
      Task.countDocuments({ ...filter, status: "in-progress" }),
      Task.countDocuments({ ...filter, status: "review" }),
      Task.countDocuments({ ...filter, status: "completed" }),
      Task.countDocuments({ ...filter, deadline: { $lt: now }, status: { $ne: "completed" } }),
      Task.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            estimatedMinutes: { $sum: "$estimatedMinutes" },
            trackedMinutes: { $sum: "$trackedMinutes" },
            runningTimers: {
              $sum: {
                $cond: [{ $ifNull: ["$timerStartedAt", false] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const totals = timeSummary[0] || { estimatedMinutes: 0, trackedMinutes: 0, runningTimers: 0 };

    res.json({
      total,
      todo,
      inProgress,
      review,
      completed,
      overdue,
      estimatedMinutes: totals.estimatedMinutes,
      trackedMinutes: totals.trackedMinutes,
      runningTimers: totals.runningTimers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createTask, getTasks, getTaskById, updateTask, deleteTask, getTaskStats };
