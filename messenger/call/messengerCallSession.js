/**
 * ============================================================
 * GPA MESSENGER
 * Call Session Manager
 * ============================================================
 *
 * Responsible only for managing the lifecycle of
 * an active Messenger audio call.
 *
 * This module does NOT handle:
 *
 * - Permissions
 * - Socket.IO signaling
 * - WebRTC
 * - Recording
 * - Database persistence
 *
 * Those responsibilities belong to separate modules.
 *
 * ============================================================
 */

class MessengerCallSession {

    constructor() {
        this.activeSessions = new Map();
    }

    /**
     * Create a new call session.
     */
    createSession(callerId, receiverId) {

        if (!callerId) {
            throw new Error("Caller ID is required.");
        }

        if (!receiverId) {
            throw new Error("Receiver ID is required.");
        }

        if (callerId === receiverId) {
            throw new Error(
                "Caller and receiver cannot be the same user."
            );
        }

        // Prevent the same caller from having
        // multiple active calls.
        const existingCallerSession =
            this.findActiveSessionByUser(callerId);

        if (existingCallerSession) {
            throw new Error(
                "Caller already has an active call."
            );
        }

        // Prevent the receiver from being involved
        // in another active call.
        const existingReceiverSession =
            this.findActiveSessionByUser(receiverId);

        if (existingReceiverSession) {
            throw new Error(
                "Receiver already has an active call."
            );
        }

        const callId = this.createCallId();

        const session = {
            callId,

            callerId,
            receiverId,

            status: "initiating",

            createdAt: new Date(),

            ringingAt: null,

            connectedAt: null,

            endedAt: null,

            duration: 0,

            endReason: null
        };

        this.activeSessions.set(callId, session);

        console.log(
            `[GPA CALL SESSION] Created: ${callId}`
        );

        return session;
    }

    /**
     * Change call to ringing state.
     */
    setRinging(callId) {

        const session = this.getSession(callId);

        if (!session) {
            throw new Error("Call session not found.");
        }

        if (session.status !== "initiating") {
            throw new Error(
                `Cannot set ringing from status "${session.status}".`
            );
        }

        session.status = "ringing";
        session.ringingAt = new Date();

        console.log(
            `[GPA CALL SESSION] Ringing: ${callId}`
        );

        return session;
    }

    /**
     * Mark call as connected.
     */
    setConnected(callId) {

        const session = this.getSession(callId);

        if (!session) {
            throw new Error("Call session not found.");
        }

        if (
            session.status !== "initiating" &&
            session.status !== "ringing"
        ) {
            throw new Error(
                `Cannot connect call from status "${session.status}".`
            );
        }

        session.status = "connected";
        session.connectedAt = new Date();

        console.log(
            `[GPA CALL SESSION] Connected: ${callId}`
        );

        return session;
    }

    /**
     * Reject an incoming call.
     */
    reject(callId, reason = "rejected") {

        const session = this.getSession(callId);

        if (!session) {
            throw new Error("Call session not found.");
        }

        if (
            session.status === "connected" ||
            session.status === "ended"
        ) {
            throw new Error(
                `Cannot reject call from status "${session.status}".`
            );
        }

        session.status = "rejected";
        session.endedAt = new Date();
        session.endReason = reason;

        this.calculateDuration(session);

        console.log(
            `[GPA CALL SESSION] Rejected: ${callId}`
        );

        return session;
    }

    /**
     * End an active call.
     */
    end(callId, reason = "ended") {

        const session = this.getSession(callId);

        if (!session) {
            throw new Error("Call session not found.");
        }

        if (session.status === "ended") {
            return session;
        }

        session.status = "ended";
        session.endedAt = new Date();
        session.endReason = reason;

        this.calculateDuration(session);

        console.log(
            `[GPA CALL SESSION] Ended: ${callId}`
        );

        return session;
    }

    /**
     * Calculate connected call duration.
     *
     * Duration is measured only from connectedAt,
     * not from the moment the call was created.
     */
    calculateDuration(session) {

        if (
            session.connectedAt &&
            session.endedAt
        ) {

            session.duration = Math.floor(
                (
                    session.endedAt.getTime() -
                    session.connectedAt.getTime()
                ) / 1000
            );
        }

        return session.duration;
    }

    /**
     * Get a call session.
     */
    getSession(callId) {

        return this.activeSessions.get(callId) || null;
    }

    /**
     * Find an active session involving a user.
     */
    findActiveSessionByUser(userId) {

        for (const session of this.activeSessions.values()) {

            if (
                session.status !== "ended" &&
                session.status !== "rejected" &&
                (
                    session.callerId === userId ||
                    session.receiverId === userId
                )
            ) {
                return session;
            }
        }

        return null;
    }

    /**
     * Remove a completed session from memory.
     *
     * Database persistence will be handled separately.
     */
    removeSession(callId) {

        return this.activeSessions.delete(callId);
    }

    /**
     * Generate unique call ID.
     */
    createCallId() {

        return (
            `call_${Date.now()}_` +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }

    /**
     * Get number of active sessions.
     */
    getActiveSessionCount() {

        let count = 0;

        for (const session of this.activeSessions.values()) {

            if (
                session.status !== "ended" &&
                session.status !== "rejected"
            ) {
                count++;
            }
        }

        return count;
    }
}

module.exports = new MessengerCallSession();