const express = require("express");
const jwt = require("jsonwebtoken");

const User =
    require("../../models/User");

const PeriodAssignment =
    require("../../models/PeriodAssignment");

const MessengerConversationService =
    require("./messengerConversationService");

const router = express.Router();


// ============================================================
// GPA MESSENGER
// STEP 3F
// SECURE CONVERSATION CREATION
// ============================================================


// ============================================================
// CHECK WHETHER TWO USERS ARE ALLOWED TO COMMUNICATE
// ============================================================

async function canUsersCommunicate(
    currentUser,
    receiverUser
) {

    // --------------------------------------------------------
    // BASIC CHECK
    // --------------------------------------------------------

    if (
        !currentUser ||
        !receiverUser
    ) {
        return false;
    }


    // --------------------------------------------------------
    // USER CANNOT MESSAGE THEMSELVES
    // --------------------------------------------------------

    if (
        String(currentUser._id) ===
        String(receiverUser._id)
    ) {
        return false;
    }


    // --------------------------------------------------------
    // FOUNDER
    // Founder can message:
    // Teacher
    // Student
    // Admin
    // --------------------------------------------------------

    if (
        currentUser.role === "founder"
    ) {

        return [
            "teacher",
            "student",
            "admin"
        ].includes(
            receiverUser.role
        );

    }


    // --------------------------------------------------------
    // ADMIN
    // Admin can message:
    // Founder
    // Teacher
    // Student
    // --------------------------------------------------------

    if (
        currentUser.role === "admin"
    ) {

        return [
            "founder",
            "teacher",
            "student"
        ].includes(
            receiverUser.role
        );

    }


    // --------------------------------------------------------
    // TEACHER
    // Teacher can message:
    // Founder
    // Admin
    // Assigned Students
    // --------------------------------------------------------

    if (
        currentUser.role === "teacher"
    ) {

        // Founder / Admin
        if (
            receiverUser.role === "founder" ||
            receiverUser.role === "admin"
        ) {

            return true;

        }


        // Only students assigned to this teacher
        if (
            receiverUser.role === "student"
        ) {

            const assignment =
                await PeriodAssignment.findOne({
                    $or: [
                        {
                            teacher:
                                currentUser._id
                        },
                        {
                            assistantTeacher:
                                currentUser._id
                        }
                    ],
                    "assignments.student":
                        receiverUser._id
                })
                .select("_id")
                .lean();

            return !!assignment;

        }


        return false;
    }


    // --------------------------------------------------------
    // STUDENT
    // Student can message:
    // Founder
    // Admin
    // Assigned Teachers
    // --------------------------------------------------------

    if (
        currentUser.role === "student"
    ) {

        // Founder / Admin
        if (
            receiverUser.role === "founder" ||
            receiverUser.role === "admin"
        ) {

            return true;

        }


        // Only teachers assigned to this student
        if (
            receiverUser.role === "teacher"
        ) {

            const assignment =
                await PeriodAssignment.findOne({
                    "assignments.student":
                        currentUser._id,
                    $or: [
                        {
                            teacher:
                                receiverUser._id
                        },
                        {
                            assistantTeacher:
                                receiverUser._id
                        }
                    ]
                })
                .select("_id")
                .lean();

            return !!assignment;

        }


        return false;
    }


    // --------------------------------------------------------
    // PARENT
    //
    // Parent communication rules will be added later after
    // the Parent ↔ Student ↔ Teacher relationship is defined.
    // --------------------------------------------------------

    if (
        currentUser.role === "parent"
    ) {

        return false;

    }


    // --------------------------------------------------------
    // UNKNOWN ROLE
    // --------------------------------------------------------

    return false;
}


// ============================================================
// CREATE / LOAD CONVERSATION
// ============================================================

router.post(
    "/",
    async (req, res) => {

        try {

            // ====================================================
            // 1. CHECK AUTHORIZATION HEADER
            // ====================================================

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


            // ====================================================
            // 2. VERIFY TOKEN
            // ====================================================

            const token =
                authHeader.split(" ")[1];

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );


            // ====================================================
            // 3. CHECK TOKEN DATA
            // ====================================================

            if (
                !decoded ||
                !decoded.id ||
                !decoded.role
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Invalid Messenger authentication."
                });

            }


            // ====================================================
            // 4. ALLOWED MESSENGER ROLES
            // ====================================================

            const allowedRoles = [
                "founder",
                "teacher",
                "student",
                "parent",
                "admin"
            ];

            if (
                !allowedRoles.includes(
                    decoded.role
                )
            ) {

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not allowed to use Messenger."
                });

            }


            // ====================================================
            // 5. RECEIVER ID
            // ====================================================

            const receiverId =
                req.body.receiverId;

            if (!receiverId) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Receiver ID is required."
                });

            }


            // ====================================================
            // 6. LOAD CURRENT USER
            // ====================================================

            const currentUser =
                await User.findById(
                    decoded.id
                )
                .select("_id name role")
                .lean();


            if (!currentUser) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Current user was not found."
                });

            }


            // ====================================================
            // 7. LOAD RECEIVER
            // ====================================================

            const receiverUser =
                await User.findById(
                    receiverId
                )
                .select("_id name role")
                .lean();


            if (!receiverUser) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Receiver user was not found."
                });

            }


            // ====================================================
            // 8. CHECK COMMUNICATION PERMISSION
            // ====================================================

            const allowed =
                await canUsersCommunicate(
                    currentUser,
                    receiverUser
                );


            if (!allowed) {

                console.warn(
                    "[GPA MESSENGER CONVERSATION] " +
                    "Conversation creation denied:",
                    {
                        currentUserId:
                            currentUser._id,
                        currentUserRole:
                            currentUser.role,
                        receiverId:
                            receiverUser._id,
                        receiverRole:
                            receiverUser.role
                    }
                );

                return res.status(403).json({
                    success: false,
                    message:
                        "You are not allowed to start a conversation with this user."
                });

            }


            // ====================================================
            // 9. CREATE / LOAD CONVERSATION
            // ====================================================

            const conversation =
                await MessengerConversationService
                    .getOrCreateConversation(
                        currentUser._id,
                        receiverUser._id
                    );


            // ====================================================
            // 10. SUCCESS LOG
            // ====================================================

            console.log(
                "[GPA MESSENGER CONVERSATION] " +
                "Conversation access approved:",
                {
                    currentUserId:
                        currentUser._id,
                    currentUserRole:
                        currentUser.role,
                    receiverId:
                        receiverUser._id,
                    receiverRole:
                        receiverUser.role,
                    conversationId:
                        conversation._id
                }
            );


            // ====================================================
            // 11. RETURN CONVERSATION
            // ====================================================

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