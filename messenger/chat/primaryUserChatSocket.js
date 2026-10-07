/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 2
 * PRIMARY USER CHAT SOCKET
 * ============================================================
 *
 * PURPOSE:
 *
 * Receive a message from the Primary User through Socket.IO.
 *
 * MODULE 9 UPDATE:
 *
 * Message now belongs to:
 *
 * - conversationId
 * - receiverId
 *
 * ============================================================
 */

const PrimaryUserMessage =
    require("./primaryUserMessage");


class PrimaryUserChatSocket {


    // ============================================================
    // INITIALIZE
    // ============================================================

    initialize(io) {

        if (!io) {

            throw new Error(
                "[GPA PRIMARY CHAT SOCKET] " +
                "Socket.IO instance is required."
            );

        }


        console.log(
            "[GPA PRIMARY CHAT SOCKET] " +
            "Module initialized."
        );


        // ========================================================
        // SOCKET CONNECTION
        // ========================================================

        io.on(
            "connection",
            (socket) => {

                console.log(
                    "[GPA PRIMARY CHAT SOCKET] " +
                    "Socket connected:",
                    socket.id
                );


                // ==================================================
                // PRIMARY USER MESSAGE
                // ==================================================

                socket.on(
                    "gpa:primary:message",
                    async (message) => {

                        console.log(
                            "[GPA PRIMARY CHAT SOCKET] " +
                            "Message received:",
                            message
                        );


                        // ------------------------------------------
                        // BASIC VALIDATION
                        // ------------------------------------------

                        if (!message) {

                            console.warn(
                                "[GPA PRIMARY CHAT SOCKET] " +
                                "Empty message received."
                            );

                            return;
                        }


                        if (
                            typeof message.text !==
                            "string"
                        ) {

                            console.warn(
                                "[GPA PRIMARY CHAT SOCKET] " +
                                "Invalid message text."
                            );

                            return;
                        }


                        const text =
                            message.text.trim();


                        if (!text) {

                            console.warn(
                                "[GPA PRIMARY CHAT SOCKET] " +
                                "Empty message text."
                            );

                            return;
                        }


                        // ------------------------------------------
                        // CONVERSATION VALIDATION
                        // ------------------------------------------

                        if (
                            !message.conversationId
                        ) {

                            console.warn(
                                "[GPA PRIMARY CHAT SOCKET] " +
                                "conversationId is required."
                            );

                            return;
                        }


                        // ------------------------------------------
                        // RECEIVER VALIDATION
                        // ------------------------------------------

                        if (
                            !message.receiverId
                        ) {

                            console.warn(
                                "[GPA PRIMARY CHAT SOCKET] " +
                                "receiverId is required."
                            );

                            return;
                        }


                        // ------------------------------------------
                        // CREATE SERVER MESSAGE
                        // ------------------------------------------

                        const serverMessage = {

                            id:
                                message.id ||
                                (
                                    "server_" +
                                    Date.now() +
                                    "_" +
                                    Math.random()
                                        .toString(36)
                                        .substring(2, 10)
                                ),

                            text:
                                text,

                            sender:
                                "primary-user",

                            conversationId:
                                message.conversationId,

                            receiverId:
                                message.receiverId,

                            receivedAt:
                                new Date().toISOString(),

                            socketId:
                                socket.id

                        };


                        // ========================================================
                        // SAVE MESSAGE TO MONGODB
                        // ========================================================

                        try {

                            await PrimaryUserMessage.create({

    messageId:
        serverMessage.id,

    conversationId:
        message.conversationId,

    receiverId:
        message.receiverId,

    text:
        serverMessage.text,

    sender:
        serverMessage.sender,

    sentAt:
        serverMessage.receivedAt

});


                            console.log(
                                "[GPA PRIMARY CHAT DATABASE] " +
                                "Message saved to MongoDB:",
                                serverMessage.id
                            );


                        } catch (error) {

                            console.error(
                                "[GPA PRIMARY CHAT DATABASE] " +
                                "Failed to save message:",
                                error
                            );

                            return;

                        }


                        // ========================================================
                        // CONFIRM TO SAME PRIMARY USER
                        // ========================================================

                        socket.emit(
                            "gpa:primary:message:received",
                            serverMessage
                        );


                        console.log(
                            "[GPA PRIMARY CHAT SOCKET] " +
                            "Primary User message confirmed:",
                            serverMessage
                        );

                    }
                );


                // ==================================================
                // DISCONNECT
                // ==================================================

                socket.on(
                    "disconnect",
                    (reason) => {

                        console.log(
                            "[GPA PRIMARY CHAT SOCKET] " +
                            "Socket disconnected:",
                            socket.id,
                            reason
                        );

                    }
                );

            }
        );

    }

}


module.exports =
    new PrimaryUserChatSocket();