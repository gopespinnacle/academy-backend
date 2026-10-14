const admin = require("firebase-admin");

let firebaseInitialized = false;

function initializeFirebaseAdmin() {
    if (firebaseInitialized || admin.apps.length > 0) {
        firebaseInitialized = true;
        return true;
    }

    try {
        const serviceAccountJson =
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        if (!serviceAccountJson) {
            console.error(
                "FCM ERROR: FIREBASE_SERVICE_ACCOUNT_JSON is missing"
            );
            return false;
        }

        const serviceAccount = JSON.parse(serviceAccountJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });

        firebaseInitialized = true;

        console.log("Firebase Admin initialized successfully");

        return true;
    } catch (error) {
        console.error(
            "FCM INITIALIZATION ERROR:",
            error.message
        );

        return false;
    }
}

async function sendPushNotification({
    token,
    title,
    body,
    data = {}
}) {
    if (!token) {
        return {
            success: false,
            reason: "No FCM token"
        };
    }

    if (!initializeFirebaseAdmin()) {
        return {
            success: false,
            reason: "Firebase Admin is not initialized"
        };
    }

    try {
        const stringData = {};

        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null) {
                stringData[key] = String(value);
            }
        }

        const messageId = await admin.messaging().send({
            token,
            notification: {
                title,
                body
            },
            data: stringData,
            android: {
                priority: "high",
                notification: {
                    channelId: "gpa_messages"
                }
            }
        });

        console.log("FCM notification sent:", messageId);

        return {
            success: true,
            messageId
        };
    } catch (error) {
        console.error(
            "FCM SEND ERROR:",
            error.code || "",
            error.message
        );

        return {
            success: false,
            reason: error.code || error.message
        };
    }
}

module.exports = {
    initializeFirebaseAdmin,
    sendPushNotification
};