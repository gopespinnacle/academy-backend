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
    resumeUrl: {
    type: String,
    required: true
},

resumeKey: {
    type: String,
    required: true
},
    subjects: [String],
skills: [String],
languages: [String],
// =========================
// Application Information
// =========================
applicationId: {
    type: String,
    unique: true
},

applicationStatus: {
    type: String,
    default: "Pending"
},

agreementAccepted: {
    type: Boolean,
    default: false
},

agreementVersion: {
    type: String,
    default: "v1.0"
},

agreementAcceptedOn: {
    type: Date
},

agreementAcceptedStatement: {
    type: String
},

agreementContent: {
    type: String
},
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("TeacherApplication", teacherApplicationSchema);