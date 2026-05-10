const mongoose = require("mongoose");

const CompensationSchema = new mongoose.Schema({
    teacher: String,
    className: String,
    subject: String,
    date: Date,
    totalMinutes: Number,
    usedMinutes: {
        type: Number,
        default: 0
    },
    studentNames: [String]   // ✅ comma added above
});

module.exports = mongoose.model("CompensationClass", CompensationSchema);