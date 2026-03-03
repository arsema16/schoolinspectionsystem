const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  // Identification
  studentId: { 
    type: String, 
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  year: { 
    type: Number, 
    required: true,
    enum: [2015, 2016, 2017, 2018],
    index: true
  },
  
  // Academic Performance - Semester 1
  semester1: {
    amharic: { type: Number, min: 0, max: 100 },
    english: { type: Number, min: 0, max: 100 },
    maths: { type: Number, min: 0, max: 100 },
    physics: { type: Number, min: 0, max: 100 },
    chemistry: { type: Number, min: 0, max: 100 },
    biology: { type: Number, min: 0, max: 100 },
    geography: { type: Number, min: 0, max: 100 },
    history: { type: Number, min: 0, max: 100 },
    civics: { type: Number, min: 0, max: 100 },
    ict: { type: Number, min: 0, max: 100 },
    hpe: { type: Number, min: 0, max: 100 },
    average: { type: Number, min: 0, max: 100 }
  },
  
  // Academic Performance - Semester 2
  semester2: {
    amharic: { type: Number, min: 0, max: 100 },
    english: { type: Number, min: 0, max: 100 },
    maths: { type: Number, min: 0, max: 100 },
    physics: { type: Number, min: 0, max: 100 },
    chemistry: { type: Number, min: 0, max: 100 },
    biology: { type: Number, min: 0, max: 100 },
    geography: { type: Number, min: 0, max: 100 },
    history: { type: Number, min: 0, max: 100 },
    civics: { type: Number, min: 0, max: 100 },
    ict: { type: Number, min: 0, max: 100 },
    hpe: { type: Number, min: 0, max: 100 },
    average: { type: Number, min: 0, max: 100 }
  },
  
  // Yearly average
  yearlyAverage: { type: Number, min: 0, max: 100 },
  
  // Demographics
  age: { 
    type: Number,
    min: 5,
    max: 25,
    required: true
  },
  ageGroup: {
    type: String,
    enum: ['Primary', 'Middle', 'Secondary', 'Adult']
  },
  gender: { 
    type: String, 
    enum: ['Male', 'Female'],
    required: true
  },
  gradeLevel: {
    type: Number,
    min: 1,
    max: 12,
    required: true
  },
  
  // Legacy fields for backward compatibility
  semester: {
    type: Number,
    enum: [1, 2, null],
    default: null
  },
  
  subjects: {
    amharic: { type: Number, min: 0, max: 100 },
    english: { type: Number, min: 0, max: 100 },
    maths: { type: Number, min: 0, max: 100 },
    physics: { type: Number, min: 0, max: 100 },
    chemistry: { type: Number, min: 0, max: 100 },
    biology: { type: Number, min: 0, max: 100 },
    geography: { type: Number, min: 0, max: 100 },
    history: { type: Number, min: 0, max: 100 },
    civics: { type: Number, min: 0, max: 100 },
    ict: { type: Number, min: 0, max: 100 },
    hpe: { type: Number, min: 0, max: 100 }
  },
  
  average: { type: Number, min: 0, max: 100 },
  rank: Number,
  
  // Red Flag Tracking
  redFlags: [{
    year: Number,
    comparedToYear: Number,
    subjects: [String],
    overallDecline: Number,
    detectedAt: { type: Date, default: Date.now }
  }],
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Compound index for efficient year-based queries
studentSchema.index({ studentId: 1, year: 1 }, { unique: true });
studentSchema.index({ year: 1, gradeLevel: 1 }); // For filtering by year and grade
studentSchema.index({ year: 1, gender: 1 }); // For filtering by year and gender
studentSchema.index({ year: 1, gradeLevel: 1, gender: 1 }); // Combined filters
studentSchema.index({ yearlyAverage: 1 }); // For red flag detection

// Pre-save middleware to calculate averages and age group
studentSchema.pre('save', async function() {
  // Age group
  if (this.age >= 5 && this.age <= 10) {
    this.ageGroup = 'Primary';
  } else if (this.age >= 11 && this.age <= 14) {
    this.ageGroup = 'Middle';
  } else if (this.age >= 15 && this.age <= 18) {
    this.ageGroup = 'Secondary';
  } else if (this.age >= 19) {
    this.ageGroup = 'Adult';
  }
});

module.exports = mongoose.model("Student", studentSchema);