// ============================================================
// GPA MESSENGER - USER ROUTES
// ============================================================
// Purpose:
// - Provide Messenger user-list API
// - Protect the endpoint with existing Academy authentication
//
// Endpoint:
// GET /api/messenger/users
// ============================================================

const express = require("express");

const router = express.Router();

const {
    protect
} = require("../../middleware/authMiddleware");

const MessengerUserController =
    require("./messengerUserController");


// ============================================================
// GET MESSENGER USERS
// ============================================================

router.get(
    "/",
    protect,
    MessengerUserController.getMessengerUsers
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;