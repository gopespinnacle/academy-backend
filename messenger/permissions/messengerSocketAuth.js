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
 * - We do NOT use io.use() globally.
 * - Existing Academy Socket.IO classroom system remains
 *   completely untouched.
 * - Messenger authentication happens only inside Messenger's
 *   own Socket.IO connection handler.
 *
 * This module is also the central authentication notification
 * point for Messenger modules such as:
 *
 * - Chat
 * - Call
 * - Notification
 * - Monitoring
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

    constructor() {

        /*
         * ----------------------------------------------------
         * Authentication listeners
         * ----------------------------------------------------
         *
         * Each authenticated socket can have one or more
         * Messenger modules waiting for authentication.
         *
         * Example:
         *
         * Chat Bootstrap
         * Call Bootstrap
         * Notification Bootstrap
         *
         * can independently register a handler.
         */
        this.authenticationListeners =
            new WeakMap();
    }


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


        if (
            !decoded ||
            !decoded.id
        ) {

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
         * ----------------------------------------------------
         *
         * These values are trusted because they were created
         * by the backend after JWT verification.
         *
         * Messenger modules must use these values instead of
         * trusting user IDs supplied by the frontend.
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


        /*
         * ----------------------------------------------------
         * Notify Messenger modules
         * ----------------------------------------------------
         *
         * This is an INTERNAL backend mechanism.
         *
         * It is different from:
         *
         * socket.emit(
         *     "messenger:socket:authenticated"
         * )
         *
         * That event goes to the browser.
         *
         * These callbacks notify backend Messenger modules.
         */
        this.notifyAuthenticated(
            socket,
            user
        );


        return user;
    }


    /**
     * --------------------------------------------------------
     * Register authenticated-socket listener
     * --------------------------------------------------------
     *
     * Messenger modules can call this method when a socket
     * connects.
     *
     * If authentication has already completed, the callback
     * runs immediately.
     *
     * Otherwise it waits until authenticate() succeeds.
     */
    onAuthenticated(
        socket,
        callback
    ) {

        if (!socket) {

            throw new Error(
                "Socket is required."
            );
        }


        if (
            typeof callback !==
            "function"
        ) {

            throw new Error(
                "Authentication callback is required."
            );
        }


        /*
         * ----------------------------------------------------
         * Authentication already completed
         * ----------------------------------------------------
         */
        if (
            socket.messengerAuthenticated === true &&
            socket.messengerUser
        ) {

            callback(
                socket,
                socket.messengerUser
            );

            return;
        }


        /*
         * ----------------------------------------------------
         * Get existing listeners for this socket
         * ----------------------------------------------------
         */
        let listeners =
            this.authenticationListeners.get(
                socket
            );


        if (!listeners) {

            listeners =
                new Set();

            this.authenticationListeners.set(
                socket,
                listeners
            );
        }


        listeners.add(
            callback
        );
    }


    /**
     * --------------------------------------------------------
     * Notify authenticated Messenger modules
     * --------------------------------------------------------
     */
    notifyAuthenticated(
        socket,
        user
    ) {

        const listeners =
            this.authenticationListeners.get(
                socket
            );


        if (!listeners) {

            return;
        }


        /*
         * Copy the listeners before executing them.
         *
         * This prevents changes to the Set while callbacks
         * are being executed from affecting this notification.
         */
        const listenersSnapshot =
            Array.from(
                listeners
            );


        for (
            const callback
            of listenersSnapshot
        ) {

            try {

                callback(
                    socket,
                    user
                );

            } catch (error) {

                console.error(
                    "[GPA MESSENGER AUTH] " +
                    "Authentication listener error:",
                    error.message
                );
            }
        }


        /*
         * Authentication has completed for this socket.
         * We no longer need to retain the callbacks.
         */
        this.authenticationListeners.delete(
            socket
        );
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
            !this.isAuthenticated(
                socket
            )
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