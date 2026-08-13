const mongoose = require("mongoose");

const TeacherLeaveSchema = new mongoose.Schema(
    {

        /* ================= TEACHER ================= */

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        teacherName: {
            type: String,
            required: true
        },


        /* ================= PERIOD ================= */

        periodAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PeriodAssignment",
            required: true
        },

        className: {
            type: String,
            required: true
        },

        subject: {
            type: String,
            default: ""
        },

        date: {
            type: String,
            required: true
        },

        day: {
            type: String,
            required: true
        },

        startTime: {
            type: String,
            required: true
        },

        endTime: {
            type: String,
            required: true
        },


        /* ================= LEAVE ================= */

        leaveCategory: {
            type: String,
            required: true
        },

        leaveSubcategory: {
            type: String,
            required: true
        },

        explanation: {
            type: String,
            default: ""
        },


        /* ================= COMPENSATION ================= */

        compensationDate: {
            type: String,
            default: ""
        },

        compensationStartTime: {
            type: String,
            default: ""
        },

        compensationEndTime: {
            type: String,
            default: ""
        },


        /* ================= APPROVAL ================= */

        status: {
            type: String,
            enum: [
                "Pending",
                "Approved",
                "Rejected",
                "Cancelled"
            ],
            default: "Pending"
        },

        founderComment: {
            type: String,
            default: ""
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        approvedAt: {
            type: Date,
            default: null
        },

        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        rejectedAt: {
            type: Date,
            default: null
        }

    },

    {
        timestamps: true
    }
);


/* ================= INDEXES ================= */

/*
Prevent duplicate leave requests
for the same teacher and period/date.
*/

TeacherLeaveSchema.index(
    {
        teacher: 1,
        periodAssignment: 1,
        date: 1
    }
);


/* ================= EXPORT ================= */

module.exports =
mongoose.model(
    "TeacherLeave",
    TeacherLeaveSchema
);