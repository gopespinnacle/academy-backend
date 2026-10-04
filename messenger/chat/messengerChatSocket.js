/**
 * ============================================================
 * GPA MESSENGER - CHAT SOCKET
 * ============================================================
 *
 * Responsibility:
 * - Handle realtime 1-to-1 chat messages
 * - Save messages through MessengerChatService
 * - Deliver messages instantly through Socket.IO
 * - Enforce backend permissions
 *
 * This module does NOT:
 * - Handle calls
 * - Handle WebRTC
 * - Handle notifications
 * - Handle monitoring
 * - Create another Socket.IO server
 *
 * ============================================================
 */

const MessengerChatService = require("./messengerChatService");


const MessengerChatSocket = {

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
                "[GPA CHAT SOCKET] Already initialized."
            );

            return this;
        }


        if (!io) {

            throw new Error(
                "[GPA CHAT SOCKET] Socket.IO instance is required."
            );
        }


        this.io = io;


        console.log(
            "[GPA CHAT SOCKET] Chat socket initialized."
        );


        this.initialized = true;


        return this;
    },


    /**
     * --------------------------------------------------------
     * REGISTER SOCKET
     * --------------------------------------------------------
     *
     * Called only after Messenger socket authentication
     * has successfully completed.
     *
     * socket.messengerUserId is trusted because it is created
     * by backend Messenger Socket authentication.
     */
    registerSocket(socket) {

        if (!this.initialized) {

            console.error(
                "[GPA CHAT SOCKET] Cannot register socket. " +
                "Chat socket is not initialized."
            );

            return;
        }


        if (!socket) {

            console.error(
                "[GPA CHAT SOCKET] Invalid socket."
            );

            return;
        }


        if (!socket.messengerAuthenticated) {

            console.warn(
                "[GPA CHAT SOCKET] Unauthorized socket rejected."
            );

            return;
        }


        const userId = socket.messengerUserId;


        if (!userId) {

            console.warn(
                "[GPA CHAT SOCKET] No Messenger user ID found."
            );

            return;
        }


        console.log(
            "[GPA CHAT SOCKET] Registering user:",
            userId
        );


        /**
         * ----------------------------------------------------
         * SEND MESSAGE
         * ----------------------------------------------------
         */
        socket.on(
            "messenger:chat:send",
            async (data = {}, callback) => {

                try {

                    const receiverId = data.receiverId;
                    const message = data.message;


                    if (!receiverId) {

                        throw new Error(
                            "Receiver ID is required."
                        );
                    }


                    if (
                        typeof message !== "string" ||
                        !message.trim()
                    ) {

                        throw new Error(
                            "Message cannot be empty."
                        );
                    }


                    /**
                     * IMPORTANT:
                     *
                     * senderId comes ONLY from the authenticated
                     * Messenger socket.
                     *
                     * We NEVER trust data.senderId.
                     */
                    const senderId = userId;


                    /**
                     * Save message through the Chat Service.
                     *
                     * The service performs the permission check.
                     */
                    const savedMessage =
                        await MessengerChatService.sendMessage(
                            senderId,
                            receiverId,
                            message
                        );


                    /**
                     * ------------------------------------------------
                     * SEND TO RECEIVER
                     * ------------------------------------------------
                     *
                     * The receiver socket is identified by a
                     * private room:
                     *
                     * messenger:user:<USER_ID>
                     *
                     * The room will be joined by the Messenger
                     * socket bootstrap later.
                     */
                    this.io
                        .to(`messenger:user:${receiverId}`)
                        .emit(
                            "messenger:chat:message",
                            savedMessage
                        );


                    /**
                     * ------------------------------------------------
                     * SEND BACK TO SENDER
                     * ------------------------------------------------
                     *
                     * This gives the sender immediate confirmation.
                     */
                    socket.emit(
                        "messenger:chat:sent",
                        savedMessage
                    );


                    /**
                     * Optional acknowledgement callback.
                     */
                    if (typeof callback === "function") {

                        callback({
                            success: true,
                            message: savedMessage
                        });
                    }


                    console.log(
                        "[GPA CHAT SOCKET] Message delivered:",
                        senderId,
                        "->",
                        receiverId
                    );

                } catch (error) {

                    console.error(
                        "[GPA CHAT SOCKET] Send message error:",
                        error.message
                    );


                    if (typeof callback === "function") {

                        callback({
                            success: false,
                            message: error.message
                        });
                    }


                    socket.emit(
                        "messenger:chat:error",
                        {
                            action: "send",
                            message: error.message
                        }
                    );
                }
            }
        );


        /**
         * --------------------------------------------------------
         * MARK MESSAGE AS READ
         * --------------------------------------------------------
         */
        socket.on(
            "messenger:chat:read",
            async (data = {}, callback) => {

                try {

                    const messageId = data.messageId;


                    if (!messageId) {

                        throw new Error(
                            "Message ID is required."
                        );
                    }


                    const updatedMessage =
                        await MessengerChatService
                            .markMessageAsRead(
                                userId,
                                messageId
                            );


                    /**
                     * Notify the original sender that
                     * their message has been read.
                     */
                    if (updatedMessage.sender) {

                        this.io
                            .to(
                                `messenger:user:${updatedMessage.sender}`
                            )
                            .emit(
                                "messenger:chat:read",
                                {
                                    messageId:
                                        updatedMessage._id,
                                    readAt:
                                        updatedMessage.readAt
                                }
                            );
                    }


                    if (typeof callback === "function") {

                        callback({
                            success: true,
                            message: updatedMessage
                        });
                    }

                } catch (error) {

                    console.error(
                        "[GPA CHAT SOCKET] Read message error:",
                        error.message
                    );


                    if (typeof callback === "function") {

                        callback({
                            success: false,
                            message: error.message
                        });
                    }


                    socket.emit(
                        "messenger:chat:error",
                        {
                            action: "read",
                            message: error.message
                        }
                    );
                }
            }
        );


        /**
         * --------------------------------------------------------
         * MARK CONVERSATION AS READ
         * --------------------------------------------------------
         */
        socket.on(
            "messenger:chat:conversation:read",
            async (data = {}, callback) => {

                try {

                    const otherUserId =
                        data.userId ||
                        data.otherUserId;


                    if (!otherUserId) {

                        throw new Error(
                            "User ID is required."
                        );
                    }


                    const result =
                        await MessengerChatService
                            .markConversationAsRead(
                                userId,
                                otherUserId
                            );


                    if (typeof callback === "function") {

                        callback({
                            success: true,
                            result
                        });
                    }

                } catch (error) {

                    console.error(
                        "[GPA CHAT SOCKET] " +
                        "Conversation read error:",
                        error.message
                    );


                    if (typeof callback === "function") {

                        callback({
                            success: false,
                            message: error.message
                        });
                    }


                    socket.emit(
                        "messenger:chat:error",
                        {
                            action: "conversation:read",
                            message: error.message
                        }
                    );
                }
            }
        );


        /**
         * --------------------------------------------------------
         * SOCKET DISCONNECT
         * --------------------------------------------------------
         */
        socket.on("disconnect", () => {

            console.log(
                "[GPA CHAT SOCKET] User disconnected:",
                userId
            );
        });
    }
};


module.exports = MessengerChatSocket;