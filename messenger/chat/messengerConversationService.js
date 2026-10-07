/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 5
 * CONVERSATION MAPPING SERVICE
 * ============================================================
 *
 * PURPOSE:
 *
 * Find or create the private conversation between:
 *
 *      Primary User
 *            +
 *        Receiver User
 *
 * ============================================================
 *
 * IMPORTANT:
 *
 * This module ONLY handles conversation mapping.
 *
 * It does NOT:
 *
 * - send messages
 * - receive Socket.IO messages
 * - save chat messages
 * - load chat history
 * - send notifications
 * - handle calls
 * - handle attachments
 *
 * ============================================================
 */

const mongoose =
    require("mongoose");


const MessengerConversation =
    require("./messengerConversation");


// ============================================================
// SERVICE
// ============================================================

class MessengerConversationService {


    // ============================================================
    // GET CONVERSATION KEY
    // ============================================================

    createConversationKey(
        userId,
        receiverId
    ) {


        if (!userId) {

            throw new Error(
                "Primary User ID is required."
            );

        }


        if (!receiverId) {

            throw new Error(
                "Receiver User ID is required."
            );

        }


        const id1 =
            String(userId);


        const id2 =
            String(receiverId);


        // --------------------------------------------------------
        // ALWAYS KEEP IDS IN THE SAME ORDER
        // --------------------------------------------------------
        //
        // Example:
        //
        // User A + User B
        //
        // becomes:
        //
        // A_B
        //
        // even if the second request is:
        //
        // B + A
        //
        // --------------------------------------------------------

        const sortedIds =
            [
                id1,
                id2
            ].sort();


        return (
            sortedIds[0] +
            "_" +
            sortedIds[1]
        );

    }


    // ============================================================
    // FIND OR CREATE CONVERSATION
    // ============================================================

    async getOrCreateConversation(
        userId,
        receiverId
    ) {


        if (!mongoose.Types.ObjectId.isValid(userId)) {

            throw new Error(
                "Invalid Primary User ID."
            );

        }


        if (!mongoose.Types.ObjectId.isValid(receiverId)) {

            throw new Error(
                "Invalid Receiver User ID."
            );

        }


        if (
            String(userId) ===
            String(receiverId)
        ) {

            throw new Error(
                "Primary User and Receiver cannot be the same user."
            );

        }


        const conversationKey =
            this.createConversationKey(
                userId,
                receiverId
            );


        // --------------------------------------------------------
        // CHECK EXISTING CONVERSATION
        // --------------------------------------------------------

        let conversation =
            await MessengerConversation.findOne(
                {
                    conversationKey:
                        conversationKey
                }
            );


        // --------------------------------------------------------
        // CREATE IF NOT FOUND
        // --------------------------------------------------------

        if (!conversation) {

            try {

                conversation =
                    await MessengerConversation.create(
                        {

                            participants: [

                                new mongoose.Types.ObjectId(
                                    userId
                                ),

                                new mongoose.Types.ObjectId(
                                    receiverId
                                )

                            ],

                            conversationKey:
                                conversationKey,

                            status:
                                "active"

                        }
                    );


                console.log(
                    "[GPA MESSENGER CONVERSATION] " +
                    "New conversation created:",
                    conversation._id
                );


            } catch (error) {


                // ------------------------------------------------
                // DUPLICATE PROTECTION
                // ------------------------------------------------
                //
                // If two requests try to create the same
                // conversation at exactly the same time,
                // MongoDB may reject one because conversationKey
                // is unique.
                //
                // In that case, simply load the existing one.
                // ------------------------------------------------

                if (
                    error &&
                    error.code === 11000
                ) {

                    conversation =
                        await MessengerConversation.findOne(
                            {
                                conversationKey:
                                    conversationKey
                            }
                        );

                } else {

                    throw error;

                }

            }

        }


        if (!conversation) {

            throw new Error(
                "Unable to create or find Messenger conversation."
            );

        }


        console.log(
            "[GPA MESSENGER CONVERSATION] " +
            "Conversation mapped:",
            conversation._id
        );


        return conversation;

    }

}


// ============================================================
// EXPORT SINGLE SERVICE
// ============================================================

module.exports =
    new MessengerConversationService();