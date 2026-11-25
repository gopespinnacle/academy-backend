const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({

    parentName: String,

    studentName: String,

    grade: String,

    board: String,

    mobile: String,

    courses: [String],

    studentDOB: String,

    parentMobile: String,

    parentWhatsapp: String,

    parentEmail: String,

    address: String,

    subjects: [String],

    selectedPlan: String,

    totalAmount: String,

    utr: String,

    // Admission approval tracking
    approved: {
        type: Boolean,
        default: false
    },

    approvedAt: {
        type: Date,
        default: null
    },

    createdStudentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }

},
{
    timestamps: true
});

module.exports = mongoose.model(
    "Admission",
    admissionSchema
);