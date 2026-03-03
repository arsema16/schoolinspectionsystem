const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    year: Number,
    avgEntranceScore: Number,
    avgGraduationScore: Number
});

module.exports = mongoose.model("YearStatistics", schema);