const mongoose = require("mongoose");

const classSessionSchema = new mongoose.Schema({

    teacherId: String,

    teacherName: String,

    className: String,

    subject: String,

    day: String,

    date: String,

    periodStart: String,

    periodEnd: String,

    room: String,

    students: [
        {
            studentId: String,
            studentName: String
        }
    ],

    meetingIn: Date,

    meetingOut: Date,

    status: {
        type: String,
        default: "Live"
    }

},{
    timestamps:true
});

module.exports =
mongoose.model(
    "ClassSession",
    classSessionSchema
);