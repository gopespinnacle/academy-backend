const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({

    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    /* 🔥 ADD THIS (VERY IMPORTANT) */
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session"
    },

    className: {
        type: String,
        required: true
    },

    subject: String,

    date: {
        type: Date,
        default: Date.now
    },

    /* 🔥 UPGRADE STATUS */
    status: {
        type: String,
        enum: ["Present", "Late", "Absent"],
        required: true
    },

    /* 🔥 ADD THESE */
    joinTime: Date,
    leaveTime: Date

}, { timestamps: true });
attendanceSchema.index(
  { studentId: 1, sessionId: 1 },
  { unique: true }
);
module.exports = mongoose.model("Attendance", attendanceSchema);