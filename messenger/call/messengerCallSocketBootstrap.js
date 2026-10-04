/**
 * ============================================================
 * GPA MESSENGER
 * Call Socket Bootstrap
 * ============================================================
 *
 * Connects GPA Messenger's authenticated call system
 * to the EXISTING Socket.IO server.
 *
 * IMPORTANT:
 *
 * - Does NOT create another Socket.IO server.
 * - Does NOT modify Academy classroom sockets.
 * - Does NOT use global io.use() authentication.
 *
 * ============================================================
 */

const MessengerSocketAuth =
    require("../permissions/messengerSocketAuth");

const MessengerCallSocket =
    require("./messengerCallSocket");

const MessengerCallEvents =
    require("./messengerCallEvents");


class MessengerCallSocketBootstrap {

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
                "Socket.IO instance is required."
            );
        }


        if (this.initialized) {

            console.log(
                "[GPA CALL BOOTSTRAP] Already initialized."
            );

            return this;
        }


        this.io = io;


        /*
         * ----------------------------------------------------
         * Initialize Messenger Call Socket
         * ----------------------------------------------------
         */
        MessengerCallSocket.initialize(io);


        /*
         * ----------------------------------------------------
         * Initialize Messenger Call Events
         * ----------------------------------------------------
         */
        MessengerCallEvents.initialize(io);


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
            "[GPA CALL BOOTSTRAP] Messenger call socket bootstrap initialized."
        );


        return this;
    }


    /**
     * --------------------------------------------------------
     * Handle a new Socket.IO connection
     * --------------------------------------------------------
     */
    async handleConnection(socket) {

        /*
         * We authenticate only if this connection is
         * intended to use Messenger.
         *
         * The Messenger client will send:
         *
         * socket.handshake.auth.messenger === true
         */
        const isMessengerSocket =
            socket.handshake
                ?.auth
                ?.messenger === true;


        /*
         * Existing Academy Socket.IO clients are ignored.
         *
         * Their current behavior remains untouched.
         */
        if (!isMessengerSocket) {

            return;
        }


        try {

            /*
             * ------------------------------------------------
             * Authenticate Messenger user.
             * ------------------------------------------------
             */
            const user =
                await MessengerSocketAuth
                    .authenticate(socket);


            /*
             * ------------------------------------------------
             * Register the user's private Messenger room.
             * ------------------------------------------------
             */
            MessengerCallSocket
                .registerUserSocket(
                    socket,
                    user._id.toString()
                );


            /*
             * ------------------------------------------------
             * Register call events.
             * ------------------------------------------------
             */
            MessengerCallEvents
                .registerSocket(socket);


            /*
             * ------------------------------------------------
             * Confirm successful Messenger connection.
             * ------------------------------------------------
             */
            socket.emit(
                "messenger:socket:authenticated",
                {
                    success: true,

                    user: {
                        _id:
                            user._id,

                        name:
                            user.name,

                        role:
                            user.role
                    }
                }
            );


            console.log(
                "[GPA CALL BOOTSTRAP] Messenger socket authenticated:",
                user._id.toString()
            );


        } catch (error) {

            console.error(
                "[GPA CALL BOOTSTRAP] Authentication failed:",
                error.message
            );


            /*
             * Do not allow an unauthenticated Messenger
             * socket to remain connected.
             */
            socket.emit(
                "messenger:socket:error",
                {
                    message:
                        error.message ||
                        "Messenger authentication failed."
                }
            );


            socket.disconnect(
                true
            );
        }
    }
}


module.exports =
    new MessengerCallSocketBootstrap();