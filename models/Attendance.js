const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
    studentId: String,
    className: String,
    subject: String,
    day: String,
    startTime: String,
    endTime: String,

    date: { type: Date, default: Date.now },

    // ✅ NEW FIELDS (ADD THIS)
    joinedAt: {
        type: Date,
        default: Date.now
    },

    exitAt: Date,

    status: {
        type: String,
        default: "ongoing"
    }

});

module.exports = mongoose.model("Attendance", attendanceSchema);