/**
 * ============================================================
 * GPA MESSENGER
 * Messenger Socket Diagnostics
 * ============================================================
 *
 * Development/testing helper for Messenger Socket
 * authentication.
 *
 * This file does NOT authenticate users itself.
 *
 * Authentication is handled by:
 *
 * messengerSocketAuth.js
 *
 * This module only reports the authentication state
 * of an already-authenticated Messenger socket.
 *
 * ============================================================
 */

class MessengerSocketDiagnostics {

    /**
     * --------------------------------------------------------
     * Check Messenger socket authentication
     * --------------------------------------------------------
     */
    checkAuthentication(socket) {

        if (!socket) {

            return {
                success: false,
                authenticated: false,
                message: "Socket is missing."
            };
        }


        const authenticated =
            socket.messengerAuthenticated === true;


        const userId =
            socket.messengerUserId || null;


        const user =
            socket.messengerUser || null;


        if (!authenticated) {

            return {
                success: false,
                authenticated: false,
                userId: null,
                user: null,
                message:
                    "Messenger socket is not authenticated."
            };
        }


        return {
            success: true,

            authenticated: true,

            userId,

            user: user
                ? {
                    _id: user._id,
                    name: user.name,
                    role: user.role,
                    studentId: user.studentId || null,
                    teacherId: user.teacherId || null,
                    adminId: user.adminId || null
                }
                : null,

            message:
                "Messenger socket authentication successful."
        };
    }


    /**
     * --------------------------------------------------------
     * Log authentication result
     * --------------------------------------------------------
     */
    logAuthenticationResult(socket) {

        const result =
            this.checkAuthentication(socket);


        if (!result.success) {

            console.log(
                "[GPA MESSENGER DIAGNOSTICS] AUTH FAILED:",
                result.message
            );

            return result;
        }


        console.log(
            "[GPA MESSENGER DIAGNOSTICS] AUTH SUCCESS"
        );


        console.log(
            "[GPA MESSENGER DIAGNOSTICS] User ID:",
            result.userId
        );


        console.log(
            "[GPA MESSENGER DIAGNOSTICS] Role:",
            result.user?.role
        );


        return result;
    }
}


module.exports =
    new MessengerSocketDiagnostics();