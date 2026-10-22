
const admin = require("firebase-admin");

let firebaseInitialized = false;

function initializeFirebaseAdmin() {
    if (admin.apps.length > 0) {
        firebaseInitialized = true;
        return true;
    }

    if (firebaseInitialized) {
        return true;
    }

    try {
        const serviceAccountJson =
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

            console.log("[GPA FCM DEBUG] Service account variable type:", typeof serviceAccountJson);
console.log("[GPA FCM DEBUG] Service account variable length:",
    typeof serviceAccountJson === "string" ? serviceAccountJson.length : "not a string");

        if (!serviceAccountJson) {
            console.error(
                "[GPA FCM] ERROR: FIREBASE_SERVICE_ACCOUNT_JSON is missing."
            );
            return false;
        }

        let serviceAccount;

        try {
            serviceAccount = JSON.parse(serviceAccountJson);
        } catch (parseError) {
            console.error(
                "[GPA FCM] ERROR: Service account environment variable is not valid JSON:",
                parseError.message
            );
            return false;
        }

        if (
            !serviceAccount ||
            !serviceAccount.project_id ||
            !serviceAccount.client_email ||
            !serviceAccount.private_key
        ) {
            console.error(
                "[GPA FCM] ERROR: Service account JSON is missing project_id, client_email, or private_key."
            );
            return false;
        }

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id
        });

        firebaseInitialized = true;

        console.log(
            "[GPA FCM] Firebase Admin initialized successfully for project:",
            serviceAccount.project_id
        );

        return true;
    } catch (error) {
        console.error(
            "[GPA FCM] INITIALIZATION ERROR:",
            error.stack || error
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
    if (typeof token !== "string" || !token.trim()) {
        return {
            success: false,
            reason: "Missing or invalid FCM token"
        };
    }

    if (!initializeFirebaseAdmin()) {
        return {
            success: false,
            reason: "Firebase Admin initialization failed"
        };
    }

    try {
        const stringData = {};

        for (const [key, value] of Object.entries(data || {})) {
            if (value !== undefined && value !== null) {
                stringData[key] = String(value);
            }
        }

        const message = {
            token: token.trim(),
            notification: {
                title: String(title || "Gopes Pinnacle Academy"),
                body: String(body || "You have a new message.")
            },
            data: stringData
        };

        const messageId = await admin.messaging().send(message);

        console.log(
            "[GPA FCM] Notification sent successfully:",
            messageId
        );

        return {
            success: true,
            messageId
        };
    } catch (error) {
        console.error(
            "[GPA FCM] SEND ERROR:",
            error.stack || error
        );

        return {
            success: false,
            reason: error.code || error.message || "Unknown FCM error"
        };
    }
}

module.exports = {
    initializeFirebaseAdmin,
    sendPushNotification
};
