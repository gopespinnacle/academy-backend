const mongoose = require("mongoose");

const teacherPaymentSchema = new mongoose.Schema({

    // ================= TEACHER =================

    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    teacherId: {
        type: String,
        required: true
    },

    teacherName: {
        type: String,
        required: true
    },

    teacherWhatsapp: {
        type: String,
        default: ""
    },

    // ================= STUDENTS =================

    students: [
        {
            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            studentId: {
                type: String,
                default: ""
            },

            studentName: {
                type: String,
                default: ""
            }
        }
    ],

    // ================= PAYMENT =================

    feeMonth: {
        type: String,
        required: true
    },

    totalFee: {
        type: Number,
        default: 0
    },

    paymentDate: {
        type: Date,
        default: Date.now
    },

    paymentStatus: {
        type: String,
        default: "PAID"
    },

    // ================= RECEIPT =================

    receiptNumber: {
        type: String,
        unique: true,
        required: true
    },

    documentType: {
        type: String,
        enum: [
            "PDF",
            "JPG",
            "JPEG",
            "PNG"
        ],
        required: true
    },

    documentUrl: {
        type: String,
        default: ""
    },

    // ================= DESCRIPTION =================

    description: {
        type: String,
        default:
            "Academic Service Fee Payment Acknowledgement"
    }

}, {
    timestamps: true
});

module.exports =
    mongoose.model("TeacherPayment", teacherPaymentSchema);