const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
    parentName: String,
    studentName: String,
    grade: String,
    mobile: String
});

module.exports = mongoose.model("Admission", admissionSchema);