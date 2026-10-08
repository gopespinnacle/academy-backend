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
// DELIVER MESSAGE TO OTHER PARTICIPANT
// ========================================================

const roomName =
    "gpa:conversation:" +
    message.conversationId;


// ========================================================
// IMPORTANT
// ========================================================
// Send the message to everyone in the conversation room
// EXCEPT the socket that originally sent the message.
//
// This prevents the sender from receiving the same message
// again because the frontend already displays the sent
// message immediately.
//
// Result:
//
// Sender   → message displayed once on sender screen
// Receiver → message displayed immediately
// ========================================================

io
    .to(roomName)
    .except(socket.id)
    .emit(
        "gpa:primary:conversation:message",
        serverMessage
    );


console.log(
    "[GPA PRIMARY CHAT SOCKET] " +
    "Message delivered to other participant in conversation room:",
    roomName
);


// ========================================================
// SEND CONFIRMATION ONLY TO SENDER
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
// JOIN CONVERSATION ROOM
// ==================================================

socket.on(
    "gpa:primary:conversation:join",
    (data) => {

        console.log(
            "[GPA PRIMARY CHAT SOCKET] " +
            "Conversation join request:",
            data
        );

        if (
            !data ||
            !data.conversationId
        ) {

            console.warn(
                "[GPA PRIMARY CHAT SOCKET] " +
                "conversationId is required for room join."
            );

            return;
        }

        const roomName =
            "gpa:conversation:" +
            data.conversationId;

        socket.join(roomName);

        console.log(
            "[GPA PRIMARY CHAT SOCKET] " +
            "Socket joined conversation room:",
            roomName
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