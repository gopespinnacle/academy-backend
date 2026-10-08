/**
 * ============================================================
 * GPA MESSENGER
 * PRIMARY USER MESSAGE HISTORY SOCKET
 * ============================================================
 */
const mongoose =
    require("mongoose");

const PrimaryUserMessage =
    require("./primaryUserMessage");

const MessengerConversation =
    require("./messengerConversation");

class PrimaryUserMessageHistorySocket {

    initialize(io) {

        if (!io) {
            throw new Error(
                "[GPA PRIMARY MESSAGE HISTORY] " +
                "Socket.IO instance is required."
            );
        }

        console.log(
            "[GPA PRIMARY MESSAGE HISTORY] " +
            "Module initialized."
        );

        io.on(
            "connection",
            (socket) => {

                console.log(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "Socket connected:",
                    socket.id
                );

                // ====================================================
// LOAD MESSAGE HISTORY FOR ONE CONVERSATION
// ====================================================

socket.on(
    "gpa:primary:message:history",
    async (data) => {

        try {

            console.log(
                "[GPA PRIMARY MESSAGE HISTORY] " +
                "History request received:",
                data
            );


            // ====================================================
            // 1. CHECK CONVERSATION ID
            // ====================================================

            if (
                !data ||
                !data.conversationId
            ) {

                console.warn(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "conversationId is required."
                );

                socket.emit(
                    "gpa:primary:message:history:received",
                    []
                );

                return;
            }


            // ====================================================
            // 2. CHECK AUTHENTICATED USER
            // ====================================================

            if (!socket.userId) {

                console.warn(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "Authenticated user is missing."
                );

                socket.emit(
                    "gpa:primary:message:history:received",
                    []
                );

                return;
            }


            // ====================================================
            // 3. VALIDATE CONVERSATION ID
            // ====================================================

            if (
                !mongoose.Types.ObjectId.isValid(
                    data.conversationId
                )
            ) {

                console.warn(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "Invalid conversation ID."
                );

                socket.emit(
                    "gpa:primary:message:history:received",
                    []
                );

                return;
            }


            // ====================================================
            // 4. LOAD CONVERSATION
            // ====================================================

            const conversation =
                await MessengerConversation
                    .findById(
                        data.conversationId
                    )
                    .select(
                        "participants status"
                    )
                    .lean();


            // ====================================================
            // 5. CHECK CONVERSATION EXISTS
            // ====================================================

            if (
                !conversation ||
                !Array.isArray(
                    conversation.participants
                ) ||
                conversation.participants.length !== 2
            ) {

                console.warn(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "Conversation not found or invalid."
                );

                socket.emit(
                    "gpa:primary:message:history:received",
                    []
                );

                return;
            }


            // ====================================================
            // 6. CHECK CONVERSATION STATUS
            // ====================================================

            if (
                conversation.status !==
                "active"
            ) {

                console.warn(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "Conversation is not active."
                );

                socket.emit(
                    "gpa:primary:message:history:received",
                    []
                );

                return;
            }


            // ====================================================
            // 7. VERIFY USER IS A PARTICIPANT
            // ====================================================

            const isParticipant =
                conversation.participants.some(
                    participant =>
                        String(participant) ===
                        String(socket.userId)
                );


            if (!isParticipant) {

                console.warn(
                    "[GPA PRIMARY MESSAGE HISTORY] " +
                    "HISTORY ACCESS DENIED: " +
                    "User is not a conversation participant.",
                    {
                        userId:
                            socket.userId,

                        conversationId:
                            data.conversationId
                    }
                );

                socket.emit(
                    "gpa:primary:message:history:received",
                    []
                );

                return;
            }


            // ====================================================
            // 8. LOAD HISTORY
            // ====================================================

            const messages =
                await PrimaryUserMessage
                    .find({
                        conversationId:
                            data.conversationId
                    })
                    .sort({
                        sentAt: 1
                    })
                    .lean();


            // ====================================================
            // 9. LOG SUCCESS
            // ====================================================

            console.log(
                "[GPA PRIMARY MESSAGE HISTORY] " +
                "Authorized history access:",
                {
                    userId:
                        socket.userId,

                    conversationId:
                        data.conversationId,

                    messages:
                        messages.length
                }
            );


            // ====================================================
            // 10. RETURN HISTORY
            // ====================================================

            socket.emit(
                "gpa:primary:message:history:received",
                messages
            );


        } catch (error) {

            console.error(
                "[GPA PRIMARY MESSAGE HISTORY] " +
                "Failed to load history:",
                error
            );

            socket.emit(
                "gpa:primary:message:history:received",
                []
            );

        }

    }
);

            }
        );

    }

}

module.exports =
    new PrimaryUserMessageHistorySocket();