
const mongoose = require("mongoose");

const CompensationScheduleRequestSchema = new mongoose.Schema({

    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    className: {
        type: String,
        required: true
    },

    subject: {
    type: [String],
    default: []
},

language: {
    type: [String],
    default: []
},

eca: {
    type: [String],
    default: []
},

    date: {
        type: Date,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },

    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }],

    reason: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected"],
        default: "Pending"
    },

    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    reviewerRole: {
        type: String,
        enum: ["founder", "admin"],
        default: null
    },

    reviewedAt: {
        type: Date,
        default: null
    },

    rejectionReason: {
        type: String,
        default: ""
    }

}, { timestamps: true });

module.exports = mongoose.model(
    "CompensationScheduleRequest",
    CompensationScheduleRequestSchema
);
