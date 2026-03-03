const express = require("express");
const router = express.Router();
const {
  generateReport,
  getReportStatus,
  downloadReport,
  getReportHistory
} = require("../controllers/reportController");
const { protect } = require("../middleware/authMiddleware");

// Generate report - Admin and Inspector
router.post("/generate", protect, generateReport);

// Get report status - Admin and Inspector
router.get("/:reportId/status", protect, getReportStatus);

// Download report - Public with valid token
router.get("/download/:token", downloadReport);

// Get report history - Admin and Inspector
router.get("/history", protect, getReportHistory);

module.exports = router;
