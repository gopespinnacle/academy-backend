/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 3
 * PRIMARY USER MESSAGE MODEL
 * ============================================================
 *
 * PURPOSE:
 *
 * Store Primary User messages in MongoDB.
 *
 * THIS MODULE ONLY DEFINES THE DATABASE MODEL.
 *
 * It does NOT:
 *
 * - send messages
 * - receive Socket.IO messages
 * - load message history
 * - send notifications
 * - handle calls
 * - handle attachments
 *
 * ============================================================
 */

const mongoose = require("mongoose");


// ============================================================
// MESSAGE SCHEMA
// ============================================================

const primaryUserMessageSchema =
    new mongoose.Schema(

        {

            // ------------------------------------------------
            // MESSAGE IDENTITY
            // ------------------------------------------------

            messageId: {

                type: String,

                required: true,

                unique: true,

                index: true

            },


            // ------------------------------------------------
            // MESSAGE TEXT
            // ------------------------------------------------

            text: {

                type: String,

                required: true,

                trim: true

            },


            // ------------------------------------------------
            // SENDER
            // ------------------------------------------------

            sender: {

                type: String,

                required: true,

                default: "primary-user"

            },


            // ------------------------------------------------
            // MESSAGE CREATED TIME
            // ------------------------------------------------

            sentAt: {

                type: Date,

                required: true,

                default: Date.now

            }

        },


        {

            // Automatically creates:
            //
            // createdAt
            // updatedAt

            timestamps: true

        }

    );


// ============================================================
// EXPORT MODEL
// ============================================================

module.exports =
    mongoose.model(
        "PrimaryUserMessage",
        primaryUserMessageSchema
    );