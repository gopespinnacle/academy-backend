const mongoose = require("mongoose");

const assessmentDocumentSchema = new mongoose.Schema(
    {
        // ==========================================
        // ASSESSMENT IDENTIFICATION
        // ==========================================

        assessment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PublicAssessment",
            required: true,
            index: true
        },

        assessmentId: {
            type: String,
            required: true,
            index: true,
            trim: true
        },

        // ==========================================
        // STUDENT IDENTIFICATION
        // ==========================================

        studentName: {
            type: String,
            required: true,
            trim: true
        },

        studentPrefix: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        // ==========================================
        // CASE STUDY IDENTIFICATION
        // ==========================================

        caseStudyId: {
            type: String,
            required: true,
            trim: true
        },

        // ==========================================
        // DOCUMENT INFORMATION
        // ==========================================

        originalFileName: {
            type: String,
            required: true,
            trim: true
        },

        fileType: {
            type: String,
            required: true,
            trim: true
        },

        mimeType: {
            type: String,
            required: true,
            trim: true
        },

        fileSize: {
            type: Number,
            default: 0
        },

        // ==========================================
        // STORAGE INFORMATION
        // ==========================================

        storageType: {
            type: String,
            enum: [
                "local",
                "google_drive",
                "cloudinary",
                "other"
            ],
            default: "local"
        },

        filePath: {
            type: String,
            required: true
        },

        fileUrl: {
            type: String,
            default: ""
        },

        // ==========================================
        // DOCUMENT PAGES
        // ==========================================

        pageCount: {
            type: Number,
            default: 1
        },

        // ==========================================
        // UPLOAD INFORMATION
        // ==========================================

        uploadedAt: {
            type: Date,
            default: Date.now
        },

        // ==========================================
        // REVIEW INFORMATION
        // ==========================================

        reviewStatus: {
            type: String,
            enum: [
                "UPLOADED",
                "ASSIGNED",
                "UNDER_REVIEW",
                "REVIEWED"
            ],
            default: "UPLOADED"
        },

        // ==========================================
        // TEACHER WHO REVIEWED THE DOCUMENT
        // ==========================================

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reviewedByTeacherId: {
            type: String,
            default: ""
        },

        reviewedAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // TEACHER ANNOTATIONS
        //
        // IMPORTANT:
        // These are stored separately from the
        // original student document.
        // ==========================================

        annotations: [
            {
                pageNumber: {
                    type: Number,
                    required: true
                },

                type: {
                    type: String,
                    enum: [
                        "pen",
                        "highlighter",
                        "text",
                        "circle",
                        "underline",
                        "mark"
                    ],
                    required: true
                },

                // Coordinates / drawing data
                // will be stored here by the
                // annotation interface.

                data: {
                    type: mongoose.Schema.Types.Mixed,
                    required: true
                },

                createdBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    default: null
                },

                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        // ==========================================
        // REVIEW SUMMARY
        // ==========================================

        teacherFeedback: {
            type: String,
            default: ""
        },

        marksObtained: {
            type: Number,
            default: 0
        },

        maximumMarks: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// INDEXES
// ==========================================

// Find all documents belonging to
// one particular assessment.

assessmentDocumentSchema.index({
    assessmentId: 1,
    caseStudyId: 1
});


// Find documents for a particular student.

assessmentDocumentSchema.index({
    studentPrefix: 1,
    assessmentId: 1
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
    "AssessmentDocument",
    assessmentDocumentSchema
);