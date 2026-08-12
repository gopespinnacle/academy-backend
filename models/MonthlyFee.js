const mongoose = require("mongoose");

const monthlyFeeSchema = new mongoose.Schema({

    // ================= STUDENT =================

    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
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

    // ================= MONTH =================

    month: {
        type: Number,
        required: true
    },

    year: {
        type: Number,
        required: true
    },

    // ================= FEE =================

    actualFee: {
        type: Number,
        default: 0
    },

    feePaid: {
        type: Number,
        default: 0
    },

    // ================= DISTRIBUTION =================

    teacherFee: {
        type: Number,
        default: 0
    },

    academyFee: {
        type: Number,
        default: 0
    },

    // ================= PAYMENT =================

    paymentStatus: {
        type: String,
        enum: [
            "Pending",
            "Partial",
            "Paid"
        ],
        default: "Pending"
    },

    paymentDate: {
        type: Date,
        default: null
    },

    paymentReference: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});


// One monthly fee record per student
monthlyFeeSchema.index(
    {
        student: 1,
        month: 1,
        year: 1
    },
    {
        unique: true
    }
);


module.exports =
mongoose.model("MonthlyFee", monthlyFeeSchema);