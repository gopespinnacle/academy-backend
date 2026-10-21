const webpush = require("web-push");
const MessengerWebPushSubscription = require("../messenger/chat/messengerWebPushSubscription");

let configured = false;
function configure() {
    if (configured) return true;
    const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
    const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
    const subject = process.env.WEB_PUSH_VAPID_SUBJECT || "mailto:gopestalks@gmail.com";
    if (!publicKey || !privateKey) {
        console.warn("[GPA WEB PUSH] VAPID keys are not configured; Web Push is disabled.");
        return false;
    }
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
    return true;
}

function getPublicKey() {
    return process.env.WEB_PUSH_VAPID_PUBLIC_KEY || "";
}

async function sendMessengerWebPush({ userId, title, body, data }) {
    if (!configure()) return { sent: 0, disabled: true };
    const subscriptions = await MessengerWebPushSubscription.find({ userId }).lean();
    let sent = 0;
    await Promise.all(subscriptions.map(async (record) => {
        try {
            await webpush.sendNotification({
                endpoint: record.endpoint,
                keys: record.keys,
                expirationTime: record.expirationTime || null
            }, JSON.stringify({
                title: title || "Gopes Pinnacle Academy",
                body: body || "You have a new message",
                icon: "/images/logo.png",
                badge: "/images/logo.png",
                tag: data && data.messageId ? `gpa-message-${data.messageId}` : "gpa-messenger-message",
                data: data || { url: "/messenger/messenger.html" }
            }), { TTL: 60 * 60 * 24 });
            sent += 1;
        } catch (error) {
            const status = error.statusCode;
            if (status === 404 || status === 410) {
                await MessengerWebPushSubscription.deleteOne({ _id: record._id });
            } else {
                console.error("[GPA WEB PUSH] Delivery failed:", status || "unknown", error.message);
            }
        }
    }));
    return { sent, disabled: false };
}

module.exports = { getPublicKey, sendMessengerWebPush };
