const mongoose = require("mongoose");

const gpaMessageSchema = new mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // -----------------------------------------------------
        // BACKWARD COMPATIBILITY
        // -----------------------------------------------------
        // Keep this field because existing direct messages
        // already use a single receiver.
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // -----------------------------------------------------
        // MULTIPLE RECIPIENTS
        // -----------------------------------------------------
        // Used when a conversation has multiple participants.
        //
        // Example:
        // Founder -> Teacher + Student
        //
        // receivers = [Teacher, Student]
        receivers: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ],

        // -----------------------------------------------------
        // READ STATUS FOR EACH USER
        // -----------------------------------------------------
        // This is required for group conversations because
        // Teacher and Student may read the same message
        // at different times.
        readBy: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },

                readAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        message: {
            type: String,
            required: true,
            trim: true
        },

        messageType: {
            type: String,
            enum: [
                "text",
                "voice",
                "file",
                "image",
                "system"
            ],
            default: "text"
        },

        // -----------------------------------------------------
        // BACKWARD COMPATIBILITY
        // -----------------------------------------------------
        // Existing direct-message logic can continue using
        // these fields.
        isRead: {
            type: Boolean,
            default: false
        },

        readAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "GPAMessage",
    gpaMessageSchema
);