const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getCurrentUser,
  updatePassword
} = require("../controllers/userController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Current user routes (any authenticated user)
router.get("/me", protect, getCurrentUser);
router.put("/me/password", protect, updatePassword);

// Admin-only user management routes
router.get("/", protect, requireAdmin, getAllUsers);
router.get("/:id", protect, requireAdmin, getUserById);
router.post("/", protect, requireAdmin, createUser);
router.put("/:id", protect, requireAdmin, updateUser);
router.delete("/:id", protect, requireAdmin, deleteUser);

module.exports = router;
