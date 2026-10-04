/**
 * ============================================================
 * GPA MESSENGER - CHAT SOCKET BOOTSTRAP
 * ============================================================
 *
 * Responsibility:
 * - Connect Chat Socket to the existing Messenger Socket.IO
 * - Wait for successful Messenger socket authentication
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
 * Existing Messenger Socket Authentication is reused.
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
         * We listen to the SAME Socket.IO server used by
         * GPA Messenger.
         *
         * We do NOT create another Socket.IO server.
         */
        io.on("connection", (socket) => {

            /**
             * Only Messenger sockets are handled here.
             *
             * Existing Academy classroom sockets must remain
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
             * REGISTER AUTHENTICATED CHAT USER
             * ------------------------------------------------
             *
             * The existing Messenger Socket Authentication
             * module emits:
             *
             * messenger:socket:authenticated
             *
             * only after the JWT has been verified.
             *
             * Therefore Chat waits for that event.
             */
            const registerAuthenticatedUser = () => {

                if (
                    !socket.messengerAuthenticated
                ) {

                    console.warn(
                        "[GPA CHAT BOOTSTRAP] " +
                        "Socket authentication not confirmed."
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
                 * This room is used for delivering 1-to-1
                 * messages directly to the intended user.
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
             * Wait for the existing Messenger authentication
             * system to confirm this socket.
             */
            socket.once(
                "messenger:socket:authenticated",
                registerAuthenticatedUser
            );


            /**
             * Safety check:
             *
             * If authentication has already completed before
             * this listener was attached, register immediately.
             */
            if (socket.messengerAuthenticated) {

                registerAuthenticatedUser();
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