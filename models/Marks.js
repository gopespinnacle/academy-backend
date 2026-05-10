const mongoose = require("mongoose");

const marksSchema = new mongoose.Schema({

    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment"
    },

    marksObtained: {
        type: Number,
        required: true
    },

    isLocked: {
        type: Boolean,
        default: false
    },

    modificationRequested: {
        type: Boolean,
        default: false
    },

    modificationApproved: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

marksSchema.index(
    { assessmentId: 1, studentId: 1 },
    { unique: true }
);

module.exports = mongoose.model("Marks", marksSchema);