const mongoose = require("mongoose");


const aiAssessmentSubmissionSchema =
    new mongoose.Schema(
        {

            /*
            ============================================
            ASSESSMENT ASSIGNMENT
            ============================================
            */

            assignment: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "AIAssessmentAssignment",

                required: true

            },


            /*
            ============================================
            QUESTION PAPER
            ============================================
            */

            questionPaper: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "QuestionPaper",

                required: true

            },


            /*
            ============================================
            STUDENT
            ============================================
            */

            student: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "User",

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


            /*
            ============================================
            ANSWER FILES UPLOADED BY STUDENT
            ============================================
            */

            answerFiles: [

                {

                    fileName: {

                        type: String,

                        required: true

                    },

                    fileUrl: {

                        type: String,

                        required: true

                    },

                    uploadedAt: {

                        type: Date,

                        default: Date.now

                    }

                }

            ],


            /*
            ============================================
            SUBMISSION STATUS
            ============================================
            */

            status: {

                type: String,

                enum: [

                    "Submitted",

                    "Under Correction",

                    "Corrected"

                ],

                default: "Submitted"

            },


            /*
            ============================================
            STUDENT SUBMISSION DATE
            ============================================
            */

            submittedAt: {

                type: Date,

                default: Date.now

            },


            /*
            ============================================
            TEACHER CORRECTION FILES
            ============================================
            */

            correctedFiles: [

                {

                    fileName: {

                        type: String

                    },

                    fileUrl: {

                        type: String

                    },

                    uploadedAt: {

                        type: Date

                    }

                }

            ],


            /*
            ============================================
            TEACHER FEEDBACK
            ============================================
            */

            teacherFeedback: {

                type: String,

                default: ""

            },


            /*
            ============================================
            CORRECTED DATE
            ============================================
            */

            correctedAt: {

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
        "AIAssessmentSubmission",
        aiAssessmentSubmissionSchema
    );