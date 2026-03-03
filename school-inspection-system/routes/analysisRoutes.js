const express = require("express");
const router = express.Router();
const {
  getTrends,
  getRedFlags,
  getCorrelations,
  getPredictions,
  validatePredictions,
  getSuggestions,
  get2018Predictions,
  getInfrastructure
} = require("../controllers/analysisController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Get performance trends - Admin and Inspector
router.get("/trends", protect, getTrends);

// Get red-flagged students - Admin and Inspector
router.get("/red-flags", protect, getRedFlags);

// Get infrastructure correlations - Admin and Inspector
router.get("/correlations", protect, getCorrelations);

// Get predictions - Admin and Inspector
router.get("/predictions", protect, getPredictions);

// Validate predictions - Admin only
router.post("/predictions/validate", protect, requireAdmin, validatePredictions);

// Get suggestions - Admin and Inspector
router.get("/suggestions", protect, getSuggestions);

// Get 2018 predictions - Admin and Inspector
router.get("/predictions/2018", protect, get2018Predictions);

// Get infrastructure analysis - Admin and Inspector
router.get("/infrastructure", protect, getInfrastructure);

module.exports = router;
