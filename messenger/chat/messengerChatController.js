// ============================================================
// GPA MESSENGER - CHAT CONTROLLER
// ============================================================
// Purpose:
// - Handle HTTP requests for Messenger chat
// - Read authenticated user from req.user
// - Call messengerChatService
// - Return safe JSON responses
//
// IMPORTANT:
// - No database logic here
// - No permission logic here
// - No Socket.IO logic here
// - Business logic stays in messengerChatService.js
// ============================================================

const MessengerChatService = require("./messengerChatService");


// ============================================================
// HELPER - ERROR STATUS
// ============================================================

function getErrorStatus(error) {

    const message = error?.message || "";

    if (
        message.includes("not allowed") ||
        message.includes("not authorized")
    ) {

        return 403;

    }

    if (
        message.includes("required") ||
        message.includes("cannot be empty") ||
        message.includes("cannot exceed")
    ) {

        return 400;

    }

    if (
        message.includes("not found")
    ) {

        return 404;

    }

    return 500;

}


// ============================================================
// SEND MESSAGE
// ============================================================

async function sendMessage(req, res) {

    try {

        const senderId = req.user?._id;

        const {
            receiverId,
            message
        } = req.body;


        const result =
            await MessengerChatService.sendMessage(
                senderId,
                receiverId,
                message
            );


        return res.status(201).json({

            success: true,

            message: result

        });

    } catch (error) {

        console.error(
            "Messenger Chat Controller - sendMessage:",
            error
        );


        return res.status(
            getErrorStatus(error)
        ).json({

            success: false,

            message: error.message

        });

    }

}


// ============================================================
// GET CONVERSATION
// ============================================================

async function getConversation(req, res) {

    try {

        const userId = req.user?._id;

        const {
            userId: otherUserId
        } = req.params;


        const {
            limit,
            before
        } = req.query;


        const messages =
            await MessengerChatService.getConversation(

                userId,

                otherUserId,

                {
                    limit,

                    before

                }

            );


        return res.status(200).json({

            success: true,

            messages

        });

    } catch (error) {

        console.error(
            "Messenger Chat Controller - getConversation:",
            error
        );


        return res.status(
            getErrorStatus(error)
        ).json({

            success: false,

            message: error.message

        });

    }

}


// ============================================================
// MARK ONE MESSAGE AS READ
// ============================================================

async function markMessageAsRead(req, res) {

    try {

        const userId = req.user?._id;

        const {
            messageId
        } = req.params;


        const result =
            await MessengerChatService.markMessageAsRead(

                userId,

                messageId

            );


        return res.status(200).json({

            success: true,

            message: result

        });

    } catch (error) {

        console.error(
            "Messenger Chat Controller - markMessageAsRead:",
            error
        );


        return res.status(
            getErrorStatus(error)
        ).json({

            success: false,

            message: error.message

        });

    }

}


// ============================================================
// MARK CONVERSATION AS READ
// ============================================================

async function markConversationAsRead(req, res) {

    try {

        const userId = req.user?._id;

        const {
            userId: otherUserId
        } = req.params;


        const result =
            await MessengerChatService.markConversationAsRead(

                userId,

                otherUserId

            );


        return res.status(200).json({

            success: true,

            result

        });

    } catch (error) {

        console.error(
            "Messenger Chat Controller - markConversationAsRead:",
            error
        );


        return res.status(
            getErrorStatus(error)
        ).json({

            success: false,

            message: error.message

        });

    }

}


// ============================================================
// GET TOTAL UNREAD COUNT
// ============================================================

async function getUnreadCount(req, res) {

    try {

        const userId = req.user?._id;


        const count =
            await MessengerChatService.getUnreadCount(
                userId
            );


        return res.status(200).json({

            success: true,

            unreadCount: count

        });

    } catch (error) {

        console.error(
            "Messenger Chat Controller - getUnreadCount:",
            error
        );


        return res.status(500).json({

            success: false,

            message: error.message

        });

    }

}


// ============================================================
// GET CONVERSATION UNREAD COUNT
// ============================================================

async function getConversationUnreadCount(req, res) {

    try {

        const userId = req.user?._id;

        const {
            userId: otherUserId
        } = req.params;


        const count =
            await MessengerChatService
                .getConversationUnreadCount(

                    userId,

                    otherUserId

                );


        return res.status(200).json({

            success: true,

            unreadCount: count

        });

    } catch (error) {

        console.error(
            "Messenger Chat Controller - getConversationUnreadCount:",
            error
        );


        return res.status(
            getErrorStatus(error)
        ).json({

            success: false,

            message: error.message

        });

    }

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