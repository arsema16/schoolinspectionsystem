const express = require("express");
const router = express.Router();
const {
  getAuditLogs,
  exportAuditLogs,
  getAuditStats
} = require("../controllers/auditController");
const { protect, requireAdmin } = require("../middleware/authMiddleware");

// Get audit logs with filtering - Admin only
router.get("/logs", protect, requireAdmin, getAuditLogs);

// Export audit logs as CSV - Admin only
router.get("/logs/export", protect, requireAdmin, exportAuditLogs);

// Get audit statistics - Admin only
router.get("/stats", protect, requireAdmin, getAuditStats);

module.exports = router;
