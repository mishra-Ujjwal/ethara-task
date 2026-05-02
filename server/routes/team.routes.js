const express = require("express");
const router = express.Router();
const { getMyTeam, getAllTeams } = require("../controllers/team.controller");
const { protect } = require("../middleware/auth");
const { authorizeRoles } = require("../middleware/rbac");

router.use(protect);

router.get("/", authorizeRoles("admin"), getAllTeams);
router.get("/my-team", authorizeRoles("manager"), getMyTeam);

module.exports = router;