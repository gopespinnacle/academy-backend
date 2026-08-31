const mongoose = require("mongoose");

const lessonPlanSchema = new mongoose.Schema({

    teacherId: {
        type: String,
        default: ""
    },

    teacherName: {
        type: String,
        default: ""
    },

    className: {
        type: String,
        default: ""
    },

    subject: {
        type: String,
        default: ""
    },

    date: {
        type: String,
        default: ""
    },

    // ==============================
    // PERIOD INFORMATION
    // ==============================

    periodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeacherSchedule",
        default: null
    },

    day: {
        type: String,
        default: ""
    },

    startTime: {
        type: String,
        default: ""
    },

    endTime: {
        type: String,
        default: ""
    },

    lessons: [lessonSchema]

},{
    timestamps:true
});

module.exports = mongoose.model(
    "LessonPlan",
    lessonPlanSchema
);