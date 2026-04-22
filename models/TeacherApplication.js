const mongoose = require("mongoose");

const teacherApplicationSchema = new mongoose.Schema({
    teacherName: String,
    whatsapp: String,
    mobile: String,
    email: String,
    education: String,
    experience: String,
    presentJob: String,
    timing: String,
    resume: String,
    subjects: [String],
skills: [String],
languages: [String],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("TeacherApplication", teacherApplicationSchema);