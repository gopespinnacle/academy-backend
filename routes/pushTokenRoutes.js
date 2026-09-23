const express = require("express");

const router = express.Router();

const PushToken = require("../models/PushToken");

const messengerAuth =
    require("../middleware/messengerAuth");


// =========================================================
// REGISTER / REFRESH PUSH TOKEN
// =========================================================

router.post(
    "/register",
    messengerAuth,
    async (req, res) => {

        try {

            const {
                token,
                platform,
                deviceId
            } = req.body;


            // -------------------------------------------------
            // VALIDATE TOKEN
            // -------------------------------------------------

            if (!token || typeof token !== "string") {

                return res.status(400).json({
                    success: false,
                    message: "Push token is required."
                });

            }


            // -------------------------------------------------
            // VALIDATE PLATFORM
            // -------------------------------------------------

            if (
                !["web", "android"].includes(platform)
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid push platform."
                });

            }


            // -------------------------------------------------
            // FIND TOKEN
            // -------------------------------------------------

            const existingToken =
                await PushToken.findOne({
                    token: token
                });


            // -------------------------------------------------
            // EXISTING TOKEN
            // -------------------------------------------------

            if (existingToken) {

                existingToken.user =
                    req.user._id;

                existingToken.platform =
                    platform;

                existingToken.deviceId =
                    deviceId || "";

                existingToken.lastSeenAt =
                    new Date();

                existingToken.isActive =
                    true;

                await existingToken.save();

            }


            // -------------------------------------------------
            // NEW TOKEN
            // -------------------------------------------------

            else {

                await PushToken.create({

                    user:
                        req.user._id,

                    token:
                        token,

                    platform:
                        platform,

                    deviceId:
                        deviceId || "",

                    lastSeenAt:
                        new Date(),

                    isActive:
                        true

                });

            }


            // -------------------------------------------------
            // SUCCESS
            // -------------------------------------------------

            return res.json({

                success: true,

                message:
                    "Push token registered successfully."

            });

        }
        catch (error) {

            console.error(
                "PUSH TOKEN REGISTRATION ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    "Unable to register push token."

            });

        }

    }
);


module.exports = router;