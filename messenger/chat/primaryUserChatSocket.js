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
 * IMPORTANT:
 *
 * This module ONLY receives and confirms the message.
 *
 * It does NOT:
 *
 * - save to MongoDB
 * - send to another user
 * - load message history
 * - handle notifications
 * - handle calls
 * - handle attachments
 *
 * Those will be separate modules.
 *
 * ============================================================
 */


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


        // --------------------------------------------------------
        // SOCKET CONNECTION
        // --------------------------------------------------------

        io.on(
            "connection",
            (socket) => {

                console.log(
                    "[GPA PRIMARY CHAT SOCKET] " +
                    "Socket connected:",
                    socket.id
                );


                // ------------------------------------------------
                // PRIMARY USER MESSAGE
                // ------------------------------------------------

                socket.on(
                    "gpa:primary:message",
                    (message) => {

                        console.log(
                            "[GPA PRIMARY CHAT SOCKET] " +
                            "Message received from Primary User:",
                            message
                        );


                        // ----------------------------------------
                        // BASIC VALIDATION
                        // ----------------------------------------

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


                        // ----------------------------------------
                        // CREATE SERVER MESSAGE
                        // ----------------------------------------

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

                            receivedAt:

                                new Date().toISOString(),

                            socketId:

                                socket.id

                        };


                        // ----------------------------------------
                        // CONFIRM TO SAME PRIMARY USER
                        // ----------------------------------------

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


                // ------------------------------------------------
                // DISCONNECT
                // ------------------------------------------------

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