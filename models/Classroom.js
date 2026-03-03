const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    name: String,
    capacity: Number,
    enrolledStudents: Number
});

module.exports = mongoose.model("Classroom", schema);