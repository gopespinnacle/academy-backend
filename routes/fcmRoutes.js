
const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

// Register or update the authenticated user's Android FCM token
router.post("/register-token", protect, async (req, res) => {
    try {
        const { fcmToken } = req.body;

        console.log("[GPA FCM] Token registration request received");

        if (
            typeof fcmToken !== "string" ||
            !fcmToken.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid FCM token is required"
            });
        }

        req.user.fcmToken = fcmToken.trim();
        await req.user.save();

        console.log("[GPA FCM] Token saved successfully");

        return res.status(200).json({
            success: true,
            message: "FCM token registered successfully"
        });

    } catch (error) {
        console.error("FCM TOKEN REGISTRATION ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to register FCM token"
        });
    }
});

// Remove the authenticated user's token when needed
router.delete("/register-token", protect, async (req, res) => {
    try {
        req.user.fcmToken = "";
        await req.user.save();

        return res.status(200).json({
            success: true,
            message: "FCM token removed successfully"
        });

    } catch (error) {
        console.error("FCM TOKEN REMOVAL ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove FCM token"
        });
    }
});

module.exports = router;
