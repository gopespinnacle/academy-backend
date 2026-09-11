const mongoose = require("mongoose");

const aiAssessmentAssignmentSchema =
    new mongoose.Schema(
        {

            questionPaper: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "QuestionPaper",
                required: true
            },

            questionBank: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "QuestionBank",
                required: true
            },

            teacher: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            student: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            studentName: {
                type: String,
                required: true
            },

            studentId: {
                type: String,
                required: true
            },

            className: {
                type: String,
                required: true
            },

            subject: {
                type: String,
                required: true
            },

            chapter: {
                type: String,
                required: true
            },

            status: {
                type: String,
                enum: [
                    "Assigned",
                    "Started",
                    "Submitted",
                    "Completed"
                ],
                default: "Assigned"
            },

            assignedAt: {
                type: Date,
                default: Date.now
            },

            startedAt: {
                type: Date,
                default: null
            },

            submittedAt: {
                type: Date,
                default: null
            }

        },
        {
            timestamps: true
        }
    );

module.exports =
    mongoose.model(
        "AIAssessmentAssignment",
        aiAssessmentAssignmentSchema
    );