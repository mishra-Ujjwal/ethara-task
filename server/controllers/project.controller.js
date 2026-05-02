const Project = require("../models/Project");

// @desc   Admin: create project
// @route  POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, assignedManagers, deadline } = req.body;

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      assignedManagers: assignedManagers || [],
      deadline,
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get all projects (Admin: all | Manager: assigned to them)
// @route  GET /api/projects
const getProjects = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "manager") {
      filter = { assignedManagers: req.user._id };
    }

    const projects = await Project.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedManagers", "name email");

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Get single project
// @route  GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedManagers", "name email");

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: update project
// @route  PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: delete project
// @route  DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json({ message: "Project deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject };