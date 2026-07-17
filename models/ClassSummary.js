const mongoose = require("mongoose");

const classSummarySchema = new mongoose.Schema({

    sessionId: String,

    className: String,

    date: String,

    day: String,

    periodStart: String,

    periodEnd: String,

    subject: String,

    teacherId: String,

    teacherName: String,

    students: [
        {
            studentId: String,
            studentName: String
        }
    ],

    teacherInTime: String,

    teacherOutTime: String,

    totalMinutes: Number,

    homework: String,

    classSummary: String,

    homeworkStatus: {
        type: String,
        default: "Pending"
    },

    questionDocs: [
    {
        fileName: String,

        s3Key: String,

        s3Url: String
    }
],

reviewedDocs: [

{

studentId: String,

studentName: String,

files: [

{

fileName: String,

s3Key: String,

s3Url: String,

uploadedAt: {

type: Date,

default: Date.now

}

}

]

}

],

    status: {
        type: String,
        default: "Completed"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "ClassSummary",
    classSummarySchema
);