const mongoose = require("mongoose");


// ============================================================
// GPA MESSENGER
// PRIMARY USER MESSAGE MODEL
// ============================================================

const primaryUserMessageSchema =
    new mongoose.Schema(

        {

            // ==================================================
            // CONVERSATION
            // ==================================================

            conversationId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "MessengerConversation",

                required:
                    true,

                index:
                    true

            },


            // ==================================================
            // SENDER
            // ==================================================
            //
            // Actual Academy User MongoDB ID.
            //
            // This identifies who actually sent the message.
            //
            // Founder / Teacher / Student / Parent / Admin
            // can all use the same field.
            // ==================================================

            senderId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "User",

                required:
                    true,

                index:
                    true

            },


            // ==================================================
            // RECEIVER
            // ==================================================

            receiverId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "User",

                required:
                    true,

                index:
                    true

            },


            // ==================================================
            // MESSAGE ID
            // ==================================================

            messageId: {

                type:
                    String,

                required:
                    true,

                unique:
                    true,

                index:
                    true

            },


            // ==================================================
            // MESSAGE TEXT
            // ==================================================

            text: {

                type:
                    String,

                required:
                    true,

                trim:
                    true

            },


            // ==================================================
            // MESSAGE TYPE / SOURCE
            // ==================================================

            sender: {

                type:
                    String,

                required:
                    true,

                default:
                    "primary-user"

            },


            // ==================================================
            // SENT TIME
            // ==================================================

            sentAt: {

                type:
                    Date,

                required:
                    true,

                default:
                    Date.now

            }

        },


        {
            timestamps:
                true
        }

    );


// ============================================================
// EXPORT
// ============================================================

module.exports =
    mongoose.model(
        "PrimaryUserMessage",
        primaryUserMessageSchema
    );