// ==========================================
// GPA PUSH NOTIFICATION SERVICE
// NEW SYSTEM
// ==========================================

const { messaging } =
    require("../firebaseAdmin");

const PushToken =
    require("../models/PushToken");


// =========================================================
// SEND PUSH NOTIFICATION
// =========================================================

async function sendPushNotification({

    receiverIds,

    senderName,

    messageText,

    conversationId,

    messageId,

    senderId

}) {

    try {

        // -------------------------------------------------
        // VALIDATE RECEIVERS
        // -------------------------------------------------

        if (
            !receiverIds ||
            !Array.isArray(receiverIds) ||
            receiverIds.length === 0
        ) {

            console.log(
                "GPA PUSH: No receivers supplied."
            );

            return;

        }


        // -------------------------------------------------
        // FIND ACTIVE PUSH TOKENS
        // -------------------------------------------------

        const tokenRecords =
            await PushToken.find({

                user: {
                    $in: receiverIds
                },

                isActive: true

            })
            .populate(
                "user",
                "_id name role"
            )
            .select(
                "token user platform deviceId"
            );


        if (!tokenRecords.length) {

            console.log(
                "GPA PUSH: No active push tokens found.",
                receiverIds
            );

            return;

        }


        // -------------------------------------------------
        // REMOVE DUPLICATE TOKENS
        // -------------------------------------------------

        const uniqueRecords = [];

        const seenTokens =
            new Set();


        for (
            const record
            of tokenRecords
        ) {

            if (
                !record.token ||
                seenTokens.has(
                    record.token
                )
            ) {

                continue;

            }


            seenTokens.add(
                record.token
            );


            uniqueRecords.push(
                record
            );

        }


        const tokens =
            uniqueRecords.map(
                record =>
                    record.token
            );


        if (!tokens.length) {

            return;

        }


        // -------------------------------------------------
        // NOTIFICATION CONTENT
        // -------------------------------------------------

        const title =
            `${senderName} - GPA Messenger`;


        const body =
            messageText &&
            messageText.trim()
                ? messageText.trim()
                : "You have a new message.";


        // -------------------------------------------------
        // PUSH DATA
        // -------------------------------------------------

        const data = {

            type:
                "gpa_message",

            conversationId:
                String(
                    conversationId
                ),

            messageId:
                String(
                    messageId
                ),

            senderId:
                String(
                    senderId
                ),

            senderName:
                String(
                    senderName
                ),

            url:
                "https://www.gopespinnacle.com/gpa-messenger.html"

        };


        // -------------------------------------------------
        // SEND PUSH
        // -------------------------------------------------

        const response =
    await messaging
        .sendEachForMulticast({

                    tokens:

                        tokens,

                    notification: {

                        title:
                            title,

                        body:
                            body

                    },

                    data:

                        data,

                    android: {

                        priority:
                            "high",

                        notification: {

                            channelId:
                                "gpa_messenger",

                            sound:
                                "default"

                        }

                    },

                    webpush: {

                        headers: {

                            Urgency:
                                "high"

                        },

                        notification: {

                            title:
                                title,

                            body:
                                body,

                            icon:
                                "/favicon.ico",

                            badge:
                                "/favicon.ico",

                            tag:
                                "gpa-message-" +
                                String(
                                    messageId
                                ),

                            renotify:
                                true

                        },

                        fcmOptions: {

                            link:
                                "https://www.gopespinnacle.com/gpa-messenger.html"

                        }

                    }

                });


        // -------------------------------------------------
        // RESULT
        // -------------------------------------------------

        console.log(
            "=========================================="
        );

        console.log(
            "GPA PUSH RESULT"
        );

        console.log(
            "Successful:",
            response.successCount
        );

        console.log(
            "Failed:",
            response.failureCount
        );

        console.log(
            "=========================================="
        );


        // -------------------------------------------------
        // INVALID TOKEN CLEANUP
        // -------------------------------------------------

        for (
            let index = 0;
            index < response.responses.length;
            index++
        ) {

            const result =
                response.responses[index];


            if (
                result.success
            ) {

                console.log(
                    "✅ GPA PUSH SENT:",
                    uniqueRecords[index]
                        ?.user
                        ?.name ||
                    "Unknown user"
                );

            }

            else {

                console.error(
                    "❌ GPA PUSH FAILED:",
                    {
                        user:
                            uniqueRecords[index]
                                ?.user
                                ?.name,

                        platform:
                            uniqueRecords[index]
                                ?.platform,

                        errorCode:
                            result.error
                                ?.code,

                        errorMessage:
                            result.error
                                ?.message
                    }
                );


                // -----------------------------------------
                // DISABLE INVALID TOKEN
                // -----------------------------------------

                const errorCode =
                    result.error
                        ?.code || "";


                if (
                    errorCode ===
                        "messaging/registration-token-not-registered" ||

                    errorCode ===
                        "messaging/invalid-registration-token"
                ) {

                    await PushToken.updateOne(

                        {
                            _id:
                                uniqueRecords[index]
                                    ._id
                        },

                        {
                            $set: {
                                isActive:
                                    false
                            }
                        }

                    );

                }

            }

        }

    }
    catch (error) {

        console.error(
            "❌ GPA PUSH SERVICE ERROR:",
            error
        );

    }

}


module.exports =
    sendPushNotification;