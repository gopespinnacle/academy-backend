const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema({

    topic: {
        type: String,
        default: ""
    },

    topicId: {
        type: String,
        default: ""
    },

    topicSummary: {
        type: String,
        default: ""
    },

    homework: {
        type: String,
        default: ""
    },

    classMaterials: [
        {
            fileName: String,
            s3Key: String,
            s3Url: String
        }
    ],

    homeworkDocuments: [
        {
            fileName: String,
            s3Key: String,
            s3Url: String
        }
    ],

    videoLinks: [
        String
    ]

});


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

}, {
    timestamps: true
});


module.exports = mongoose.model(
    "LessonPlan",
    lessonPlanSchema
);