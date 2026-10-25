const mongoose = require("mongoose");

const studentPeriodAssignmentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subjects: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    eca: { type: [String], default: [] }
}, { _id: false });

const teacherScheduleSchema = new mongoose.Schema({
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assistantTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    day: { type: String, required: true },
    className: { type: String, required: true },
    subject: { type: [String], default: [] },
    eca: { type: [String], default: [] },
    language: { type: [String], default: [] },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    assignments: { type: [studentPeriodAssignmentSchema], default: [] }
}, { timestamps: true });

module.exports = mongoose.model("TeacherSchedule", teacherScheduleSchema);
