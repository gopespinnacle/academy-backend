const { initializeApp, getApps, cert } =
    require("firebase-admin/app");

const {
    getMessaging
} = require("firebase-admin/messaging");


// =========================================================
// FIREBASE ADMIN INITIALIZATION
// =========================================================

let firebaseApp;

if (getApps().length === 0) {

    firebaseApp = initializeApp({
        credential: cert({
            projectId:
                process.env.FIREBASE_PROJECT_ID,

            clientEmail:
                process.env.FIREBASE_CLIENT_EMAIL,

            privateKey:
                process.env.FIREBASE_PRIVATE_KEY
                    .replace(/\\n/g, "\n")
        })
    });

} else {

    firebaseApp = getApps()[0];

}


console.log(
    "Firebase Admin SDK initialized."
);


// =========================================================
// EXPORT FIREBASE MESSAGING
// =========================================================

module.exports = {
    messaging: getMessaging(firebaseApp)
};