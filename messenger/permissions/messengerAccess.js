/**
 * ============================================================
 * GPA MESSENGER
 * Access Enforcement Middleware
 * ============================================================
 *
 * This file ENFORCES Messenger permissions.
 *
 * It does NOT:
 *
 * - Authenticate the user
 * - Create JWT tokens
 * - Create a new authentication system
 * - Create a new mapping system
 * - Handle Chat
 * - Handle Calling
 * - Handle Notifications
 *
 * Authentication continues to use the existing Academy
 * protect middleware.
 *
 * Permission decisions come from:
 *
 * messengerPermissionService.js
 *
 * ============================================================
 */

const User =
    require("../../models/User");

const {
    canChat,
    canAudioCall,
    canMonitor,
    getSafeMessengerUser
} =
    require("./messengerPermissionService");


/**
 * ============================================================
 * GET TARGET USER
 * ============================================================
 *
 * Messenger routes will normally provide:
 *
 * /api/messenger/chat/:targetUserId
 *
 * or:
 *
 * /api/messenger/call/:targetUserId
 *
 * This middleware loads that target user.
 *
 * IMPORTANT:
 *
 * Sensitive fields are never loaded.
 * ============================================================
 */

async function getTargetUser(
    targetUserId
) {

    if (!targetUserId) {
        return null;
    }

    const user =
        await User.findById(targetUserId)
            .select(
                "_id name role studentId teacherId adminId"
            )
            .lean();

    return user || null;
}


/**
 * ============================================================
 * CHAT ACCESS
 * ============================================================
 *
 * Usage later:
 *
 * router.post(
 *
 *     "/chat/:targetUserId",
 *
 *     protect,
 *
 *     requireMessengerChatAccess,
 *
 *     controller
 *
 * );
 *
 * The existing Academy "protect" middleware must run BEFORE
 * this middleware so req.user is already available.
 * ============================================================
 */

async function requireMessengerChatAccess(
    req,
    res,
    next
) {

    try {

        /*
         * Existing Academy authentication must have
         * already populated req.user.
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Messenger authentication required."

            });
        }


        /*
         * Target user ID can come from:
         *
         * req.params.targetUserId
         *
         * or, for flexibility:
         *
         * req.body.targetUserId
         */

        const targetUserId =
            req.params.targetUserId ||
            req.body?.targetUserId;


        if (!targetUserId) {

            return res.status(400).json({

                success: false,

                message:
                    "Messenger target user is required."

            });
        }


        /*
         * Load target user.
         */

        const targetUser =
            await getTargetUser(targetUserId);


        if (!targetUser) {

            return res.status(404).json({

                success: false,

                message:
                    "Messenger target user not found."

            });
        }


        /*
         * Ask the Messenger Permission Service
         * whether this communication is allowed.
         */

        const allowed =
            await canChat(
                req.user,
                targetUser
            );


        if (!allowed) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not permitted to chat with this user."

            });
        }


        /*
         * Store the validated target user.
         *
         * Controllers can safely use:
         *
         * req.messengerTargetUser
         */

        req.messengerTargetUser =
            targetUser;


        /*
         * Continue to the requested controller.
         */

        next();

    } catch (error) {

        console.error(
            "Messenger chat permission error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to verify Messenger chat permission."

        });
    }
}


/**
 * ============================================================
 * AUDIO CALL ACCESS
 * ============================================================
 *
 * Only roles permitted by the Messenger Permission Service
 * can initiate an audio call.
 *
 * Video calls are never permitted.
 * ============================================================
 */

async function requireMessengerAudioCallAccess(
    req,
    res,
    next
) {

    try {

        /*
         * Existing Academy authentication.
         */

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Messenger authentication required."

            });
        }


        /*
         * Find target.
         */

        const targetUserId =
            req.params.targetUserId ||
            req.body?.targetUserId;


        if (!targetUserId) {

            return res.status(400).json({

                success: false,

                message:
                    "Messenger call target is required."

            });
        }


        /*
         * Load target user.
         */

        const targetUser =
            await getTargetUser(targetUserId);


        if (!targetUser) {

            return res.status(404).json({

                success: false,

                message:
                    "Messenger call target not found."

            });
        }


        /*
         * Check audio-call permission.
         */

        const allowed =
            await canAudioCall(
                req.user,
                targetUser
            );


        if (!allowed) {

            return res.status(403).json({

                success: false,

                message:
                    "You are not permitted to make an audio call to this user."

            });
        }


        /*
         * Store validated target.
         */

        req.messengerTargetUser =
            targetUser;


        next();

    } catch (error) {

        console.error(
            "Messenger audio call permission error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to verify Messenger audio-call permission."

        });
    }
}


/**
 * ============================================================
 * FOUNDER MONITORING ACCESS
 * ============================================================
 *
 * Monitoring is Founder-only according to the Messenger
 * permission rules.
 *
 * No target user is required for this middleware.
 * ============================================================
 */

async function requireMessengerMonitoringAccess(
    req,
    res,
    next
) {

    try {

        if (!req.user) {

            return res.status(401).json({

                success: false,

                message:
                    "Messenger authentication required."

            });
        }


        const allowed =
            canMonitor(req.user);


        if (!allowed) {

            return res.status(403).json({

                success: false,

                message:
                    "Messenger monitoring access is restricted."

            });
        }


        next();

    } catch (error) {

        console.error(
            "Messenger monitoring permission error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to verify Messenger monitoring permission."

        });
    }
}


/**
 * ============================================================
 * SAFE TARGET USER HELPER
 * ============================================================
 *
 * This helper allows future Messenger controllers to return
 * a safe user object without exposing:
 *
 * - mobile
 * - WhatsApp number
 * - password
 * - login credentials
 * - private Academy information
 * ============================================================
 */

function getSafeTargetUser(
    req
) {

    if (!req.messengerTargetUser) {
        return null;
    }

    return getSafeMessengerUser(
        req.messengerTargetUser
    );
}


/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */

module.exports = {

    requireMessengerChatAccess,

    requireMessengerAudioCallAccess,

    requireMessengerMonitoringAccess,

    getSafeTargetUser

};