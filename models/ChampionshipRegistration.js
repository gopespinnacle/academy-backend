
const mongoose = require("mongoose");

const championshipRegistrationSchema = new mongoose.Schema(
    {
        // Parent details
        parentName: {
            type: String,
            required: true,
            trim: true
        },

        parentPhone: {
            type: String,
            required: true,
            trim: true
        },

        parentEmail: {
            type: String,
            trim: true,
            lowercase: true
        },

        // Student details
        studentName: {
            type: String,
            required: true,
            trim: true
        },

        dateOfBirth: {
            type: Date,
            required: true
        },

        grade: {
            type: String,
            required: true
        },

        schoolName: {
            type: String,
            trim: true
        },

        // Competition selections
        competitions: [
            {
                competition: {
                    type: String,
                    required: true,
                    enum: [
                        "Science",
                        "Abacus",
                        "Drawing",
                        "Vocal Singing",
                        "Essay Writing",
                        "Spotlight Speaker"
                    ]
                },

                category: {
                    type: String,
                    required: true
                }
            }
        ],

        // Registration fee
        feePerCompetition: {
            type: Number,
            default: 199
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 199
        },

        // Payment information
        payment: {
            method: {
                type: String,
                enum: ["UPI", "Bank Transfer"]
            },

            transactionReference: {
                type: String,
                trim: true
            },

            paymentProofUrl: {
                type: String
            },

            paymentProofKey: {
                type: String
            },

            status: {
                type: String,
                enum: ["Pending", "Verified", "Rejected"],
                default: "Pending"
            },

            verifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            verifiedAt: {
                type: Date
            },

            rejectionReason: {
                type: String
            }
        },

        // Registration status
        registrationStatus: {
            type: String,
            enum: [
                "Payment Pending",
                "Confirmed",
                "Rejected"
            ],
            default: "Payment Pending"
        },

        participantId: {
            type: String,
            unique: true,
            sparse: true
        },

        registeredAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "ChampionshipRegistration",
    championshipRegistrationSchema
);
