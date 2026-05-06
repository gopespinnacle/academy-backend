const mongoose = require("mongoose");

const classSummarySchema = new mongoose.Schema({

    className: String,

    date: String,

    periodTime: String,

    studentName: String,

    teacherName: String,

    teacherInTime: String,

    teacherOutTime: String,

    totalMinutes: Number,

    homework: String

}, {
    timestamps: true
});

module.exports = mongoose.model("ClassSummary", classSummarySchema);