/**
 * ============================================================
 * GPA MESSENGER
 * Messenger Socket Authentication
 * ============================================================
 *
 * This authentication layer is ONLY for GPA Messenger.
 *
 * IMPORTANT:
 *
 * We do NOT use io.use() globally because the existing
 * Academy Socket.IO classroom system must remain untouched.
 *
 * Messenger authentication happens only inside Messenger's
 * own Socket.IO connection handler.
 *
 * ============================================================
 */

const jwt = require("jsonwebtoken");

const User = require("../../models/User");


const MESSENGER_ROLES = [
    "founder",
    "admin",
    "teacher",
    "student"
];


class MessengerSocketAuth {

    /**
     * --------------------------------------------------------
     * Authenticate Messenger Socket
     * --------------------------------------------------------
     */
    async authenticate(socket) {

        if (!socket) {
            throw new Error(
                "Socket is required."
            );
        }


        const token =
            this.getToken(socket);


        if (!token) {

            throw new Error(
                "Messenger authentication token is required."
            );
        }


        let decoded;


        try {

            decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

        } catch (error) {

            throw new Error(
                "Messenger authentication failed."
            );
        }


        if (!decoded || !decoded.id) {

            throw new Error(
                "Invalid Messenger authentication token."
            );
        }


        const user =
            await User.findById(
                decoded.id
            ).select(
                "_id name role studentId teacherId adminId"
            );


        if (!user) {

            throw new Error(
                "Messenger user not found."
            );
        }


        if (
            !MESSENGER_ROLES.includes(
                user.role
            )
        ) {

            throw new Error(
                "User role is not allowed to use Messenger."
            );
        }


        /*
         * ----------------------------------------------------
         * Store authenticated identity on the socket.
         *
         * Call Events will use this value instead of
         * trusting a callerId sent by the client.
         * ----------------------------------------------------
         */

        socket.messengerUserId =
            user._id.toString();


        socket.messengerUser =
            user;


        socket.messengerAuthenticated =
            true;


        console.log(
            "[GPA MESSENGER AUTH] User authenticated:",
            user._id.toString()
        );


        return user;
    }


    /**
     * --------------------------------------------------------
     * Extract JWT from Socket.IO handshake
     * --------------------------------------------------------
     *
     * Preferred:
     *
     * socket.handshake.auth.token
     *
     * Also supports:
     *
     * Authorization header
     */
    getToken(socket) {

        const authToken =
            socket.handshake
                ?.auth
                ?.token;


        if (authToken) {

            return this.cleanBearerToken(
                authToken
            );
        }


        const authorization =
            socket.handshake
                ?.headers
                ?.authorization;


        if (authorization) {

            return this.cleanBearerToken(
                authorization
            );
        }


        return null;
    }


    /**
     * --------------------------------------------------------
     * Remove Bearer prefix
     * --------------------------------------------------------
     */
    cleanBearerToken(token) {

        if (!token) {
            return null;
        }


        if (
            typeof token !==
            "string"
        ) {
            return null;
        }


        if (
            token
                .toLowerCase()
                .startsWith("bearer ")
        ) {

            return token
                .slice(7)
                .trim();
        }


        return token.trim();
    }


    /**
     * --------------------------------------------------------
     * Check authentication state
     * --------------------------------------------------------
     */
    isAuthenticated(socket) {

        return !!(
            socket &&
            socket.messengerAuthenticated === true &&
            socket.messengerUserId
        );
    }


    /**
     * --------------------------------------------------------
     * Get authenticated Messenger user
     * --------------------------------------------------------
     */
    getAuthenticatedUser(socket) {

        if (
            !this.isAuthenticated(socket)
        ) {

            throw new Error(
                "Messenger socket is not authenticated."
            );
        }


        return socket.messengerUser;
    }
}


module.exports =
    new MessengerSocketAuth();