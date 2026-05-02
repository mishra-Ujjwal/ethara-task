const express = require("express");
const router = express.Router();
const {
  createProject, getProjects, getProjectById, updateProject, deleteProject,
} = require("../controllers/project.controller");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

router.use(protect);

router.route("/")
  .get(authorizeRoles("admin", "manager"), getProjects)
  .post(authorizeRoles("admin"), createProject);

router.route("/:id")
  .get(authorizeRoles("admin", "manager"), getProjectById)
  .put(authorizeRoles("admin"), updateProject)
  .delete(authorizeRoles("admin"), deleteProject);

module.exports = router;