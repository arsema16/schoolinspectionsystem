const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    name: String,
    capacity: Number,
    registeredStudents: Number
});

module.exports = mongoose.model("Laboratory", schema);