const mongoose = require("mongoose");

const AdmissionEnquirySchema = new mongoose.Schema({

    studentName: String,

    parentName: String,

    grade: String,

    mobile: String,

    courses: [String]

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "AdmissionEnquiry",
    AdmissionEnquirySchema
);