// ============================================================
// GPA MESSENGER - CHAT ROUTES
// ============================================================
// Purpose:
// - Define Messenger Chat API endpoints
// - Protect every route with existing Academy JWT auth
// - Forward requests to messengerChatController.js
//
// IMPORTANT:
// - No database logic here
// - No chat business logic here
// - No Socket.IO logic here
// ============================================================

const express = require("express");

const router = express.Router();


// ============================================================
// EXISTING ACADEMY AUTHENTICATION
// ============================================================

const {
    protect
} = require("../../middleware/authMiddleware");


// ============================================================
// CHAT CONTROLLER
// ============================================================

const MessengerChatController =
    require("./messengerChatController");


// ============================================================
// SEND MESSAGE
// ============================================================
//
// POST
// /api/messenger/chat/message
//
// Body:
// {
//     "receiverId": "...",
//     "message": "Hello"
// }
// ============================================================

router.post(
    "/message",
    protect,
    MessengerChatController.sendMessage
);


// ============================================================
// GET CONVERSATION
// ============================================================
//
// GET
// /api/messenger/chat/conversation/:userId
//
// Query:
// ?limit=50
// ?before=ISO_DATE
// ============================================================

router.get(
    "/conversation/:userId",
    protect,
    MessengerChatController.getConversation
);


// ============================================================
// MARK ONE MESSAGE AS READ
// ============================================================
//
// PATCH
// /api/messenger/chat/message/:messageId/read
// ============================================================

router.patch(
    "/message/:messageId/read",
    protect,
    MessengerChatController.markMessageAsRead
);


// ============================================================
// MARK ENTIRE CONVERSATION AS READ
// ============================================================
//
// PATCH
// /api/messenger/chat/conversation/:userId/read
// ============================================================

router.patch(
    "/conversation/:userId/read",
    protect,
    MessengerChatController.markConversationAsRead
);


// ============================================================
// GET TOTAL UNREAD COUNT
// ============================================================
//
// GET
// /api/messenger/chat/unread
// ============================================================

router.get(
    "/unread",
    protect,
    MessengerChatController.getUnreadCount
);


// ============================================================
// GET UNREAD COUNT FOR ONE CONVERSATION
// ============================================================
//
// GET
// /api/messenger/chat/conversation/:userId/unread
// ============================================================

router.get(
    "/conversation/:userId/unread",
    protect,
    MessengerChatController.getConversationUnreadCount
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;