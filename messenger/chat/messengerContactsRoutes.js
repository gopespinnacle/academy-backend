/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 5
 * STEP 4
 * CONTACTS API
 * ============================================================
 */

const express = require("express");
const jwt = require("jsonwebtoken");

const MessengerContacts =
    require("./messengerContacts");

const router = express.Router();

/**
 * ============================================================
 * GET FOUNDER CONTACTS
 * ============================================================
 *
 * GET
 * /api/messenger/contacts
 *
 * Uses the existing Academy login token.
 *
 * ============================================================
 */

router.get(
    "/",
    async (req, res) => {

        try {

            // =================================================
            // GET EXISTING LOGIN TOKEN
            // =================================================

            const authHeader =
                req.headers.authorization;

            if (
                !authHeader ||
                !authHeader.startsWith("Bearer ")
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Login token is required."
                });

            }

            const token =
                authHeader.split(" ")[1];

            // =================================================
            // VERIFY EXISTING ACADEMY TOKEN
            // =================================================

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            // =================================================
            // ONLY FOUNDER CAN LOAD THIS CONTACT LIST
            // =================================================

            if (
                !decoded ||
                decoded.role !== "founder"
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Only Founder can access Messenger contacts."
                });

            }

            // =================================================
            // FOUNDER ID COMES FROM TOKEN
            // =================================================

            const founderId =
                decoded.id;

            // =================================================
            // LOAD CONTACTS
            // =================================================

            const contacts =
                await MessengerContacts
                    .getFounderContacts(
                        founderId
                    );

            // =================================================
            // SEND CONTACTS
            // =================================================

            return res.status(200).json({

                success: true,

                count:
                    contacts.length,

                contacts:
                    contacts

            });

        } catch (error) {

            console.error(
                "[GPA MESSENGER CONTACTS API] " +
                "Failed to load contacts:",
                error
            );

            return res.status(401).json({

                success: false,

                message:
                    "Invalid or expired login token."

            });

        }
    }
);

module.exports = router;