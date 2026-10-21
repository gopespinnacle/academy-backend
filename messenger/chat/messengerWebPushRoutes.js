const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const MessengerWebPushSubscription = require("./messengerWebPushSubscription");
const { getPublicKey } = require("../../services/messengerWebPushService");

const router = express.Router();

async function authenticate(req, res, next) {
    try {
        const header = req.headers.authorization || "";
        const token = header.startsWith("Bearer ") ? header.slice(7) : "";
        if (!token) return res.status(401).json({ success: false, message: "Login token is required." });
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const id = decoded && (decoded.id || decoded._id || decoded.userId || decoded.sub);
        if (!id) return res.status(401).json({ success: false, message: "Invalid login token." });
        const user = await User.findById(id).select("_id role");
        if (!user) return res.status(401).json({ success: false, message: "User account was not found." });
        req.authenticatedUser = user;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Authentication failed." });
    }
}

router.get("/vapid-public-key", (req, res) => {
    const key = getPublicKey();
    if (!key) return res.status(503).json({ success: false, message: "Web Push is not configured on the server." });
    return res.json({ success: true, publicKey: key });
});

router.post("/subscribe", authenticate, async (req, res) => {
    try {
        const subscription = req.body && req.body.subscription;
        if (!subscription || typeof subscription.endpoint !== "string" ||
            !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            return res.status(400).json({ success: false, message: "A valid browser push subscription is required." });
        }
        await MessengerWebPushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                $set: {
                    userId: req.authenticatedUser._id,
                    endpoint: subscription.endpoint,
                    keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
                    expirationTime: subscription.expirationTime || null,
                    userAgent: String(req.headers["user-agent"] || "").slice(0, 500),
                    updatedAt: new Date()
                },
                $setOnInsert: { createdAt: new Date() }
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.json({ success: true, message: "Desktop push notifications enabled." });
    } catch (error) {
        console.error("[GPA WEB PUSH] Could not save subscription:", error.message);
        return res.status(500).json({ success: false, message: "Could not save notification subscription." });
    }
});

router.delete("/subscribe", authenticate, async (req, res) => {
    try {
        const endpoint = req.body && req.body.endpoint;
        if (!endpoint || typeof endpoint !== "string") {
            return res.status(400).json({ success: false, message: "Subscription endpoint is required." });
        }
        await MessengerWebPushSubscription.deleteOne({ endpoint, userId: req.authenticatedUser._id });
        return res.json({ success: true });
    } catch (error) {
        console.error("[GPA WEB PUSH] Could not remove subscription:", error.message);
        return res.status(500).json({ success: false, message: "Could not remove notification subscription." });
    }
});

module.exports = router;
