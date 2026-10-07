/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 5
 * STEP 2
 * CONTACTS API ROUTES
 * ============================================================
 *
 * PURPOSE:
 *
 * Provide the Founder with the Messenger contact list
 * from the existing User collection.
 *
 * ============================================================
 */

const express = require("express");

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
 * For now, the Founder ID is received through the query:
 *
 * /api/messenger/contacts?founderId=XXXXXXXX
 *
 * Authentication will be connected separately.
 *
 * ============================================================
 */

router.get(
    "/",
    async (req, res) => {

        try {

            const founderId =
                req.query.founderId;

            if (!founderId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Founder ID is required."
                });
            }

            const contacts =
                await MessengerContacts
                    .getFounderContacts(
                        founderId
                    );

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

            return res.status(500).json({

                success: false,

                message:
                    "Unable to load Messenger contacts."

            });
        }
    }
);

module.exports = router;