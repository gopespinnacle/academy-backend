/**
 * ============================================================
 * GPA MESSENGER
 * Call Events
 * ============================================================
 *
 * Responsible for Socket.IO audio-call events.
 *
 * This module coordinates:
 *
 * - Permission checking
 * - Call Manager
 * - Call Socket
 *
 * It does NOT contain:
 *
 * - WebRTC
 * - Database logic
 * - Recording logic
 * - Authentication implementation
 *
 * ============================================================
 */

const User = require("../../models/User");

const {
    canAudioCall,
    getSafeMessengerUser
} = require("../permissions/messengerPermissionService");

const MessengerCallManager =
    require("./messengerCallManager");

const MessengerCallSocket =
    require("./messengerCallSocket");


class MessengerCallEvents {

    constructor() {
        this.io = null;
        this.initialized = false;
    }


    /**
     * --------------------------------------------------------
     * Initialize Call Events
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
                "[GPA CALL EVENTS] Already initialized."
            );

            return this;
        }

        this.io = io;

        this.initialized = true;

        console.log(
            "[GPA CALL EVENTS] Call events initialized."
        );

        return this;
    }


    /**
     * --------------------------------------------------------
     * Register a user's call events
     * --------------------------------------------------------
     *
     * IMPORTANT:
     *
     * socket.messengerUserId MUST come from the
     * authenticated Socket.IO connection.
     *
     * We do not accept the caller ID from the
     * browser event itself.
     */
    registerSocket(socket) {

        if (!this.initialized) {
            throw new Error(
                "Call Events module is not initialized."
            );
        }

        if (!socket) {
            throw new Error(
                "Socket is required."
            );
        }


        /**
         * ----------------------------------------------------
         * CALL REQUEST
         * ----------------------------------------------------
         *
         * Caller asks to call another user.
         */
        socket.on(
            "messenger:call:request",
            async (data = {}) => {

                try {

                    const callerId =
                        this.getAuthenticatedUserId(
                            socket
                        );

                    const receiverId =
                        data.receiverId;


                    if (!receiverId) {

                        return this.emitError(
                            socket,
                            "Receiver ID is required."
                        );
                    }


                    /**
                     * Load caller.
                     */
                    const caller =
                        await User.findById(
                            callerId
                        ).select(
                            "_id name role studentId teacherId adminId"
                        );


                    /**
                     * Load receiver.
                     */
                    const receiver =
                        await User.findById(
                            receiverId
                        ).select(
                            "_id name role studentId teacherId adminId"
                        );


                    if (!caller) {

                        return this.emitError(
                            socket,
                            "Caller not found."
                        );
                    }


                    if (!receiver) {

                        return this.emitError(
                            socket,
                            "Receiver not found."
                        );
                    }


                    /**
                     * ------------------------------------------------
                     * BACKEND AUDIO CALL PERMISSION CHECK
                     * ------------------------------------------------
                     */
                    const allowed =
                        await canAudioCall(
                            caller,
                            receiver
                        );


                    if (!allowed) {

                        return this.emitError(
                            socket,
                            "You are not allowed to make this audio call."
                        );
                    }


                    /**
                     * ------------------------------------------------
                     * CREATE CALL
                     * ------------------------------------------------
                     */
                    const result =
                        await MessengerCallManager
                            .createCall(
                                callerId.toString(),
                                receiverId.toString()
                            );


                    const session =
                        result.session;


                    /**
                     * ------------------------------------------------
                     * Send call request to receiver.
                     * ------------------------------------------------
                     */
                    MessengerCallSocket.emitToUser(
                        receiverId,
                        "messenger:call:incoming",
                        {
                            callId: session.callId,

                            caller:
                                getSafeMessengerUser(
                                    caller
                                ),

                            status: session.status,

                            createdAt:
                                session.createdAt
                        }
                    );


                    /**
                     * ------------------------------------------------
                     * Confirm to caller.
                     * ------------------------------------------------
                     */
                    socket.emit(
                        "messenger:call:requested",
                        {
                            callId:
                                session.callId,

                            receiver:
                                getSafeMessengerUser(
                                    receiver
                                ),

                            status:
                                session.status
                        }
                    );


                } catch (error) {

                    console.error(
                        "[GPA CALL EVENTS] Call request error:",
                        error.message
                    );

                    this.emitError(
                        socket,
                        error.message
                    );
                }
            }
        );


        /**
         * ----------------------------------------------------
         * CALL ACCEPT
         * ----------------------------------------------------
         */
        socket.on(
            "messenger:call:accept",
            async (data = {}) => {

                try {

                    const userId =
                        this.getAuthenticatedUserId(
                            socket
                        );

                    const callId =
                        data.callId;


                    if (!callId) {

                        return this.emitError(
                            socket,
                            "Call ID is required."
                        );
                    }


                    const session =
                        MessengerCallManager
                            .getSession(callId);


                    if (!session) {

                        return this.emitError(
                            socket,
                            "Call session not found."
                        );
                    }


                    /**
                     * Only the receiver can accept.
                     */
                    if (
                        session.receiverId !==
                        userId.toString()
                    ) {

                        return this.emitError(
                            socket,
                            "Only the receiver can accept this call."
                        );
                    }


                    const result =
                        await MessengerCallManager
                            .setConnected(
                                callId
                            );


                    /**
                     * Notify caller.
                     */
                    MessengerCallSocket.emitToUser(
                        session.callerId,
                        "messenger:call:accepted",
                        {
                            callId,

                            status:
                                result.session.status,

                            connectedAt:
                                result.session.connectedAt
                        }
                    );


                    /**
                     * Confirm to receiver.
                     */
                    socket.emit(
                        "messenger:call:connected",
                        {
                            callId,

                            status:
                                result.session.status,

                            connectedAt:
                                result.session.connectedAt
                        }
                    );


                } catch (error) {

                    console.error(
                        "[GPA CALL EVENTS] Call accept error:",
                        error.message
                    );

                    this.emitError(
                        socket,
                        error.message
                    );
                }
            }
        );


        /**
         * ----------------------------------------------------
         * CALL REJECT
         * ----------------------------------------------------
         */
        socket.on(
            "messenger:call:reject",
            async (data = {}) => {

                try {

                    const userId =
                        this.getAuthenticatedUserId(
                            socket
                        );

                    const callId =
                        data.callId;


                    if (!callId) {

                        return this.emitError(
                            socket,
                            "Call ID is required."
                        );
                    }


                    const session =
                        MessengerCallManager
                            .getSession(callId);


                    if (!session) {

                        return this.emitError(
                            socket,
                            "Call session not found."
                        );
                    }


                    /**
                     * Only receiver can reject.
                     */
                    if (
                        session.receiverId !==
                        userId.toString()
                    ) {

                        return this.emitError(
                            socket,
                            "Only the receiver can reject this call."
                        );
                    }


                    const reason =
                        data.reason ||
                        "rejected";


                    const result =
                        await MessengerCallManager
                            .reject(
                                callId,
                                reason
                            );


                    /**
                     * Notify caller.
                     */
                    MessengerCallSocket.emitToUser(
                        session.callerId,
                        "messenger:call:rejected",
                        {
                            callId,

                            status:
                                result.session.status,

                            reason
                        }
                    );


                    /**
                     * Confirm to receiver.
                     */
                    socket.emit(
                        "messenger:call:rejected",
                        {
                            callId,

                            status:
                                result.session.status,

                            reason
                        }
                    );


                } catch (error) {

                    console.error(
                        "[GPA CALL EVENTS] Call reject error:",
                        error.message
                    );

                    this.emitError(
                        socket,
                        error.message
                    );
                }
            }
        );


        /**
         * ----------------------------------------------------
         * CALL END
         * ----------------------------------------------------
         */
        socket.on(
            "messenger:call:end",
            async (data = {}) => {

                try {

                    const userId =
                        this.getAuthenticatedUserId(
                            socket
                        );

                    const callId =
                        data.callId;


                    if (!callId) {

                        return this.emitError(
                            socket,
                            "Call ID is required."
                        );
                    }


                    const session =
                        MessengerCallManager
                            .getSession(callId);


                    if (!session) {

                        return this.emitError(
                            socket,
                            "Call session not found."
                        );
                    }


                    /**
                     * Only participants can end the call.
                     */
                    if (
                        session.callerId !==
                            userId.toString() &&
                        session.receiverId !==
                            userId.toString()
                    ) {

                        return this.emitError(
                            socket,
                            "You are not part of this call."
                        );
                    }


                    const reason =
                        data.reason ||
                        "ended";


                    const result =
                        await MessengerCallManager
                            .end(
                                callId,
                                reason
                            );


                    const otherUserId =
                        session.callerId ===
                        userId.toString()
                            ? session.receiverId
                            : session.callerId;


                    /**
                     * Notify the other participant.
                     */
                    MessengerCallSocket.emitToUser(
                        otherUserId,
                        "messenger:call:ended",
                        {
                            callId,

                            status:
                                result.session.status,

                            duration:
                                result.session.duration,

                            reason
                        }
                    );


                    /**
                     * Confirm to current participant.
                     */
                    socket.emit(
                        "messenger:call:ended",
                        {
                            callId,

                            status:
                                result.session.status,

                            duration:
                                result.session.duration,

                            reason
                        }
                    );


                } catch (error) {

                    console.error(
                        "[GPA CALL EVENTS] Call end error:",
                        error.message
                    );

                    this.emitError(
                        socket,
                        error.message
                    );
                }
            }
        );


        /**
         * ----------------------------------------------------
         * Disconnect
         * ----------------------------------------------------
         *
         * WebRTC cleanup will be handled later.
         *
         * We do not automatically end calls here yet because
         * reconnect handling needs to be designed properly.
         */
        socket.on(
            "disconnect",
            () => {

                console.log(
                    "[GPA CALL EVENTS] Socket disconnected:",
                    socket.id
                );
            }
        );
    }


    /**
     * --------------------------------------------------------
     * Get authenticated user ID
     * --------------------------------------------------------
     */
    getAuthenticatedUserId(socket) {

        const userId =
            socket.messengerUserId ||
            socket.userId ||
            socket.user?._id;


        if (!userId) {

            throw new Error(
                "Socket is not authenticated."
            );
        }


        return userId;
    }


    /**
     * --------------------------------------------------------
     * Emit standardized error
     * --------------------------------------------------------
     */
    emitError(socket, message) {

        socket.emit(
            "messenger:call:error",
            {
                message:
                    message ||
                    "Call request failed."
            }
        );
    }
}


module.exports =
    new MessengerCallEvents();