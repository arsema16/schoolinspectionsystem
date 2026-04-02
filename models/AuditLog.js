const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  // Event Information
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['Student', 'Infrastructure', 'User', 'Report'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  
  // User Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: String,
  userRole: String,
  
  // Change Details
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Context
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Compound index for efficient filtering
auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

// TTL index to auto-delete logs older than 3 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 94608000 }); // 3 years

module.exports = mongoose.model("AuditLog", auditLogSchema);
