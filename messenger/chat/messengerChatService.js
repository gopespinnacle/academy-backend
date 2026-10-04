// ============================================================
// GPA MESSENGER - CHAT SERVICE
// ============================================================
// Purpose:
// - Send 1-to-1 messages
// - Retrieve conversation history
// - Mark messages as read
// - Get unread message count
// - Enforce Messenger chat permissions
//
// IMPORTANT:
// - No Socket.IO logic here
// - No HTTP route logic here
// - No UI logic here
// - Permissions are checked on the backend
// ============================================================

const MessengerMessage = require("./messengerMessageModel");

const {
    canChat
} = require("../permissions/messengerPermissionService");


// ============================================================
// HELPER - VALIDATE USER ID
// ============================================================

function validateUserId(userId, fieldName) {

    if (!userId) {

        throw new Error(
            `${fieldName} is required.`
        );

    }

    return String(userId);

}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage(senderId, receiverId, message) {

    validateUserId(senderId, "Sender ID");

    validateUserId(receiverId, "Receiver ID");


    // --------------------------------------------------------
    // Sender cannot message themselves
    // --------------------------------------------------------

    if (
        String(senderId) === String(receiverId)
    ) {

        throw new Error(
            "You cannot send a message to yourself."
        );

    }


    // --------------------------------------------------------
    // Validate message
    // --------------------------------------------------------

    if (
        typeof message !== "string" ||
        !message.trim()
    ) {

        throw new Error(
            "Message cannot be empty."
        );

    }


    const cleanMessage = message.trim();


    if (cleanMessage.length > 5000) {

        throw new Error(
            "Message cannot exceed 5000 characters."
        );

    }


    // --------------------------------------------------------
    // BACKEND PERMISSION CHECK
    // --------------------------------------------------------
    //
    // The frontend is NOT trusted.
    //
    // Example:
    //
    // Teacher → mapped Student       ALLOWED
    // Teacher → unrelated Student   DENIED
    // Student → mapped Teacher       ALLOWED
    // Student → unrelated Teacher   DENIED
    //
    // Founder/Admin have their permitted access.
    // --------------------------------------------------------

    const allowed = await canChat(
        senderId,
        receiverId
    );


    if (!allowed) {

        throw new Error(
            "You are not allowed to chat with this user."
        );

    }


    // --------------------------------------------------------
    // Create message
    // --------------------------------------------------------

    const createdMessage =
        await MessengerMessage.create({

            sender: senderId,

            receiver: receiverId,

            message: cleanMessage,

            read: false

        });


    // --------------------------------------------------------
    // Return safe message object
    // --------------------------------------------------------

    return {

        id: createdMessage._id,

        sender: createdMessage.sender,

        receiver: createdMessage.receiver,

        message: createdMessage.message,

        read: createdMessage.read,

        readAt: createdMessage.readAt,

        createdAt: createdMessage.createdAt

    };

}


// ============================================================
// GET CONVERSATION
// ============================================================

async function getConversation(
    userId,
    otherUserId,
    options = {}
) {

    validateUserId(userId, "User ID");

    validateUserId(otherUserId, "Other user ID");


    // --------------------------------------------------------
    // Backend permission check
    // --------------------------------------------------------

    const allowed = await canChat(
        userId,
        otherUserId
    );


    if (!allowed) {

        throw new Error(
            "You are not allowed to access this conversation."
        );

    }


    // --------------------------------------------------------
    // Pagination
    // --------------------------------------------------------

    const limit = Math.min(

        Math.max(
            Number(options.limit) || 50,
            1
        ),

        100

    );


    const before = options.before
        ? new Date(options.before)
        : null;


    // --------------------------------------------------------
    // Build query
    // --------------------------------------------------------

    const query = {

        $or: [

            {
                sender: userId,
                receiver: otherUserId
            },

            {
                sender: otherUserId,
                receiver: userId
            }

        ]

    };


    // --------------------------------------------------------
    // Optional older-message cursor
    // --------------------------------------------------------

    if (
        before &&
        !Number.isNaN(before.getTime())
    ) {

        query.createdAt = {
            $lt: before
        };

    }


    // --------------------------------------------------------
    // Get messages
    // --------------------------------------------------------

    const messages =
        await MessengerMessage
            .find(query)
            .sort({
                createdAt: -1
            })
            .limit(limit)
            .lean();


    // --------------------------------------------------------
    // Return chronological order
    // --------------------------------------------------------

    messages.reverse();


    return messages.map(
        (item) => ({

            id: item._id,

            sender: item.sender,

            receiver: item.receiver,

            message: item.message,

            read: item.read,

            readAt: item.readAt,

            createdAt: item.createdAt

        })
    );

}


