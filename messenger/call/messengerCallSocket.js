/**
 * GPA Messenger
 * Audio Call Socket Module
 *
 * Responsible only for Socket.IO
 * signaling events for audio calls.
 *
 * WebRTC logic will be handled
 * by a separate module.
 */

class MessengerCallSocket {

    constructor() {
        this.io = null;
    }

    /**
     * Initialize the call socket module
     */
    initialize(io) {

        if (!io) {
            throw new Error(
                "Socket.IO instance is required for Messenger Call Socket."
            );
        }

        this.io = io;

        console.log(
            "[GPA CALL SOCKET] Call socket module initialized."
        );
    }

    /**
     * Register a user's socket
     *
     * Authentication and user identity
     * will be connected later through
     * the Messenger authentication layer.
     */
    registerUserSocket(socket, userId) {

        if (!this.io) {
            throw new Error(
                "Messenger Call Socket is not initialized."
            );
        }

        if (!socket) {
            throw new Error("Socket is required.");
        }

        if (!userId) {
            throw new Error("User ID is required.");
        }

        const userRoom = this.getUserRoom(userId);

        socket.join(userRoom);

        console.log(
            `[GPA CALL SOCKET] User joined call room: ${userId}`
        );
    }

    /**
     * Send an event to a specific user
     */
    emitToUser(userId, event, data = {}) {

        if (!this.io) {
            throw new Error(
                "Messenger Call Socket is not initialized."
            );
        }

        if (!userId) {
            throw new Error("User ID is required.");
        }

        if (!event) {
            throw new Error("Socket event is required.");
        }

        const userRoom = this.getUserRoom(userId);

        this.io.to(userRoom).emit(event, data);
    }

    /**
     * Create a private Socket.IO room
     * for one user.
     */
    getUserRoom(userId) {

        return `messenger:user:${userId}`;
    }
}

module.exports = new MessengerCallSocket();