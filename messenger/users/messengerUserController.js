// ============================================================
// GPA MESSENGER - USER CONTROLLER
// ============================================================
// Purpose:
// - Receive Messenger user-list API requests
// - Get the authenticated user from req.user
// - Call Messenger User Service
// - Return the result to the frontend
//
// IMPORTANT:
// - No database logic here
// - No permission logic here
// - No Socket.IO logic here
// - No UI logic here
// ============================================================

const MessengerUserService =
    require("./messengerUserService");


// ============================================================
// GET MESSENGER USERS
// ============================================================

async function getMessengerUsers(req, res) {

    try {

        // ----------------------------------------------------
        // Authentication middleware already placed the
        // logged-in user inside req.user.
        // ----------------------------------------------------

        if (!req.user || !req.user._id) {

            return res.status(401).json({
                success: false,
                message: "Authenticated user not found."
            });

        }


        // ----------------------------------------------------
        // Ask the User Service for the users this person
        // is allowed to see in Messenger.
        // ----------------------------------------------------

        const users =
            await MessengerUserService.getMessengerUsers(
                req.user._id
            );


        // ----------------------------------------------------
        // Return safe Messenger users.
        // ----------------------------------------------------

        return res.status(200).json({

            success: true,

            count: users.length,

            users: users

        });

    } catch (error) {

        console.error(
            "[GPA MESSENGER USER CONTROLLER] Get users failed:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                error.message ||
                "Failed to load Messenger users."

        });

    }

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {

    getMessengerUsers

};


// ============================================================
// END GPA MESSENGER USER CONTROLLER
// ============================================================