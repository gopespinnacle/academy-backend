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


    const User =
    require("../../models/User");

    
/* =========================================
   GPA MESSENGER — UNREAD MESSAGE COUNTS
   Uses the existing message database model.
========================================= */

async function sendUnreadCounts(io, userId) {
    try {
        if (!userId) return;

        const unreadMessages = await PrimaryUserMessage.aggregate([
            {
                $match: {
                    receiverId: new (require("mongoose").Types.ObjectId)(
                        String(userId)
                    ),
                    readAt: null
                }
            },
            {
                $group: {
                    _id: "$conversationId",
                    count: { $sum: 1 }
                }
            }
        ]);

        
const counts = {};

const conversationIds = unreadMessages.map(
    (item) => item._id
);

const conversations = await MessengerConversation.find({
    _id: { $in: conversationIds }
})
    .select("participants")
    .lean();

const conversationParticipants = new Map();

conversations.forEach((conversation) => {
    const participants = (conversation.participants || []).map(
        (participant) =>
            String(
                participant?._id ||
                participant?.id ||
                participant
            )
    );

    const otherUserId = participants.find(
        (participantId) =>
            participantId !== String(userId)
    );

    if (otherUserId) {
        conversationParticipants.set(
            String(conversation._id),
            otherUserId
        );
    }
});

unreadMessages.forEach((item) => {
    const contactId = conversationParticipants.get(
        String(item._id)
    );

    if (contactId) {
        counts[contactId] =
            (counts[contactId] || 0) + item.count;
    }
});


        io.to("gpa:user:" + String(userId)).emit(
            "gpa:primary:unread:counts",
            counts
        );
    } catch (error) {
        console.error(
            "[GPA MESSENGER] Unread-count update failed:",
            error
        );
    }
}


    
/* =========================================
   MESSENGER ONLINE PRESENCE
   Track all active sockets per user.
========================================= */

const onlineUsers = new Map();

function addOnlineSocket(userId, socketId) {
    const id = String(userId);

    if (!onlineUsers.has(id)) {
        onlineUsers.set(id, new Set());
    }

    onlineUsers.get(id).add(socketId);
}

function removeOnlineSocket(userId, socketId) {
    const id = String(userId);
    const sockets = onlineUsers.get(id);

    if (!sockets) return false;

    sockets.delete(socketId);

    if (sockets.size === 0) {
        onlineUsers.delete(id);
        return true;
    }

    return false;
}

function isUserOnline(userId) {
    const sockets = onlineUsers.get(String(userId));
    return Boolean(sockets && sockets.size > 0);
}


async function broadcastUserPresence(io, userId, isOnline, lastSeenAt = null) {
    try {
        const conversations = await MessengerConversation.find({
            participants: userId
        }).select("_id");

        for (const conversation of conversations) {
            io.to("gpa:conversation:" + String(conversation._id)).emit(
                "gpa:primary:presence:update",
                {
                    userId: String(userId),
                    isOnline: Boolean(isOnline),
                    lastSeenAt: lastSeenAt
                }
            );
        }
    } catch (error) {
        console.error(
            "[GPA PRIMARY CHAT SOCKET] Presence broadcast failed:",
            error
        );
    }
}



const { sendPushNotification } =
    require("../../services/fcmService");

