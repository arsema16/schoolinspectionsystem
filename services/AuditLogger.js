class AuditLogger {
  /**
   * Logs data modification event
   * @param {Object} event - Audit event details
   * @param {string} event.action - CREATE, UPDATE, DELETE
   * @param {string} event.entityType - Student, Infrastructure, etc.
   * @param {string} event.entityId - ID of modified entity
   * @param {string} event.userId - User who made change
   * @param {Object} event.changes - Before/after values
   * @param {string} event.ipAddress - IP address of request
   * @param {string} event.userAgent - User agent string
   */
  async logEvent(event) {
    const AuditLog = require('../models/AuditLog');
    const User = require('../models/User');
    
    try {
      // Get user details if userId provided
      let username, userRole;
      if (event.userId) {
        const user = await User.findById(event.userId);
        if (user) {
          username = user.username;
          userRole = user.role;
        }
      }
      
      // Create audit log entry
      await AuditLog.create({
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        userId: event.userId,
        username: username || event.username,
        userRole: userRole || event.userRole,
        changes: event.changes || {},
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Failed to log audit event:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }
  
  /**
   * Retrieves audit logs with filters
   * @param {Object} filters - Search criteria
   * @param {Date} filters.startDate - Start date
   * @param {Date} filters.endDate - End date
   * @param {string} filters.userId - Filter by user
   * @param {string} filters.action - Filter by action type
   * @param {string} filters.entityType - Filter by entity type
   * @param {number} filters.page - Page number (default 1)
   * @param {number} filters.limit - Results per page (default 50)
   * @returns {Array} Matching audit log entries
   */
  async getLogs(filters = {}) {
    const AuditLog = require('../models/AuditLog');
    
    const query = {};
    
    // Apply filters
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }
    
    if (filters.userId) {
      query.userId = filters.userId;
    }
    
    if (filters.action) {
      query.action = filters.action;
    }
    
    if (filters.entityType) {
      query.entityType = filters.entityType;
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;
    
    // Execute query
    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username role');
    
    const total = await AuditLog.countDocuments(query);
    
    return {
      logs,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
  
  /**
   * Middleware to automatically log modifications
   * @returns {Function} Express middleware
   */
  createMiddleware() {
    return (req, res, next) => {
      // Store original methods
      const originalJson = res.json;
      const originalSend = res.send;
      
      // Capture request body as "before" state for updates
      req.auditBefore = req.body;
      
      // Override response methods to capture "after" state
      res.json = function(data) {
        req.auditAfter = data;
        return originalJson.call(this, data);
      };
      
      res.send = function(data) {
        req.auditAfter = data;
        return originalSend.call(this, data);
      };
      
      next();
    };
  }
}

module.exports = new AuditLogger();
