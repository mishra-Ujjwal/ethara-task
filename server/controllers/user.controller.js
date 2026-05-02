const User = require("../models/User");
const Team = require("../models/Team");

// @desc   Admin: create manager or employee
// @route  POST /api/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, managerId } = req.body;

    if (!["manager", "employee"].includes(role)) {
      return res.status(400).json({ message: "Role must be manager or employee" });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already in use" });

    const userData = { name, email, password, role };

    if (role === "employee") {
      if (!managerId) {
        return res.status(400).json({ message: "managerId is required for employees" });
      }
      const manager = await User.findById(managerId);
      if (!manager || manager.role !== "manager") {
        return res.status(400).json({ message: "Invalid manager" });
      }
      userData.managerId = managerId;
    }

    const user = await User.create(userData);

    // If employee, add to manager's Team doc
    if (role === "employee") {
      await Team.findOneAndUpdate(
        { manager: managerId },
        { $addToSet: { employees: user._id } },
        { upsert: true, new: true }
      );
    }

    // If manager, create an empty Team doc
    if (role === "manager") {
      await Team.create({ manager: user._id, employees: [] });
    }

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      managerId: user.managerId,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: get all users (with optional role filter)
// @route  GET /api/users?role=manager
const getAllUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const users = await User.find(filter).populate("managerId", "name email");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: get single user
// @route  GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate("managerId", "name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: update user (reassign manager, toggle active, etc.)
// @route  PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, isActive, managerId } = req.body;

    if (name) user.name = name;
    if (email) user.email = email;
    if (isActive !== undefined) user.isActive = isActive;

    // Reassign employee to a different manager
    if (managerId && user.role === "employee") {
      const oldManagerId = user.managerId?.toString();

      if (oldManagerId) {
        await Team.findOneAndUpdate(
          { manager: oldManagerId },
          { $pull: { employees: user._id } }
        );
      }

      await Team.findOneAndUpdate(
        { manager: managerId },
        { $addToSet: { employees: user._id } },
        { upsert: true }
      );

      user.managerId = managerId;
    }

    const updated = await user.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc   Admin: delete user
// @route  DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "employee" && user.managerId) {
      await Team.findOneAndUpdate(
        { manager: user.managerId },
        { $pull: { employees: user._id } }
      );
    }
    if (user.role === "manager") {
      await Team.findOneAndDelete({ manager: user._id });
    }

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUser, getAllUsers, getUserById, updateUser, deleteUser };