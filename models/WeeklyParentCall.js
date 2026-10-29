
const mongoose = require("mongoose");

const discussionQuestionSchema = new mongoose.Schema(
    {
        questionNumber: {
            type: Number,
            required: true
        },

        question: {
            type: String,
            required: true
        },

        status: {
            type: String,
            default: ""
        },

        notes: {
            type: String,
            default: "",
            maxlength: 500
        }
    },
    { _id: false }
);

const actionItemSchema = new mongoose.Schema({
    task: {
        type: String,
        default: ""
    },

    assignedTo: {
        type: String,
        default: ""
    },

    dueDate: {
        type: Date,
        default: null
    },

    status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed"],
        default: "Pending"
    }
});

const weeklyParentCallSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        weekStart: {
            type: Date,
            required: true
        },

        weekEnd: {
            type: Date,
            required: true
        },

        callDateTime: {
            type: Date,
            default: Date.now
        },

        callStatus: {
            type: String,
            enum: [
                "Parent answered",
                "No answer",
                "Rescheduled",
                "Call back requested"
            ],
            default: "Parent answered"
        },

        callerName: {
            type: String,
            default: "Founder"
        },

        nextFollowUpDate: {
            type: Date,
            default: null
        },

        recordStatus: {
            type: String,
            enum: ["Draft", "Saved", "Completed"],
            default: "Draft",
            index: true
        },

        discussion: {
            type: [discussionQuestionSchema],
            default: () => [
                {
                    questionNumber: 1,
                    question: "How is the student studying at home?",
                    status: "",
                    notes: ""
                },
                {
                    questionNumber: 2,
                    question: "Is the parent satisfied with the teacher's teaching?",
                    status: "",
                    notes: ""
                },
                {
                    questionNumber: 3,
                    question: "Any concerns about homework?",
                    status: "",
                    notes: ""
                },
                {
                    questionNumber: 4,
                    question: "What additional support do you need from the academy?",
                    status: "",
                    notes: ""
                }
            ]
        },

        additionalRemarks: {
            type: String,
            default: "",
            maxlength: 1000
        },

        parentFeedback: {
            rating: {
                type: String,
                default: ""
            },

            notes: {
                type: String,
                default: ""
            }
        },

        teacherFeedback: {
            rating: {
                type: String,
                default: ""
            },

            notes: {
                type: String,
                default: ""
            }
        },

        actionPlan: {
            items: {
                type: [actionItemSchema],
                default: []
            },

            notes: {
                type: String,
                default: ""
            }
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        }
    },
    {
        timestamps: true
    }
);

weeklyParentCallSchema.index({
    student: 1,
    weekStart: -1
});

module.exports = mongoose.model(
    "WeeklyParentCall",
    weeklyParentCallSchema
);
