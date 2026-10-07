/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 5
 * CONVERSATION MODEL
 * ============================================================
 *
 * PURPOSE:
 *
 * Store the two users who belong to one private conversation.
 *
 * Example:
 *
 * Primary User
 *      +
 * Receiver User
 *      =
 * One Conversation
 *
 * THIS MODULE ONLY DEFINES THE CONVERSATION MODEL.
 *
 * It does NOT:
 *
 * - send messages
 * - receive messages
 * - load messages
 * - handle Socket.IO
 * - handle notifications
 * - handle calls
 * - handle attachments
 *
 * ============================================================
 */

const mongoose = require("mongoose");


// ============================================================
// CONVERSATION SCHEMA
// ============================================================

const messengerConversationSchema =
    new mongoose.Schema(

        {

            // ------------------------------------------------
            // TWO USERS IN THIS CONVERSATION
            // ------------------------------------------------

            participants: [

                {

                    type:
                        mongoose.Schema.Types.ObjectId,

                    ref: "User",

                    required: true

                }

            ],


            // ------------------------------------------------
            // UNIQUE CONVERSATION KEY
            // ------------------------------------------------
            //
            // Example:
            //
            // userId1_userId2
            //
            // The IDs will always be stored
            // in a consistent order.
            //
            // This prevents:
            //
            // A + B
            //
            // and
            //
            // B + A
            //
            // from becoming two different conversations.
            // ------------------------------------------------

            conversationKey: {

                type: String,

                required: true,

                unique: true,

                index: true

            },


            // ------------------------------------------------
            // LAST MESSAGE TIME
            // ------------------------------------------------

            lastMessageAt: {

                type: Date,

                default: null

            },


            // ------------------------------------------------
            // CONVERSATION STATUS
            // ------------------------------------------------

            status: {

                type: String,

                enum: [
                    "active",
                    "archived"
                ],

                default: "active"

            }

        },

        {

            timestamps: true

        }

    );


// ============================================================
// VALIDATE PARTICIPANTS
// ============================================================

messengerConversationSchema.pre(
    "validate",
    function () {

        if (
            !this.participants ||
            this.participants.length !== 2
        ) {

            throw new Error(
                "A Messenger conversation must have exactly 2 participants."
            );

        }

    }
);


// ============================================================
// EXPORT MODEL
// ============================================================

module.exports =
    mongoose.model(
        "MessengerConversation",
        messengerConversationSchema
    );