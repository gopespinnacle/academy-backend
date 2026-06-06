const mongoose = require("mongoose");

const classSummarySchema = new mongoose.Schema({

    className: String,

    date: String,

    periodTime: String,

    subject: String,

    studentName: String,

    teacherName: String,

    teacherId: String,

    homeworkUniqueId: String,

    homeworkStatus:{
    type:String,
    default:"Pending"
    
    },

    teacherInTime: String,

    teacherOutTime: String,

    totalMinutes: Number,

    homework: String

}, {
    timestamps: true
});

module.exports = mongoose.model("ClassSummary", classSummarySchema);