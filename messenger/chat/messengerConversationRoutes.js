/**
 * ============================================================
 * GPA MESSENGER
 * MODULE 5
 * STEP 8
 * CONVERSATION API ROUTES
 * ============================================================
 *
 * PURPOSE:
 *
 * Create or load a Messenger conversation between
 * the logged-in Founder and a selected Academy user.
 *
 * ============================================================
 */

const express = require("express");
const jwt = require("jsonwebtoken");

const MessengerConversationService =
    require("./messengerConversationService");

const router = express.Router();


/**
 * ============================================================
 * CREATE / GET CONVERSATION
 * ============================================================
 *
 * POST
 * /api/messenger/conversation
 *
 * Body:
 *
 * {
 *     "receiverId": "USER_ID"
 * }
 *
 * ============================================================
 */

router.post(
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
            // VERIFY TOKEN
            // =================================================

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );


            // =================================================
            // ONLY FOUNDER CAN START CONVERSATION
            // =================================================

            // ============================================================
// MESSENGER CONVERSATION PERMISSION
// ============================================================
//
// Allowed Messenger users:
// Founder
// Teacher
// Student
// Parent
// Admin
//
// The actual conversation rules will be checked below.
// ============================================================

const allowedRoles = [
    "founder",
    "teacher",
    "student",
    "parent",
    "admin"
];

if (
    !req.user ||
    !allowedRoles.includes(req.user.role)
) {

    return res.status(403).json({

        success: false,

        message:
            "You are not allowed to start Messenger conversations."

    });

}


            // =================================================
            // GET SELECTED USER
            // =================================================

            const receiverId =
                req.body.receiverId;


            if (!receiverId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Receiver ID is required."

                });

            }


            // =================================================
            // FOUNDER ID FROM EXISTING TOKEN
            // =================================================

            const founderId =
                decoded.id;


            // =================================================
            // GET OR CREATE CONVERSATION
            // =================================================

            const conversation =
                await MessengerConversationService
                    .getOrCreateConversation(
                        founderId,
                        receiverId
                    );


            // =================================================
            // RETURN CONVERSATION
            // =================================================

            return res.status(200).json({

                success: true,

                conversation: {

                    _id:
                        conversation._id,

                    participants:
                        conversation.participants,

                    conversationKey:
                        conversation.conversationKey,

                    lastMessageAt:
                        conversation.lastMessageAt,

                    status:
                        conversation.status

                }

            });

        } catch (error) {

            console.error(
                "[GPA MESSENGER CONVERSATION API] " +
                "Failed:",
                error
            );


            return res.status(401).json({

                success: false,

                message:
                    "Unable to create or load conversation."

            });

        }

    }
);


module.exports = router;