const mongoose = require("mongoose");

const homeworkSubmissionSchema = new mongoose.Schema(
    {
        homework: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "HomeworkAssignment",
            required: true,
            index: true
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        answerText: {
            type: String,
            default: "",
            maxlength: 20000
        },
        attachments: {
            type: [{
                name: { type: String, default: "" },
                url: { type: String, required: true }
            }],
            default: []
        },
        status: {
            type: String,
            enum: ["submitted", "reviewed", "returned"],
            default: "submitted",
            index: true
        },
        submittedAt: {
            type: Date,
            default: Date.now
        },
        marks: {
            type: Number,
            min: 0,
            default: null
        },
        feedback: {
            type: String,
            default: "",
            maxlength: 10000
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },
        reviewedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

homeworkSubmissionSchema.index({ homework: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("HomeworkSubmission", homeworkSubmissionSchema);
