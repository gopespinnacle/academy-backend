
const admin = require("firebase-admin");

let firebaseInitialized = false;


function initializeFirebaseAdmin() {
    try {
        // Check whether Firebase Admin is already initialized.
        if (Array.isArray(admin.apps) && admin.apps.length > 0) {
            firebaseInitialized = true;
            return true;
        }

        const serviceAccountJson =
            process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

        console.log(
            "[GPA FCM DEBUG] Firebase Admin apps:",
            Array.isArray(admin.apps) ? admin.apps.length : "unavailable"
        );

        if (
            typeof serviceAccountJson !== "string" ||
            !serviceAccountJson.trim()
        ) {
            console.error(
                "[GPA FCM] FIREBASE_SERVICE_ACCOUNT_JSON is missing or empty."
            );
            return false;
        }

        let serviceAccount;

        try {
            serviceAccount = JSON.parse(serviceAccountJson);
        } catch (error) {
            console.error(
                "[GPA FCM] Invalid service account JSON:",
                error.message
            );
            return false;
        }

        if (
            !serviceAccount.project_id ||
            !serviceAccount.client_email ||
            !serviceAccount.private_key
        ) {
            console.error(
                "[GPA FCM] Service account is missing required fields."
            );
            return false;
        }

        const { initializeApp, cert, getApps } = require("firebase-admin/app");

if (getApps().length === 0) {
    initializeApp({
        credential: cert({
            projectId: serviceAccount.project_id,
            clientEmail: serviceAccount.client_email,
            privateKey: serviceAccount.private_key.replace(/\\n/g, "\n")
        }),
        projectId: serviceAccount.project_id
    });
}

        firebaseInitialized = true;

        console.log(
            "[GPA FCM] Firebase Admin initialized successfully."
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

        const { getMessaging } = require("firebase-admin/messaging");
const messageId = await getMessaging().send(message);

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
