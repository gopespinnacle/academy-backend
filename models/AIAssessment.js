const mongoose = require("mongoose");

const aiAssessmentSchema = new mongoose.Schema({

    className: {
        type: String,
        required: true,
        trim: true
    },

    subject: {
        type: String,
        required: true,
        trim: true
    },

    chapter: {
        type: String,
        required: true,
        trim: true
    },

    questionLevel: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
},

totalMarks: {
    type: Number,
    default: 25
},

duration: {
    type: String,
    default: "40 Minutes"
},

questionMode: {
    type: String,
    enum: ["Direct", "Indirect", "Direct + Indirect"],
    default: "Direct + Indirect"
},

questionTypes: {
    type: [String],
    default: []
},

    uploadedFileName: {
        type: String,
        required: true
    },

    s3Key: {
        type: String,
        required: true
    },

    s3Url: {
        type: String,
        required: true
    },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher",
        required: true
    },

    version: {
        type: Number,
        default: 1
    },

    status: {
        type: String,
        enum: [
            "Uploaded",
            "Processing",
            "QuestionBankReady",
            "Published",
            "Archived"
        ],
        default: "Uploaded"
    },

    questionBankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionBank",
        default: null
    },

    openAICost: {
        type: Number,
        default: 0
    },

    totalTokens: {
        type: Number,
        default: 0
    },

    processingTime: {
        type: Number,
        default: 0
    },

    remarks: {
        type: String,
        default: ""
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("AIAssessment", aiAssessmentSchema);