const mongoose = require("mongoose");

const infrastructureSchema = new mongoose.Schema({
  // Facility Information
  facilityId: {
    type: String,
    required: true,
    unique: true
  },
  facilityType: {
    type: String,
    enum: ['classroom', 'laboratory', 'library'],
    required: true
  },
  facilityName: {
    type: String,
    required: true
  },
  
  // Condition Tracking
  conditionHistory: [{
    year: {
      type: Number,
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    assessmentDate: {
      type: Date,
      required: true
    },
    notes: String,
    assessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Improvement Tracking
  improvements: [{
    improvementId: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    improvementType: {
      type: String,
      enum: ['renovation', 'equipment_upgrade', 'new_construction', 'maintenance'],
      required: true
    },
    completionDate: {
      type: Date,
      required: true,
      validate: {
        validator: function(v) {
          return v <= new Date();
        },
        message: 'Completion date cannot be in the future'
      }
    },
    cost: Number,
    beforeRating: Number,
    afterRating: Number,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // Association with Students
  affectedGrades: [Number],
  capacity: Number,
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Index for efficient facility type queries
infrastructureSchema.index({ facilityType: 1 });
infrastructureSchema.index({ 'improvements.completionDate': 1 });

module.exports = mongoose.model("Infrastructure", infrastructureSchema);