/**
 * ============================================================
 * GPA MESSENGER
 * Chat Socket Bootstrap
 * ============================================================
 *
 * Connects the Chat Socket module to the EXISTING
 * Messenger Socket.IO system.
 *
 * IMPORTANT:
 *
 * - Does NOT create another Socket.IO server.
 * - Does NOT authenticate JWT itself.
 * - Uses MessengerSocketAuth as the single authentication
 *   source for all Messenger modules.
 * - Does NOT handle calls.
 * - Does NOT handle notifications.
 * - Does NOT contain chat business logic.
 *
 * ============================================================
 */

const MessengerSocketAuth =
    require("../permissions/messengerSocketAuth");

const MessengerChatSocket =
    require("./messengerChatSocket");


class MessengerChatSocketBootstrap {

    constructor() {

        this.io = null;
        this.initialized = false;
    }


    /**
     * --------------------------------------------------------
     * Initialize
     * --------------------------------------------------------
     */
    initialize(io) {

        if (!io) {

            throw new Error(
                "[GPA CHAT BOOTSTRAP] " +
                "Socket.IO instance is required."
            );
        }


        if (this.initialized) {

            console.log(
                "[GPA CHAT BOOTSTRAP] " +
                "Already initialized."
            );

            return this;
        }


        this.io = io;


        /*
         * ----------------------------------------------------
         * Initialize Chat Socket
         * ----------------------------------------------------
         */
        MessengerChatSocket.initialize(io);


        /*
         * ----------------------------------------------------
         * Add Messenger-only connection listener.
         *
         * This does NOT replace or modify the existing
         * Academy Socket.IO connection listener.
         * ----------------------------------------------------
         */
        io.on(
            "connection",
            (socket) => {

                this.handleConnection(
                    socket
                );
            }
        );


        this.initialized = true;


        console.log(
            "[GPA CHAT BOOTSTRAP] " +
            "Messenger chat socket bootstrap initialized."
        );


        return this;
    }


    /**
     * --------------------------------------------------------
     * Handle New Socket.IO Connection
     * --------------------------------------------------------
     */
    handleConnection(socket) {

        /*
         * We only handle connections that explicitly identify
         * themselves as GPA Messenger sockets.
         *
         * The Web/Android Messenger client sends:
         *
         * messenger: true
         */
        const isMessengerSocket =
            socket.handshake
                ?.auth
                ?.messenger === true;


        /*
         * Existing Academy Socket.IO connections are ignored.
         */
        if (!isMessengerSocket) {

            return;
        }


        console.log(
            "[GPA CHAT BOOTSTRAP] " +
            "Messenger socket detected."
        );


        /*
         * ----------------------------------------------------
         * Wait for BACKEND Messenger authentication.
         * ----------------------------------------------------
         *
         * IMPORTANT:
         *
         * We do NOT listen for:
         *
         * socket.once(
         *     "messenger:socket:authenticated"
         * )
         *
         * because that event is emitted FROM BACKEND TO
         * BROWSER.
         *
         * Instead we use MessengerSocketAuth.onAuthenticated()
         * which is an INTERNAL BACKEND authentication callback.
         */
        MessengerSocketAuth.onAuthenticated(
            socket,
            (
                authenticatedSocket,
                user
            ) => {

                this.registerAuthenticatedUser(
                    authenticatedSocket,
                    user
                );
            }
        );
    }


    /**
     * --------------------------------------------------------
     * Register Authenticated Chat User
     * --------------------------------------------------------
     */
    registerAuthenticatedUser(
        socket,
        user
    ) {

        /*
         * Safety check.
         *
         * Authentication has already been performed by
         * MessengerSocketAuth.
         */
        if (
            !socket ||
            !socket.messengerAuthenticated
        ) {

            console.warn(
                "[GPA CHAT BOOTSTRAP] " +
                "Authenticated socket state is invalid."
            );

            return;
        }


        /*
         * IMPORTANT:
         *
         * The user ID comes from the backend-authenticated
         * socket.
         *
         * We never trust a user ID supplied by the client.
         */
        const userId =
            socket.messengerUserId;


        if (!userId) {

            console.warn(
                "[GPA CHAT BOOTSTRAP] " +
                "No Messenger user ID available."
            );

            return;
        }


        /*
         * ----------------------------------------------------
         * PRIVATE CHAT ROOM
         * ----------------------------------------------------
         *
         * Every Messenger user receives their own private
         * room.
         *
         * Example:
         *
         * messenger:user:69df...
         */
        const roomName =
            `messenger:user:${userId}`;


        socket.join(
            roomName
        );


        console.log(
            "[GPA CHAT BOOTSTRAP] " +
            "User joined chat room:",
            roomName
        );


        /*
         * ----------------------------------------------------
         * REGISTER CHAT EVENTS
         * ----------------------------------------------------
         */
        MessengerChatSocket.registerSocket(
            socket
        );


        console.log(
            "[GPA CHAT BOOTSTRAP] " +
            "Chat socket registered for user:",
            userId
        );
    }
}


module.exports =
    new MessengerChatSocketBootstrap();