const { sendMessengerWebPush } =
    require("../../services/messengerWebPushService");


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

       io.on("connection", async (socket) => {

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

// Dedicated authenticated-user room for notification events across chats.
socket.join("gpa:user:" + String(socket.userId));

sendUnreadCounts(io, socket.userId);

const wasOnline = isUserOnline(socket.userId);

addOnlineSocket(socket.userId, socket.id);

if (!wasOnline) {
    await broadcastUserPresence(
        io,
        socket.userId,
        true,
        null
    );
}

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
        // SEND FCM PUSH NOTIFICATION
        // ========================================================
        // Notification failures must never interrupt chat delivery.
        // ========================================================

        (async () => {
            try {
                const receiverId = serverMessage.receiverId;
                const messageSenderId = serverMessage.senderId;

                if (!receiverId || !messageSenderId) {
                    console.warn(
                        "[GPA FCM] Missing sender or receiver ID."
                    );
                    return;
                }

                
const receiverUser = await User.findById(receiverId)
    .select("fcmToken")
    .lean();

const fcmToken =
    typeof receiverUser?.fcmToken === "string"
        ? receiverUser.fcmToken.trim()
        : "";

if (!fcmToken) {
    console.log(
        "[GPA FCM] Receiver has no valid registered FCM token:",
        String(receiverId)
    );
    return;
}

console.log("[GPA FCM] Receiver token validated:", {
    receiverId: String(receiverId),
    tokenType: typeof fcmToken,
    tokenLength: fcmToken.length
});


                const senderUser = await User.findById(messageSenderId)
                    .select("name fullName username email")
                    .lean();

                const senderName =
                    senderUser?.name ||
                    senderUser?.fullName ||
                    senderUser?.username ||
                    senderUser?.email ||
                    "New message";

                const messageText = String(
                    serverMessage.text || "New message"
                );

                const result = await sendPushNotification({
                    token: fcmToken,
                    title: senderName,
                    body: messageText.length > 150
                        ? messageText.slice(0, 147) + "..."
                        : messageText,
                    data: {
                        type: "chat_message",
                        conversationId: String(
                            serverMessage.conversationId
                        ),
                        messageId: String(
                            serverMessage.id || serverMessage._id
                        ),
                        senderId: String(messageSenderId)
                    }
                });

                if (result.success) {
                    console.log(
                        "[GPA FCM] Message notification sent successfully."
                    );
                } else {
                    console.warn(
                        "[GPA FCM] Notification was not sent:",
                        result.reason
                    );
                }
            
} catch (fcmError) {
    console.error(
        "[GPA FCM] Notification error:",
        fcmError.stack || fcmError
    );
}

        })();



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
    .emit(
        "gpa:primary:conversation:message",
        serverMessage
    );

// Notify all sessions belonging to the recipient, even when they are not
// currently inside this conversation. This event supports open/background tabs.
io.to("gpa:user:" + String(serverMessage.receiverId)).emit(
    "gpa:primary:notification:message",
    serverMessage
);

sendUnreadCounts(io, serverMessage.receiverId);


(async () => {
    try {
        const receiverId = serverMessage.receiverId;
        const messageSenderId = serverMessage.senderId;

        if (!receiverId || !messageSenderId) {
            console.warn(
                "[GPA WEB PUSH] Missing sender or receiver ID."
            );
            return;
        }

        const senderUser = await User.findById(messageSenderId)
            .select("name fullName username email")
            .lean();

        const senderName =
            senderUser?.name ||
            senderUser?.fullName ||
            senderUser?.username ||
            senderUser?.email ||
            "New message";

        const preview = String(serverMessage.text || "New message");

        await sendMessengerWebPush({
            userId: receiverId,
            title: senderName,
            body: preview.length > 150
                ? preview.slice(0, 147) + "..."
                : preview,
            data: {
                type: "chat_message",
                conversationId: String(serverMessage.conversationId),
                messageId: String(
                    serverMessage.id || serverMessage._id
                ),
                senderId: String(messageSenderId),
                url: "/messenger/messenger.html"
            }
        });
    } catch (pushError) {
        console.error(
            "[GPA WEB PUSH] Notification error:",
            pushError.message
        );
    }
})();




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
        // REQUEST CURRENT CONTACT PRESENCE
        // ==================================================

        socket.on(
            "gpa:primary:presence:request",
            async (data) => {
                try {
                    if (!socket.userId || !data || !data.contactId) {
                        return;
                    }

                    const contactId = String(data.contactId);

                    // Do not allow a user to request their own status.
                    if (contactId === String(socket.userId)) {
                        return;
                    }

                    // Verify both users share an active conversation.
                    const conversation = await MessengerConversation.findOne({
                        participants: {
                            $all: [socket.userId, contactId]
                        },
                        status: "active"
                    }).select("_id");

                    if (!conversation) {
                        return;
                    }

                    // Read the contact's saved last-seen time.
                    const contact = await User.findById(contactId)
                        .select("lastSeenAt")
                        .lean();

                    if (!contact) {
                        return;
                    }

                    // Reply only to the requesting user's socket.
                    socket.emit("gpa:primary:presence:update", {
                        userId: contactId,
                        isOnline: isUserOnline(contactId),
                        lastSeenAt: contact.lastSeenAt || null
                    });

                } catch (error) {
                    console.error(
                        "[GPA PRIMARY CHAT SOCKET] Presence request failed:",
                        error
                    );
                }
            }
        );


        // ==================================================
        // LIVE TYPING INDICATOR
        // ==================================================

        socket.on("gpa:primary:typing", async (data) => {
            try {
                if (
                    !data ||
                    !data.conversationId ||
                    typeof data.isTyping !== "boolean" ||
                    !socket.userId
                ) {
                    return;
                }

                const conversationId = String(data.conversationId);
                const roomName = "gpa:conversation:" + conversationId;

                // Only allow typing events from an authorized room member.
                if (!socket.rooms.has(roomName)) {
                    return;
                }

                // Verify conversation and authenticated user.
                const conversation = await MessengerConversation
                    .findById(conversationId)
                    .select("participants status");

                if (
                    !conversation ||
                    conversation.status !== "active" ||
                    !Array.isArray(conversation.participants) ||
                    !conversation.participants.some(
                        participant =>
                            String(participant) === String(socket.userId)
                    )
                ) {
                    return;
                }

                // Send to the other participant, not back to this socket.
                socket.to(roomName).emit(
                    "gpa:primary:conversation:typing",
                    {
                        conversationId,
                        userId: String(socket.userId),
                        isTyping: data.isTyping
                    }
                );
            } catch (error) {
                console.error(
                    "[GPA PRIMARY CHAT SOCKET] Typing event failed:",
                    error.message
                );
            }
        });


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
    console.warn("[GPA RECEIPT DEBUG] Invalid receipt payload:", data);
    return;
}

if (!socket.userId) {
    console.warn(
        "[GPA RECEIPT DEBUG] Socket has no authenticated user ID"
    );
    return;
}

console.log("[GPA RECEIPT DEBUG] Receipt request:", {
    status,
    messageId: data.messageId,
    conversationId: data.conversationId,
    authenticatedUserId: String(socket.userId)
});

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

                
console.log("[GPA RECEIPT DEBUG] Incoming receipt:", {
    status,
    messageId: data.messageId,
    conversationId: data.conversationId,
    authenticatedUserId: socket.userId
});

const message = await PrimaryUserMessage.findOne({
    messageId: data.messageId,
    conversationId: data.conversationId,
    receiverId: socket.userId
});


                // Only the authenticated recipient can acknowledge
                // delivery or reading of this message.
                if (!message) {
    console.warn("[GPA RECEIPT DEBUG] Message not found:", {
        messageId: data.messageId,
        conversationId: data.conversationId,
        authenticatedUserId: socket.userId
    });
    return;
}

console.log("[GPA RECEIPT DEBUG] Message found:", {
    messageId: message.messageId,
    deliveryStatus: message.deliveryStatus,
    receiverId: String(message.receiverId)
});

                const now = new Date();

                if (status === "delivered") {
                    if (message.deliveryStatus === "sent") {
                        message.deliveryStatus = "delivered";
                        message.deliveredAt = now;
                        await message.save();
                    }
                
} else if (status === "read") {
    const needsSave =
        message.deliveryStatus !== "read" ||
        !message.readAt ||
        !message.deliveredAt;

    if (message.deliveryStatus !== "read") {
        message.deliveryStatus = "read";
    }

    if (!message.deliveredAt) {
        message.deliveredAt = now;
    }

    if (!message.readAt) {
        message.readAt = now;
    }

    if (needsSave) {
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

                if (status === "read") {
    await sendUnreadCounts(io, socket.userId);
}

                console.log("[GPA RECEIPT DEBUG] Status broadcast:", {
    messageId: receipt.messageId,
    deliveryStatus: receipt.deliveryStatus,
    conversationId: receipt.conversationId
});

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
    data => {
        console.log("[GPA RECEIPT DEBUG] DELIVERED event received:", {
            data,
            authenticatedUserId: socket.userId
        });

        updateMessageReceipt(data, "delivered");
    }
);

socket.on(
    "gpa:primary:message:read",
    data => {
        console.log("[GPA RECEIPT DEBUG] READ event received:", {
            data,
            authenticatedUserId: socket.userId
        });

        updateMessageReceipt(data, "read");
    }
);


                // ==================================================
                // DISCONNECT
                // ==================================================

                
socket.on(
    "disconnect",
    async (reason) => {
        console.log(
            "[GPA PRIMARY CHAT SOCKET] " +
            "Socket disconnected:",
            socket.id,
            reason
        );

        // Remove this socket from the user's active connections.
        const wentOffline = removeOnlineSocket(
            socket.userId,
            socket.id
        );

        // Only update last seen when the user's final socket closes.
        if (wentOffline) {
            try {
                const lastSeenAt = new Date();

                await User.findByIdAndUpdate(
                    socket.userId,
                    { lastSeenAt: lastSeenAt },
                    { new: true }
                );

                
await broadcastUserPresence(
    io,
    socket.userId,
    false,
    lastSeenAt
);


                console.log(
                    "[GPA PRIMARY CHAT SOCKET] User went offline:",
                    socket.userId,
                    lastSeenAt
                );
            } catch (error) {
                console.error(
                    "[GPA PRIMARY CHAT SOCKET] Failed to save last seen:",
                    error
                );
            }
        }
    }
);


            }
        );

    }

}


module.exports =
    new PrimaryUserChatSocket();