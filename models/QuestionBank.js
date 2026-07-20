const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    type: {
        type: String,
        required: true
    },

    question: {
        type: String,
        required: true
    },

    answer: {
        type: String,
        default: ""
    },

    marks: {
        type: Number,
        default: 0
    },

    difficulty: {
        type: String,
        enum: ["Easy", "Medium", "Hard"],
        default: "Medium"
    },

    bloomLevel: {
        type: String,
        default: ""
    },

    chapterTopic: {
        type: String,
        default: ""
    },

    keywords: [{
        type: String
    }],

    options: [{
        type: String
    }],

    explanation: {
        type: String,
        default: ""
    }

}, { _id: true });

const questionBankSchema = new mongoose.Schema({

    assessment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AIAssessment",
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

    version: {
        type: Number,
        default: 1
    },

    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },

    questions: [questionSchema],

    totalQuestions: {
        type: Number,
        default: 0
    },

    aiModel: {
        type: String,
        default: ""
    },

    promptVersion: {
        type: String,
        default: "1.0"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("QuestionBank", questionBankSchema);