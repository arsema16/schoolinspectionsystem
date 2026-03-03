const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    teacherName: String,
    improvementRate: Number
});

module.exports = mongoose.model("TeacherPerformance", schema);