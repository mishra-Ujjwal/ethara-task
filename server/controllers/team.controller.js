const Team = require("../models/Team");

// @desc   Manager: get their team (employees under them)
// @route  GET /api/teams/my-team
const getMyTeam = async (req, res) => {
  try {
    const team = await Team.findOne({ manager: req.user._id }).populate(
      "employees",
      "name email isActive"
    );

    if (!team) return res.status(404).json({ message: "No team found" });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: get all teams
// @route  GET /api/teams
const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("manager", "name email")
      .populate("employees", "name email isActive");
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getMyTeam, getAllTeams };