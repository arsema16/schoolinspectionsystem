const express = require("express");
const router = express.Router();
const {
  importStudents,
  getStudents,
  getStudentHistory,
  updateStudent,
  deleteStudent
} = require("../controllers/studentController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Import students - Admin only
router.post("/import", protect, requireAdmin, importStudents);

// Get students with filtering - Admin and Inspector
router.get("/", protect, getStudents);

// Get student history - Admin and Inspector
router.get("/:studentId/history", protect, getStudentHistory);

// Update student - Admin only
router.put("/:id", protect, requireAdmin, updateStudent);

// Delete student - Admin only
router.delete("/:id", protect, requireAdmin, deleteStudent);

module.exports = router;
