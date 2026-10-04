// ============================================================
// GPA MESSENGER - MESSAGE MODEL
// ============================================================
// Purpose:
// - Store 1-to-1 Messenger messages
// - Support message history
// - Support read/unread status
// - Support 30-day automatic deletion
//
// IMPORTANT:
// - No phone numbers are stored here
// - No group-chat structure
// - Permissions are handled separately
// ============================================================

const mongoose = require("mongoose");


// ============================================================
// MESSAGE SCHEMA
// ============================================================

const messengerMessageSchema = new mongoose.Schema(

    {

        // ----------------------------------------------------
        // Sender
        // ----------------------------------------------------

        sender: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            index: true

        },


        // ----------------------------------------------------
        // Receiver
        // ----------------------------------------------------

        receiver: {

            type: mongoose.Schema.Types.ObjectId,

            ref: "User",

            required: true,

            index: true

        },


        // ----------------------------------------------------
        // Message text
        // ----------------------------------------------------

        message: {

            type: String,

            required: true,

            trim: true,

            maxlength: 5000

        },


        // ----------------------------------------------------
        // Read status
        // ----------------------------------------------------

        read: {

            type: Boolean,

            default: false,

            index: true

        },


        // ----------------------------------------------------
        // Time when recipient read the message
        // ----------------------------------------------------

        readAt: {

            type: Date,

            default: null

        },


        // ----------------------------------------------------
        // Automatic deletion date
        // ----------------------------------------------------
        // Messages are retained for 30 days.
        // MongoDB TTL index will remove them automatically.
        // ----------------------------------------------------

        expiresAt: {

            type: Date,

            default: function () {

                return new Date(
                    Date.now() + (30 * 24 * 60 * 60 * 1000)
                );

            }

        }

    },

    {

        timestamps: true

    }

);


// ============================================================
// INDEXES
// ============================================================

// Conversation history.
//
// This allows efficient retrieval of messages between
// two users ordered by creation time.

messengerMessageSchema.index({

    sender: 1,

    receiver: 1,

    createdAt: -1

});


messengerMessageSchema.index({

    receiver: 1,

    sender: 1,

    createdAt: -1

});


// ============================================================
// TTL INDEX
// ============================================================
//
// MongoDB automatically deletes the message when expiresAt
// is reached.
//
// No manual polling is required for message deletion.
// ============================================================

messengerMessageSchema.index(

    { expiresAt: 1 },

    { expireAfterSeconds: 0 }

);


// ============================================================
// MODEL
// ============================================================

module.exports = mongoose.model(
    "MessengerMessage",
    messengerMessageSchema
);