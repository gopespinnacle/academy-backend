const mongoose = require("mongoose");


const studentAttendanceSchema =
    new mongoose.Schema(
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Student",
                required: true
            },

            studentId: {
                type: String,
                required: true
            },

            studentName: {
                type: String,
                required: true
            },

            attendance: {
                type: String,
                enum: [
                    "Present",
                    "Absent"
                ],
                required: true
            }
        },
        {
            _id: false
        }
    );


const dailyClassRegisterSchema =
    new mongoose.Schema(
        {

            /* =========================
               TEACHER
               ========================= */

            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },


            /* =========================
               PERIOD ASSIGNMENT
               ========================= */

            periodAssignment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "PeriodAssignment",
                required: true
            },


            /* =========================
               CLASS DATE
               ========================= */

            date: {
                type: Date,
                required: true
            },


            /* =========================
               CLASS INFORMATION
               ========================= */

            className: {
                type: String,
                required: true,
                trim: true
            },

            subject: {
                type: String,
                required: true,
                trim: true
            },


            /* =========================
               SCHEDULED TIME
               ========================= */

            scheduledStartTime: {
                type: String,
                required: true
            },

            scheduledEndTime: {
                type: String,
                required: true
            },


            /* =========================
               ACTUAL CLASS TIME
               ========================= */

            actualStartTime: {
                type: String,
                default: ""
            },

            actualEndTime: {
                type: String,
                default: ""
            },


            /* =========================
               TEACHER ATTENDANCE
               ========================= */

            teacherStatus: {
                type: String,
                enum: [
                    "Present",
                    "Absent"
                ],
                required: true
            },


            /* =========================
               TOPIC
               ========================= */

            topicCovered: {
                type: String,
                default: "",
                trim: true
            },


            /* =========================
               STUDENTS
               ========================= */

            students: {
                type: [
                    studentAttendanceSchema
                ],
                default: []
            }

        },

        {
            timestamps: true
        }
    );


/* =================================================
   ONE REGISTER PER TEACHER + PERIOD + DATE
   ================================================= */

dailyClassRegisterSchema.index(
    {
        teacher: 1,
        periodAssignment: 1,
        date: 1
    },
    {
        unique: true
    }
);


module.exports =
    mongoose.model(
        "DailyClassRegister",
        dailyClassRegisterSchema
    );