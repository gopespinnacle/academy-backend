const mongoose = require("mongoose");

const teacherStudentMapSchema = new mongoose.Schema({

    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    subjects: [String],
    languages: [String],
    eca: [String]

}, { timestamps: true });

module.exports = mongoose.model("TeacherStudentMap", teacherStudentMapSchema);