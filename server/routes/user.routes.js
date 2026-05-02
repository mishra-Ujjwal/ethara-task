const express = require("express");
const router = express.Router();
const {
  createUser, getAllUsers, getUserById, updateUser, deleteUser,
} = require("../controllers/user.controller");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

router.use(protect, authorizeRoles("admin"));

router.route("/").get(getAllUsers).post(createUser);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;