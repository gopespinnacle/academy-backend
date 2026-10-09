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

    const jwt =
    require("jsonwebtoken");

    const MessengerConversation =
    require("./messengerConversation");


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

                // ========================================================
// SOCKET JWT AUTHENTICATION
// ========================================================

const token =
    socket.handshake.auth &&
    socket.handshake.auth.token;

if (!token) {

    console.warn(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Socket authentication token is missing."
    );

    socket.disconnect(true);

    return;
}

let decodedUser;

try {

    decodedUser =
        jwt.verify(
            token,
            process.env.JWT_SECRET
        );

} catch (error) {

    console.warn(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Invalid socket authentication token."
    );

    socket.disconnect(true);

    return;
}

if (
    !decodedUser ||
    !decodedUser.id ||
    !decodedUser.role
) {

    console.warn(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Invalid socket user information."
    );

    socket.disconnect(true);

    return;
}

// ========================================================
// STORE AUTHENTICATED USER ON SOCKET
// ========================================================

socket.userId =
    decodedUser.id;

socket.userRole =
    decodedUser.role;

console.log(
    "[GPA PRIMARY CHAT SOCKET] " +
    "Authenticated user:",
    socket.userId
);

console.log(
    "[GPA PRIMARY CHAT SOCKET] " +
    "Authenticated role:",
    socket.userRole
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

                            // ========================================================
// FIND CONVERSATION
// ========================================================

const messengerConversation =
    await MessengerConversation
        .findById(
            message.conversationId
        )
        .select(
            "participants"
        );


// ========================================================
// VALIDATE CONVERSATION
// ========================================================

if (
    !messengerConversation ||
    !Array.isArray(
        messengerConversation.participants
    ) ||
    messengerConversation.participants.length !== 2
) {

    console.error(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Invalid Messenger conversation."
    );

    return;
}


// ========================================================
// VERIFY AUTHENTICATED USER IS A PARTICIPANT
// ========================================================

const isParticipant =
    messengerConversation.participants.some(
        participant =>
            String(participant) ===
            String(socket.userId)
    );

if (!isParticipant) {

    console.error(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Authenticated user is not a participant in this conversation."
    );

    return;
}


// ========================================================
// ACTUAL SENDER
// ========================================================
//
// The sender MUST come from the authenticated socket.
//
// NEVER trust senderId from the browser.
//

const senderId =
    socket.userId;

if (!senderId) {

    console.error(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Authenticated sender ID is missing."
    );

    return;
}


// ========================================================
// ACTUAL RECEIVER
// ========================================================
//
// The receiver is the OTHER participant in the
// two-person conversation.
//
// This means the browser cannot choose the receiver.
//

const actualReceiverId =
    messengerConversation.participants.find(
        participant =>
            String(participant) !==
            String(socket.userId)
    );

if (!actualReceiverId) {

    console.error(
        "[GPA PRIMARY CHAT SOCKET] " +
        "Unable to determine receiver ID."
    );

    return;
}


// ========================================================
// USE BACKEND-DETERMINED RECEIVER
// ========================================================

serverMessage.senderId =
    senderId;

serverMessage.receiverId =
    actualReceiverId;


// ========================================================
// LOG AUTHENTICATED MESSAGE OWNERSHIP
// ========================================================

console.log(
    "[GPA PRIMARY CHAT SOCKET] " +
    "Authenticated sender:",
    senderId
);

console.log(
    "[GPA PRIMARY CHAT SOCKET] " +
    "Backend determined receiver:",
    actualReceiverId
);


// ========================================================
// ADD SENDER ID TO REAL-TIME MESSAGE
// ========================================================

serverMessage.senderId =
    senderId;


// ========================================================
// SAVE MESSAGE
// ========================================================


const savedMessage = await PrimaryUserMessage.create({
    messageId: serverMessage.id,
    conversationId: message.conversationId,
    senderId: senderId,
    receiverId: actualReceiverId,
    text: serverMessage.text,
    sender: serverMessage.sender,
    sentAt: serverMessage.receivedAt,
    deliveryStatus: "sent",
    deliveredAt: null,
    readAt: null
});

serverMessage.deliveryStatus = savedMessage.deliveryStatus;
serverMessage.deliveredAt = savedMessage.deliveredAt;
serverMessage.readAt = savedMessage.readAt;



console.log(
    "[GPA PRIMARY CHAT SOCKET] " +
    "Message saved with sender ID:",
    senderId
);


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
//
// SECURITY:
// The browser is NOT trusted to decide whether it
// can join a conversation.
//
// The authenticated socket user must be one of the
// two participants stored in MongoDB.
//
// ==================================================

socket.on(
    "gpa:primary:conversation:join",
    async (data) => {

        try {

            console.log(
                "[GPA PRIMARY CHAT SOCKET] " +
                "Conversation join request:",
                data
            );


            // ==================================================
            // 1. CHECK CONVERSATION ID
            // ==================================================

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


            // ==================================================
            // 2. CHECK AUTHENTICATED SOCKET USER
            // ==================================================

            if (!socket.userId) {

                console.warn(
                    "[GPA PRIMARY CHAT SOCKET] " +
                    "Authenticated user is missing."
                );

                socket.emit(
                    "gpa:primary:conversation:join:denied",
                    {
                        conversationId:
                            data.conversationId,

                        message:
                            "Authentication required."
                    }
                );

                return;
            }


            // ==================================================
            // 3. LOAD CONVERSATION FROM MONGODB
            // ==================================================

            const messengerConversation =
                await MessengerConversation
                    .findById(
                        data.conversationId
                    )
                    .select(
                        "participants status"
                    );


            // ==================================================
            // 4. CHECK CONVERSATION EXISTS
            // ==================================================

            if (
                !messengerConversation ||
                !Array.isArray(
                    messengerConversation.participants
                ) ||
                messengerConversation.participants.length !== 2
            ) {

                console.warn(
                    "[GPA PRIMARY CHAT SOCKET] " +
                    "Conversation not found or invalid."
                );

                socket.emit(
                    "gpa:primary:conversation:join:denied",
                    {
                        conversationId:
                            data.conversationId,

                        message:
                            "Conversation not found."
                    }
                );

                return;
            }


            // ==================================================
            // 5. CHECK CONVERSATION STATUS
            // ==================================================

            if (
                messengerConversation.status !==
                "active"
            ) {

                console.warn(
                    "[GPA PRIMARY CHAT SOCKET] " +
                    "Conversation is not active."
                );

                socket.emit(
                    "gpa:primary:conversation:join:denied",
                    {
                        conversationId:
                            data.conversationId,

                        message:
                            "Conversation is not active."
                    }
                );

                return;
            }


            // ==================================================
            // 6. VERIFY USER IS A PARTICIPANT
            // ==================================================

            const isParticipant =
                messengerConversation.participants.some(
                    participant =>
                        String(participant) ===
                        String(socket.userId)
                );


            if (!isParticipant) {

                console.warn(
                    "[GPA PRIMARY CHAT SOCKET] " +
                    "ROOM JOIN DENIED: User is not a conversation participant.",
                    {
                        userId:
                            socket.userId,

                        conversationId:
                            data.conversationId
                    }
                );

                socket.emit(
                    "gpa:primary:conversation:join:denied",
                    {
                        conversationId:
                            data.conversationId,

                        message:
                            "You are not a participant in this conversation."
                    }
                );

                return;
            }


            // ==================================================
            // 7. USER IS AUTHORIZED
            // ==================================================

            const roomName =
                "gpa:conversation:" +
                data.conversationId;


            socket.join(
                roomName
            );


            // ==================================================
            // 8. CONFIRM SUCCESS
            // ==================================================

            console.log(
                "[GPA PRIMARY CHAT SOCKET] " +
                "SECURE ROOM JOIN APPROVED:",
                {
                    userId:
                        socket.userId,

                    conversationId:
                        data.conversationId,

                    room:
                        roomName
                }
            );


            socket.emit(
                "gpa:primary:conversation:join:approved",
                {
                    conversationId:
                        data.conversationId
                }
            );


        } catch (error) {

            console.error(
                "[GPA PRIMARY CHAT SOCKET] " +
                "Conversation room join failed:",
                error
            );


            socket.emit(
                "gpa:primary:conversation:join:denied",
                {
                    conversationId:
                        data?.conversationId || null,

                    message:
                        "Unable to join conversation."
                }
            );

        }

    }
);


        // ==================================================
        // MESSAGE DELIVERY AND READ RECEIPTS
        // ==================================================

        async function updateMessageReceipt(data, status) {
            try {
                if (
                    !data ||
                    !data.messageId ||
                    !data.conversationId
                ) {
                    return;
                }

                if (!socket.userId) {
                    return;
                }

                const conversation =
                    await MessengerConversation.findById(
                        data.conversationId
                    ).select("participants status");

                if (
                    !conversation ||
                    conversation.status !== "active" ||
                    !Array.isArray(conversation.participants) ||
                    conversation.participants.length !== 2 ||
                    !conversation.participants.some(
                        participant =>
                            String(participant) ===
                            String(socket.userId)
                    )
                ) {
                    return;
                }

                const message =
                    await PrimaryUserMessage.findOne({
                        messageId: data.messageId,
                        conversationId: data.conversationId,
                        receiverId: socket.userId
                    });

                // Only the authenticated recipient can acknowledge
                // delivery or reading of this message.
                if (!message) {
                    return;
                }

                const now = new Date();

                if (status === "delivered") {
                    if (message.deliveryStatus === "sent") {
                        message.deliveryStatus = "delivered";
                        message.deliveredAt = now;
                        await message.save();
                    }
                } else if (status === "read") {
                    if (message.deliveryStatus !== "read") {
                        message.deliveryStatus = "read";

                        if (!message.deliveredAt) {
                            message.deliveredAt = now;
                        }

                        message.readAt = now;
                        await message.save();
                    }
                }

                const receipt = {
                    messageId: message.messageId,
                    conversationId: String(message.conversationId),
                    senderId: String(message.senderId),
                    receiverId: String(message.receiverId),
                    deliveryStatus: message.deliveryStatus,
                    deliveredAt: message.deliveredAt,
                    readAt: message.readAt
                };

                const roomName =
                    "gpa:conversation:" + data.conversationId;

                io.to(roomName).emit(
                    "gpa:primary:message:status",
                    receipt
                );

            } catch (error) {
                console.error(
                    "[GPA PRIMARY CHAT SOCKET] Receipt update failed:",
                    error
                );
            }
        }

        // Recipient confirms the message reached their device.
        socket.on(
            "gpa:primary:message:delivered",
            data => updateMessageReceipt(data, "delivered")
        );

        // Recipient confirms they have opened/read the message.
        socket.on(
            "gpa:primary:message:read",
            data => updateMessageReceipt(data, "read")
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