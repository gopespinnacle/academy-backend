const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
    parentName: String,
    studentName: String,
    grade: String,
    mobile: String,
    courses: [String]
}, { timestamps: true });

module.exports = mongoose.model("Admission", admissionSchema);