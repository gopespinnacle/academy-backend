
const express = require("express");
const router = express.Router();

const MessengerWebPushSubscription = require(
    "./messengerWebPushSubscription"
);

const { getPublicKey } = require(
    "../../services/messengerWebPushService"
);

const { protect } = require(
    "../../middleware/authMiddleware"
);

// ========================================================
// GET VAPID PUBLIC KEY
// ========================================================
router.get("/vapid-public-key", (req, res) => {
    const publicKey = getPublicKey();

    if (!publicKey) {
        return res.status(503).json({
            success: false,
            message: "Web Push VAPID public key is not configured."
        });
    }

    return res.json({
        success: true,
        publicKey
    });
});

// ========================================================
// REGISTER / UPDATE BROWSER PUSH SUBSCRIPTION
// ========================================================
router.post("/subscribe", protect, async (req, res) => {
    try {
        const subscription = req.body?.subscription;

        if (
            !subscription ||
            !subscription.endpoint ||
            !subscription.keys?.p256dh ||
            !subscription.keys?.auth
        ) {
            return res.status(400).json({
                success: false,
                message: "A valid browser push subscription is required."
            });
        }

        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user was not found."
            });
        }

        await MessengerWebPushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                $set: {
                    userId,
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.keys.p256dh,
                        auth: subscription.keys.auth
                    },
                    expirationTime: subscription.expirationTime ?? null,
                    userAgent: req.get("user-agent") || "",
                    updatedAt: new Date()
                },
                $setOnInsert: {
                    createdAt: new Date()
                }
            },
            {
                upsert: true,
                new: true,
                runValidators: true
            }
        );

        return res.json({
            success: true,
            message: "Browser push subscription saved successfully."
        });
    } catch (error) {
        console.error(
            "[GPA WEB PUSH] Subscription registration failed:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Could not save the browser push subscription."
        });
    }
});

module.exports = router;
