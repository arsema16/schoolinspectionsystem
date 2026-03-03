const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema({
  // Prediction Metadata
  predictionId: {
    type: String,
    required: true,
    unique: true
  },
  targetYear: {
    type: Number,
    required: true
  },
  subject: {
    type: String,
    enum: ['math', 'english', 'science', 'it', 'overall'],
    required: true
  },
  
  // Prediction Data
  predictedValue: {
    type: Number,
    required: true
  },
  confidenceInterval: {
    lower: Number,
    upper: Number
  },
  
  // Model Parameters
  modelType: {
    type: String,
    default: 'linear_regression'
  },
  regressionParams: {
    slope: Number,
    intercept: Number,
    r2: Number
  },
  historicalData: [{
    year: Number,
    value: Number
  }],
  
  // Validation
  actualValue: Number,
  errorPercentage: Number,
  validatedAt: Date,
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

predictionSchema.index({ targetYear: 1, subject: 1 });

module.exports = mongoose.model("Prediction", predictionSchema);
