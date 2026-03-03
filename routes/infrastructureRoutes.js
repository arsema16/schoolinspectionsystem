const express = require("express");
const router = express.Router();
const {
  createFacility,
  addAssessment,
  addImprovement,
  getFacilities,
  getFacilityHistory,
  updateFacility,
  deleteFacility
} = require("../controllers/infrastructureController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Create facility - Admin and Inspector
router.post("/", protect, createFacility);

// Add condition assessment - Admin and Inspector
router.post("/:facilityId/assessment", protect, addAssessment);

// Add improvement - Admin only
router.post("/:facilityId/improvement", protect, requireAdmin, addImprovement);

// Get all facilities with filtering - Admin and Inspector
router.get("/", protect, getFacilities);

// Get facility history - Admin and Inspector
router.get("/:facilityId/history", protect, getFacilityHistory);

// Update facility - Admin only
router.put("/:facilityId", protect, requireAdmin, updateFacility);

// Delete facility - Admin only
router.delete("/:facilityId", protect, requireAdmin, deleteFacility);

module.exports = router;
