const mongoose = require("mongoose");

const lessonPlanSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  topic: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  status: { type: String, enum: ['Approved', 'Needs Revision', 'Missing', 'In Review'], default: 'In Review' },
  feedback: { type: String }
});

const schema = new mongoose.Schema({
  teacherName: { type: String, required: true },
  subject: { type: String },
  gradeGroup: { type: String, enum: ['9-10', '11-12'] },
  performanceScore: { type: Number },        // e.g. 92
  teachingMethodology: { type: String },     // e.g. "Problem-Based"
  professionalDevelopment: { type: String }, // e.g. "Advanced Calculus Workshop"
  improvementRate: { type: Number, default: 0 },
  lessonPlans: [lessonPlanSchema]
}, { timestamps: true });

module.exports = mongoose.model("TeacherPerformance", schema);
