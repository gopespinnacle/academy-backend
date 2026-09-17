const mongoose = require("mongoose");

const publicAssessmentSchema = new mongoose.Schema(
    {
        // ==========================================
        // STUDENT / PARENT INFORMATION
        // ==========================================

        studentName: {
            type: String,
            required: true,
            trim: true
        },

        parentName: {
            type: String,
            required: true,
            trim: true
        },

        whatsapp: {
            type: String,
            required: true,
            trim: true
        },

        parentEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },

        // ==========================================
        // ACADEMIC INFORMATION
        // ==========================================

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

        // Example:
        // ["Physics", "Chemistry", "Biology"]

        splitUps: [
            {
                type: String,
                trim: true
            }
        ],

        // ==========================================
        // SELECTED CHAPTERS
        // These are selected by the student/parent
        // from the automatically fetched curriculum.
        // ==========================================

        selectedChapters: [
            {
                curriculumId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "AssessmentCurriculum",
                    required: true
                },

                chapterNumber: {
                    type: Number,
                    required: true
                },

                chapterName: {
                    type: String,
                    required: true,
                    trim: true
                },

                splitUp: {
                    type: String,
                    required: true,
                    trim: true
                }
            }
        ],

        // ==========================================
        // UNIQUE ASSESSMENT IDENTIFICATION
        //
        // Example:
        // ARJ-ASS1
        // ARJ-ASS2
        // ARJ-ASS3
        // ==========================================

        assessmentId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        assessmentNumber: {
            type: Number,
            required: true
        },

        studentPrefix: {
            type: String,
            required: true,
            trim: true,
            uppercase: true
        },

        // ==========================================
        // ASSESSMENT QUESTIONS
        // ==========================================

        questions: [
            {
                questionId: {
                    type: String,
                    required: true
                },

                questionNumber: {
                    type: Number,
                    required: true
                },

                type: {
                    type: String,
                    enum: [
                        "MCQ",
                        "CASE_STUDY"
                    ],
                    required: true
                },

                question: {
                    type: String,
                    required: true
                },

                // ----------------------------------
                // MCQ OPTIONS
                // ----------------------------------

                options: [
                    {
                        type: String
                    }
                ],

                // ----------------------------------
                // CORRECT ANSWER
                // INTERNAL ONLY
                // ----------------------------------

                correctAnswer: {
                    type: String
                },

                // ----------------------------------
                // MODEL ANSWER
                // Mainly for case-study evaluation
                // ----------------------------------

                modelAnswer: {
                    type: String
                },

                // ----------------------------------
                // INTERNAL ACADEMIC MAPPING
                // ----------------------------------

                curriculumId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "AssessmentCurriculum"
                },

                chapterNumber: {
                    type: Number
                },

                chapterName: {
                    type: String
                },

                concept: {
                    type: String
                },

                topic: {
                    type: String
                },

                subtopic: {
                    type: String
                },

                difficulty: {
                    type: String,
                    enum: [
                        "Easy",
                        "Medium",
                        "Hard"
                    ]
                },

                competency: {
                    type: String
                },

                marks: {
                    type: Number,
                    required: true
                },

                explanation: {
                    type: String
                }
            }
        ],

        // ==========================================
        // STUDENT MCQ ANSWERS
        // ==========================================

        mcqAnswers: [
            {
                questionId: {
                    type: String,
                    required: true
                },

                questionNumber: {
                    type: Number,
                    required: true
                },

                selectedAnswer: {
                    type: String
                },

                correctAnswer: {
                    type: String
                },

                marksObtained: {
                    type: Number,
                    default: 0
                },

                maximumMarks: {
                    type: Number,
                    default: 1
                }
            }
        ],

        // ==========================================
        // CASE STUDIES
        // ==========================================

        caseStudies: [
            {
                caseStudyId: {
                    type: String,
                    required: true
                },

                questionIds: [
                    {
                        type: String
                    }
                ],

                title: {
                    type: String
                },

                totalMarks: {
                    type: Number,
                    default: 0
                },

                uploaded: {
                    type: Boolean,
                    default: false
                },

                documentIds: [
                    {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "AssessmentDocument"
                    }
                ],

                marksObtained: {
                    type: Number,
                    default: 0
                },

                teacherFeedback: {
                    type: String,
                    default: ""
                }
            }
        ],

        // ==========================================
        // SCORE INFORMATION
        // ==========================================

        mcqScore: {
            type: Number,
            default: 0
        },

        mcqTotalMarks: {
            type: Number,
            default: 0
        },

        caseStudyScore: {
            type: Number,
            default: 0
        },

        caseStudyTotalMarks: {
            type: Number,
            default: 0
        },

        finalScore: {
            type: Number,
            default: 0
        },

        finalTotalMarks: {
            type: Number,
            default: 0
        },

        // ==========================================
        // ASSESSMENT STATUS
        // ==========================================

        status: {
            type: String,
            enum: [
                "CREATED",
                "IN_PROGRESS",
                "MCQ_COMPLETED",
                "CASE_STUDY_PENDING",
                "SUBMITTED",
                "UNDER_REVIEW",
                "EVALUATED",
                "FINALIZED"
            ],
            default: "CREATED"
        },

        // ==========================================
        // TEACHER ASSIGNMENT REFERENCE
        //
        // Actual assignment details will be stored
        // in AssessmentAssignment.js
        // ==========================================

        assignedTeacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ==========================================
        // IMPORTANT DATES
        // ==========================================

        startedAt: {
            type: Date,
            default: null
        },

        submittedAt: {
            type: Date,
            default: null
        },

        evaluatedAt: {
            type: Date,
            default: null
        },

        finalizedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);


// ==========================================
// INDEXES
// ==========================================

publicAssessmentSchema.index({
    studentPrefix: 1,
    assessmentNumber: 1
});

publicAssessmentSchema.index({
    grade: 1,
    subject: 1,
    status: 1
});

publicAssessmentSchema.index({
    assignedTeacher: 1,
    status: 1
});


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
    "PublicAssessment",
    publicAssessmentSchema
);