// ============================================================
// MARK MESSAGE AS READ
// ============================================================

async function markMessageAsRead(
    userId,
    messageId
) {

    validateUserId(userId, "User ID");

    validateUserId(messageId, "Message ID");


    // --------------------------------------------------------
    // Only the RECEIVER can mark a message as read.
    // --------------------------------------------------------

    const message =
        await MessengerMessage.findById(
            messageId
        );


    if (!message) {

        throw new Error(
            "Message not found."
        );

    }


    // --------------------------------------------------------
    // Security check
    // --------------------------------------------------------

    if (
        String(message.receiver) !==
        String(userId)
    ) {

        throw new Error(
            "You are not allowed to mark this message as read."
        );

    }


    // --------------------------------------------------------
    // Already read
    // --------------------------------------------------------

    if (message.read) {

        return {

            id: message._id,

            read: true,

            readAt: message.readAt

        };

    }


    // --------------------------------------------------------
    // Mark read
    // --------------------------------------------------------

    message.read = true;

    message.readAt = new Date();


    await message.save();


    return {

        id: message._id,

        read: true,

        readAt: message.readAt

    };

}


// ============================================================
// MARK ALL MESSAGES IN A CONVERSATION AS READ
// ============================================================

async function markConversationAsRead(
    userId,
    otherUserId
) {

    validateUserId(userId, "User ID");

    validateUserId(otherUserId, "Other user ID");


    // --------------------------------------------------------
    // Permission check
    // --------------------------------------------------------

    const allowed = await canChat(
        userId,
        otherUserId
    );


    if (!allowed) {

        throw new Error(
            "You are not allowed to access this conversation."
        );

    }


    // --------------------------------------------------------
    // Mark only messages RECEIVED by this user.
    // --------------------------------------------------------

    const result =
        await MessengerMessage.updateMany(

            {

                sender: otherUserId,

                receiver: userId,

                read: false

            },

            {

                $set: {

                    read: true,

                    readAt: new Date()

                }

            }

        );


    return {

        modifiedCount:
            result.modifiedCount

    };

}


// ============================================================
// GET UNREAD COUNT
// ============================================================

async function getUnreadCount(userId) {

    validateUserId(userId, "User ID");


    const count =
        await MessengerMessage.countDocuments({

            receiver: userId,

            read: false

        });


    return count;

}


// ============================================================
// GET UNREAD COUNT FOR ONE CONVERSATION
// ============================================================

async function getConversationUnreadCount(
    userId,
    otherUserId
) {

    validateUserId(userId, "User ID");

    validateUserId(otherUserId, "Other user ID");


    const allowed = await canChat(
        userId,
        otherUserId
    );


    if (!allowed) {

        throw new Error(
            "You are not allowed to access this conversation."
        );

    }


    const count =
        await MessengerMessage.countDocuments({

            sender: otherUserId,

            receiver: userId,

            read: false

        });


    return count;

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    sendMessage,

    getConversation,

    markMessageAsRead,

    markConversationAsRead,

    getUnreadCount,

    getConversationUnreadCount

};