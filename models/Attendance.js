const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    className: String,
    subject: String,
    day: String,
    startTime: String,
    endTime: String,

    date: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Attendance", attendanceSchema);