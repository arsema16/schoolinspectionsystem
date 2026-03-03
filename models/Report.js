const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  // Report Identification
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  downloadToken: {
    type: String,
    required: true,
    unique: true
  },
  
  // Report Configuration
  reportType: {
    type: String,
    enum: ['performance_summary', 'red_flags', 'infrastructure_correlation', 'predictions'],
    default: 'performance_summary'
  },
  filters: {
    years: [Number],
    gradeLevel: Number,
    gender: String,
    subjects: [String]
  },
  
  // File Information
  fileName: String,
  fileSize: Number,
  filePath: String,
  
  // Access Control
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  
  // Status
  status: {
    type: String,
    enum: ['generating', 'ready', 'expired', 'error'],
    default: 'generating'
  }
});

// TTL index to auto-delete expired reports
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Report", reportSchema);
