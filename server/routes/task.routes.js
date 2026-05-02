const express = require("express");
const router = express.Router();
const {
  createTask, getTasks, getTaskById, updateTask, deleteTask, getTaskStats,
} = require("../controllers/task.controller");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

router.use(protect);

router.get("/stats", authorizeRoles("admin", "manager", "employee"), getTaskStats);

router.route("/")
  .get(authorizeRoles("admin", "manager", "employee"), getTasks)
  .post(authorizeRoles("manager"), createTask);

router.route("/:id")
  .get(authorizeRoles("admin", "manager", "employee"), getTaskById)
  .put(authorizeRoles("admin", "manager", "employee"), updateTask)
  .delete(authorizeRoles("admin", "manager"), deleteTask);

module.exports = router;