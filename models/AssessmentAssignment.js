const mongoose = require("mongoose");

const assessmentAssignmentSchema = new mongoose.Schema(
    {
        // ==========================================
        // ASSESSMENT
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
            trim: true,
            index: true
        },

        // ==========================================
        // STUDENT INFORMATION
        // ==========================================

        studentName: {
            type: String,
            required: true,
            trim: true
        },

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

        // ==========================================
        // ASSIGNED TEACHER
        //
        // Connected to your EXISTING User model.
        //
        // Example:
        // Ramya
        // GPA-T1
        // ==========================================

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        teacherId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        teacherName: {
            type: String,
            required: true,
            trim: true
        },

        // ==========================================
        // FOUNDER WHO ASSIGNED THE ASSESSMENT
        // ==========================================

        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        assignedByName: {
            type: String,
            default: ""
        },

        // ==========================================
        // ASSIGNMENT STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "ASSIGNED",
                "OPENED",
                "UNDER_REVIEW",
                "EVALUATED",
                "REASSIGNED",
                "CANCELLED"
            ],
            default: "ASSIGNED",
            index: true
        },

        // ==========================================
        // TEACHER ACTIVITY
        // ==========================================

        openedAt: {
            type: Date,
            default: null
        },

        startedAt: {
            type: Date,
            default: null
        },

        completedAt: {
            type: Date,
            default: null
        },

        // ==========================================
        // TEACHER EVALUATION
        // ==========================================

        mcqReviewed: {
            type: Boolean,
            default: false
        },

        caseStudyReviewed: {
            type: Boolean,
            default: false
        },

        evaluationSubmitted: {
            type: Boolean,
            default: false
        },

        // ==========================================
        // FINAL TEACHER FEEDBACK
        // ==========================================

        teacherFeedback: {
            type: String,
            default: ""
        },

        // ==========================================
        // TEACHER MARKS
        //
        // Case-study marks are entered by teacher.
        // ==========================================

        caseStudyScore: {
            type: Number,
            default: 0
        },

        caseStudyTotalMarks: {
            type: Number,
            default: 0
        },

        // ==========================================
        // FINAL RESULT
        // ==========================================

        finalScore: {
            type: Number,
            default: 0
        },

        finalTotalMarks: {
            type: Number,
            default: 0
        },

        // ==========================================
        // REASSIGNMENT INFORMATION
        // ==========================================

        reassignedFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        reassignedAt: {
            type: Date,
            default: null
        },

        reassignmentReason: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// INDEXES
// ==========================================

// Teacher's assessment inbox
assessmentAssignmentSchema.index({
    teacher: 1,
    status: 1
});


// Assessment lookup
assessmentAssignmentSchema.index({
    assessmentId: 1,
    status: 1
});


// Subject + teacher lookup
assessmentAssignmentSchema.index({
    subject: 1,
    teacherId: 1
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
    "AssessmentAssignment",
    assessmentAssignmentSchema
);