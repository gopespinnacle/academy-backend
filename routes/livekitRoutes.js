const express = require("express");
const router = express.Router();

const {
    AccessToken
} = require("livekit-server-sdk");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


/*
============================================================
GOPES PINNACLE ACADEMY
LIVEKIT TOKEN ROUTE
============================================================

This route generates a temporary LiveKit access token.

IMPORTANT:

The LiveKit API secret NEVER goes to the browser.

Browser
   ↓
Academy JWT
   ↓
This route
   ↓
LiveKit token
   ↓
LiveKit

============================================================
*/


router.post(
    "/token",

    protect,

    authorize(
        "founder",
        "teacher",
        "student"
    ),

    async (req, res) => {

        try {

            /*
            ==================================================
            USER
            ==================================================
            */

            const user =
                req.user;


            /*
            ==================================================
            REQUEST
            ==================================================
            */

            const {
                roomName
            } = req.body;


            if (!roomName) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Room name is required."

                });

            }


            /*
            ==================================================
            LIVEKIT ENVIRONMENT
            ==================================================
            */

            const apiKey =
                process.env.LIVEKIT_API_KEY;

            const apiSecret =
                process.env.LIVEKIT_API_SECRET;


            if (
                !apiKey ||
                !apiSecret
            ) {

                console.error(
                    "LIVEKIT API credentials are missing."
                );


                return res.status(500).json({

                    success: false,

                    message:
                        "LiveKit server configuration is missing."

                });

            }


            /*
            ==================================================
            PARTICIPANT IDENTITY
            ==================================================

            IMPORTANT:

            Use Academy User ID.

            This prevents duplicate identities when the
            same user reconnects.
            ==================================================
            */

            const identity =
                String(user._id);


            /*
            ==================================================
            PARTICIPANT NAME
            ==================================================
            */

            const name =
                user.name ||
                "Academy User";


            /*
            ==================================================
            TOKEN
            ==================================================
            */

            const token =
                new AccessToken(
                    apiKey,
                    apiSecret,
                    {

                        identity,

                        name,

                        ttl:
                            "2h",

                        metadata:
                            JSON.stringify({

                                userId:
                                    identity,

                                role:
                                    user.role,

                                name

                            })

                    }
                );


            /*
            ==================================================
            ROOM PERMISSIONS
            ==================================================
            */

            token.addGrant({

                roomJoin:
                    true,

                room:
                    roomName,

                canPublish:
                    true,

                canSubscribe:
                    true,

                canPublishData:
                    true

            });


            /*
            ==================================================
            GENERATE JWT
            ==================================================
            */

            const jwt =
                await token.toJwt();


            /*
            ==================================================
            RESPONSE
            ==================================================
            */

            res.json({

                success: true,

                token: jwt,

                roomName,

                identity,

                name,

                role:
                    user.role

            });

        }

        catch (error) {

            console.error(
                "LIVEKIT TOKEN ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to create LiveKit token."

            });

        }

    }
);



/*
============================================================
GPA AUDIO CALL — LIVEKIT FALLBACK TOKEN
============================================================

Only participants in the specified active audio call
can obtain a token for its LiveKit room.

The existing /token route remains unchanged.
============================================================
*/

const gpaAudioCallSocket =
    require("../socket/gpaAudioCallSocket");


router.post(
    "/audio-token",
    protect,
    authorize("founder", "teacher", "student"),
    async (req, res) => {
        try {
            const user = req.user;
            const { callId } = req.body;

            if (!callId) {
                return res.status(400).json({
                    success: false,
                    message: "Audio call ID is required."
                });
            }

            /*
             * Verify that this user belongs to the active call.
             * The room name is generated by the server, not
             * accepted from the browser.
             */
            const callInfo =
                gpaAudioCallSocket.getActiveCallForUser(
                    callId,
                    String(user._id)
                );

            if (!callInfo) {
                return res.status(403).json({
                    success: false,
                    message:
                        "You are not a participant in this active audio call."
                });
            }

            const apiKey =
                process.env.LIVEKIT_API_KEY;

            const apiSecret =
                process.env.LIVEKIT_API_SECRET;

            const livekitUrl =
                process.env.LIVEKIT_URL;

            if (!apiKey || !apiSecret || !livekitUrl) {
                console.error(
                    "LiveKit audio fallback configuration is missing."
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "LiveKit audio fallback is not configured."
                });
            }

            const identity = String(user._id);
            const name = user.name || "Academy User";

            const token = new AccessToken(
                apiKey,
                apiSecret,
                {
                    identity,
                    name,
                    ttl: "2h",
                    metadata: JSON.stringify({
                        userId: identity,
                        role: user.role,
                        name,
                        callId: String(callInfo.callId)
                    })
                }
            );

            token.addGrant({
                roomJoin: true,
                room: callInfo.roomName,
                canPublish: true,
                canSubscribe: true,
                canPublishData: false
            });

            const jwt = await token.toJwt();

            return res.json({
                success: true,
                token: jwt,
                roomName: callInfo.roomName,
                identity,
                name,
                role: user.role,
                livekitUrl
            });

        } catch (error) {
            console.error(
                "GPA AUDIO CALL LIVEKIT TOKEN ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to create the audio fallback token."
            });
        }
    }
);



/*
============================================================
GPA AUDIO CALL — LIVEKIT FALLBACK TOKEN
============================================================
*/

const gpaAudioCallSocket =
    require("../socket/gpaAudioCallSocket");

router.post(
    "/audio-token",
    protect,
    authorize("founder", "teacher", "student"),
    async (req, res) => {
        try {
            const user = req.user;
            const { callId } = req.body;

            if (!callId) {
                return res.status(400).json({
                    success: false,
                    message: "Audio call ID is required."
                });
            }

            const callInfo =
                gpaAudioCallSocket.getActiveCallForUser(
                    callId,
                    String(user._id)
                );

            if (!callInfo) {
                return res.status(403).json({
                    success: false,
                    message: "You are not a participant in this active audio call."
                });
            }

            const apiKey = process.env.LIVEKIT_API_KEY;
            const apiSecret = process.env.LIVEKIT_API_SECRET;
            const livekitUrl = process.env.LIVEKIT_URL;

            if (!apiKey || !apiSecret || !livekitUrl) {
                console.error("LiveKit audio fallback configuration is missing.");

                return res.status(500).json({
                    success: false,
                    message: "LiveKit audio fallback is not configured."
                });
            }

            const identity = String(user._id);
            const name = user.name || "Academy User";

            const token = new AccessToken(
                apiKey,
                apiSecret,
                {
                    identity,
                    name,
                    ttl: "2h",
                    metadata: JSON.stringify({
                        userId: identity,
                        role: user.role,
                        name,
                        callId: String(callInfo.callId)
                    })
                }
            );

            token.addGrant({
                roomJoin: true,
                room: callInfo.roomName,
                canPublish: true,
                canSubscribe: true,
                canPublishData: false
            });

            const jwt = await token.toJwt();

            return res.json({
                success: true,
                token: jwt,
                roomName: callInfo.roomName,
                identity,
                name,
                role: user.role,
                livekitUrl
            });

        } catch (error) {
            console.error("GPA AUDIO CALL LIVEKIT TOKEN ERROR:", error);

            return res.status(500).json({
                success: false,
                message: "Failed to create the audio fallback token."
            });
        }
    }
);

module.exports = router;

