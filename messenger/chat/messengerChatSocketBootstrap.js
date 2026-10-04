/**
 * ============================================================
 * GPA MESSENGER - CHAT SOCKET BOOTSTRAP
 * ============================================================
 *
 * Responsibility:
 * - Connect Chat Socket to the existing Messenger Socket.IO
 * - Detect already-authenticated Messenger sockets
 * - Create the private user chat room
 * - Register messengerChatSocket
 *
 * IMPORTANT:
 * - Does NOT create another Socket.IO server
 * - Does NOT authenticate JWT again
 * - Does NOT handle calls
 * - Does NOT handle notifications
 * - Does NOT contain chat business logic
 *
 * ============================================================
 */

const MessengerChatSocket =
    require("./messengerChatSocket");


const MessengerChatSocketBootstrap = {

    initialized: false,
    io: null,


    /**
     * --------------------------------------------------------
     * INITIALIZE
     * --------------------------------------------------------
     */
    initialize(io) {

        if (this.initialized) {

            console.log(
                "[GPA CHAT BOOTSTRAP] " +
                "Chat socket bootstrap already initialized."
            );

            return this;
        }


        if (!io) {

            throw new Error(
                "[GPA CHAT BOOTSTRAP] " +
                "Socket.IO instance is required."
            );
        }


        this.io = io;


        /**
         * Initialize the actual Chat Socket module.
         */
        MessengerChatSocket.initialize(io);


        /**
         * ----------------------------------------------------
         * SOCKET CONNECTION
         * ----------------------------------------------------
         *
         * We use the SAME Socket.IO server used by
         * GPA Messenger.
         *
         * We do NOT create another Socket.IO server.
         */
        io.on("connection", (socket) => {

            /**
             * Only Messenger sockets are handled here.
             *
             * Existing Academy classroom sockets remain
             * completely untouched.
             */
            if (
                !socket.handshake ||
                !socket.handshake.auth ||
                socket.handshake.auth.messenger !== true
            ) {

                return;
            }


            console.log(
                "[GPA CHAT BOOTSTRAP] " +
                "Messenger socket detected."
            );


            /**
             * ------------------------------------------------
             * REGISTER AUTHENTICATED USER
             * ------------------------------------------------
             *
             * The existing Messenger authentication system
             * places the verified identity directly on the
             * socket:
             *
             * socket.messengerAuthenticated
             * socket.messengerUserId
             *
             * We use those backend-verified values.
             *
             * We DO NOT trust a user ID sent by the frontend.
             */
            const registerAuthenticatedUser = () => {

                if (
                    !socket.messengerAuthenticated
                ) {

                    console.warn(
                        "[GPA CHAT BOOTSTRAP] " +
                        "Messenger socket is not authenticated."
                    );

                    return;
                }


                const userId =
                    socket.messengerUserId;


                if (!userId) {

                    console.warn(
                        "[GPA CHAT BOOTSTRAP] " +
                        "No Messenger user ID available."
                    );

                    return;
                }


                /**
                 * ------------------------------------------------
                 * PRIVATE USER CHAT ROOM
                 * ------------------------------------------------
                 *
                 * Every Messenger user receives a private room:
                 *
                 * messenger:user:<USER_ID>
                 *
                 * Only messages intended for this user are
                 * delivered to this room.
                 */
                const roomName =
                    `messenger:user:${userId}`;


                socket.join(roomName);


                console.log(
                    "[GPA CHAT BOOTSTRAP] " +
                    "User joined chat room:",
                    roomName
                );


                /**
                 * Register the actual Chat Socket events.
                 */
                MessengerChatSocket.registerSocket(socket);


                console.log(
                    "[GPA CHAT BOOTSTRAP] " +
                    "Chat socket registered for user:",
                    userId
                );
            };


            /**
             * ------------------------------------------------
             * IMPORTANT AUTHENTICATION TIMING HANDLING
             * ------------------------------------------------
             *
             * In our current architecture, Messenger
             * authentication may already have completed
             * before this Chat Bootstrap reaches this point.
             *
             * Therefore:
             *
             * 1. If authentication is already complete,
             *    register immediately.
             *
             * 2. Otherwise wait for the authentication event.
             */
            if (socket.messengerAuthenticated) {

                registerAuthenticatedUser();

            } else {

                socket.once(
                    "messenger:socket:authenticated",
                    registerAuthenticatedUser
                );
            }

        });


        this.initialized = true;


        console.log(
            "[GPA CHAT BOOTSTRAP] " +
            "Messenger chat socket bootstrap initialized."
        );


        return this;
    }
};


module.exports =
    MessengerChatSocketBootstrap;