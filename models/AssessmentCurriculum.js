const mongoose = require("mongoose");

const assessmentCurriculumSchema = new mongoose.Schema(
    {
        // ================================
        // CURRICULUM IDENTIFICATION
        // ================================

        board: {
            type: String,
            required: true,
            default: "CBSE"
        },

        curriculum: {
            type: String,
            required: true,
            default: "NCERT"
        },

        academicYear: {
            type: String,
            required: true,
            default: "2026-27"
        },

        // ================================
        // ACADEMIC LEVEL
        // ================================

        grade: {
            type: String,
            required: true,
            trim: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        // ================================
        // SUBJECT SPLIT-UP
        // Example:
        // Physics
        // Chemistry
        // Biology
        // Zoology
        // Botany
        // ================================

        splitUp: {
            type: String,
            required: true,
            trim: true
        },

        // ================================
        // CHAPTER INFORMATION
        // ================================

        chapterNumber: {
            type: Number,
            required: true
        },

        chapterName: {
            type: String,
            required: true,
            trim: true
        },

        // ================================
        // CONCEPTS
        // These are INTERNAL.
        // Parents/students will NOT see them
        // during assessment selection.
        // ================================

        concepts: [
            {
                name: {
                    type: String,
                    required: true,
                    trim: true
                },

                topics: [
                    {
                        type: String,
                        trim: true
                    }
                ]
            }
        ],

        // ================================
        // STATUS
        // ================================

        active: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);


// ========================================
// INDEXES
// ========================================

// Helps us quickly fetch chapters for:
//
// Grade + Subject + Split-up
//
// Example:
// Grade 8 + Science + Physics

assessmentCurriculumSchema.index({
    board: 1,
    curriculum: 1,
    academicYear: 1,
    grade: 1,
    subject: 1,
    splitUp: 1,
    chapterNumber: 1
});


// ========================================
// MODEL
// ========================================

module.exports = mongoose.model(
    "AssessmentCurriculum",
    assessmentCurriculumSchema
);