const AuditLog = require("../models/AuditLog");

/**
 * GET /api/audit/logs
 * Get audit logs with filtering
 * Admin only
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      userId, 
      action, 
      entityType, 
      page = 1, 
      limit = 50 
    } = req.query;

    // Build query
    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = action;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('userId', 'username role');

    const total = await AuditLog.countDocuments(query);

    res.json({
      logs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve audit logs", 
      error: error.message 
    });
  }
};

/**
 * GET /api/audit/logs/export
 * Export audit logs as CSV
 * Admin only
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const { startDate, endDate, userId, action, entityType } = req.query;

    // Build query (same as getAuditLogs)
    const query = {};

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (userId) {
      query.userId = userId;
    }

    if (action) {
      query.action = action;
    }

    if (entityType) {
      query.entityType = entityType;
    }

    // Fetch all matching logs (no pagination for export)
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .populate('userId', 'username role')
      .limit(10000); // Safety limit

    // Convert to CSV
    const csvHeader = 'Timestamp,Action,Entity Type,Entity ID,User,Role,IP Address\n';
    
    const csvRows = logs.map(log => {
      const timestamp = log.timestamp.toISOString();
      const action = log.action;
      const entityType = log.entityType;
      const entityId = log.entityId;
      const username = log.username || (log.userId ? log.userId.username : 'Unknown');
      const role = log.userRole || (log.userId ? log.userId.role : 'Unknown');
      const ipAddress = log.ipAddress || 'N/A';

      return `"${timestamp}","${action}","${entityType}","${entityId}","${username}","${role}","${ipAddress}"`;
    }).join('\n');

    const csv = csvHeader + csvRows;

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${Date.now()}.csv"`);
    
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ 
      message: "Failed to export audit logs", 
      error: error.message 
    });
  }
};

/**
 * GET /api/audit/stats
 * Get audit statistics
 * Admin only
 */
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    // Get statistics
    const totalLogs = await AuditLog.countDocuments(dateFilter);

    const actionStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const entityStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$entityType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const userStats = await AuditLog.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$username', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      totalLogs,
      actionStats,
      entityStats,
      topUsers: userStats
    });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ 
      message: "Failed to retrieve audit statistics", 
      error: error.message 
    });
  }
};
