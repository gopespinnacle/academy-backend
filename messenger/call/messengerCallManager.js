/**
 * ============================================================
 * GPA MESSENGER
 * Call Manager
 * ============================================================
 *
 * Coordinates:
 *
 * 1. Call Session
 * 2. Call Repository
 *
 * IMPORTANT:
 *
 * This module does NOT handle:
 *
 * - Permission decisions
 * - Socket.IO
 * - WebRTC
 * - Recording
 * - HTTP routes
 *
 * Those responsibilities remain in their own modules.
 *
 * ============================================================
 */

const MessengerCallSession =
    require("./messengerCallSession");

const MessengerCallRepository =
    require("./messengerCallRepository");


class MessengerCallManager {

    constructor() {

        /*
         * Maps the temporary Messenger call ID
         * to the MongoDB Call document ID.
         *
         * Example:
         *
         * call_1728_xxxxx
         *        ↓
         * 68fxxxxx...
         */
        this.databaseCallIds = new Map();
    }


    /**
     * --------------------------------------------------------
     * Create and persist a new call
     * --------------------------------------------------------
     */
    async createCall(callerId, receiverId) {

        /*
         * First create the in-memory session.
         */
        const session =
            MessengerCallSession.createSession(
                callerId,
                receiverId
            );


        try {

            /*
             * Then create the persistent MongoDB record.
             */
            const databaseCall =
                await MessengerCallRepository.createCall({

                    caller: callerId,

                    receiver: receiverId,

                    status: session.status
                });


            /*
             * Remember the relationship between:
             *
             * Session call ID
             * and
             * MongoDB document ID
             */
            this.databaseCallIds.set(
                session.callId,
                databaseCall._id.toString()
            );


            return {
                session,
                databaseCall
            };

        } catch (error) {

            /*
             * If MongoDB creation fails, remove the
             * temporary session so we do not leave
             * an orphan active call in memory.
             */
            MessengerCallSession.removeSession(
                session.callId
            );

            throw error;
        }
    }


    /**
     * --------------------------------------------------------
     * Mark call as ringing
     * --------------------------------------------------------
     */
    async setRinging(callId) {

        const session =
            MessengerCallSession.setRinging(callId);

        const databaseCallId =
            this.getDatabaseCallId(callId);

        const databaseCall =
            await MessengerCallRepository.updateStatus(
                databaseCallId,
                "ringing"
            );

        return {
            session,
            databaseCall
        };
    }


    /**
     * --------------------------------------------------------
     * Mark call as connected
     * --------------------------------------------------------
     */
    async setConnected(callId) {

        const session =
            MessengerCallSession.setConnected(callId);

        const databaseCallId =
            this.getDatabaseCallId(callId);

        const databaseCall =
            await MessengerCallRepository.markConnected(
                databaseCallId,
                session.connectedAt
            );

        return {
            session,
            databaseCall
        };
    }


    /**
     * --------------------------------------------------------
     * Reject call
     * --------------------------------------------------------
     */
    async reject(
        callId,
        reason = "rejected"
    ) {

        const session =
            MessengerCallSession.reject(
                callId,
                reason
            );

        const databaseCallId =
            this.getDatabaseCallId(callId);

        const databaseCall =
            await MessengerCallRepository.markRejected(
                databaseCallId,
                reason
            );

        return {
            session,
            databaseCall
        };
    }


    /**
     * --------------------------------------------------------
     * End call
     * --------------------------------------------------------
     */
    async end(
        callId,
        reason = "ended"
    ) {

        const session =
            MessengerCallSession.end(
                callId,
                reason
            );

        const databaseCallId =
            this.getDatabaseCallId(callId);

        const databaseCall =
            await MessengerCallRepository.markEnded(
                databaseCallId,
                session.endedAt,
                session.duration,
                reason
            );

        /*
         * The session is now completed.
         *
         * We can remove the in-memory session.
         *
         * MongoDB remains the permanent record.
         */
        MessengerCallSession.removeSession(
            callId
        );

        this.databaseCallIds.delete(
            callId
        );

        return {
            session,
            databaseCall
        };
    }


    /**
     * --------------------------------------------------------
     * Get active session
     * --------------------------------------------------------
     */
    getSession(callId) {

        return MessengerCallSession.getSession(
            callId
        );
    }


    /**
     * --------------------------------------------------------
     * Get MongoDB Call ID
     * --------------------------------------------------------
     */
    getDatabaseCallId(callId) {

        const databaseCallId =
            this.databaseCallIds.get(callId);

        if (!databaseCallId) {

            throw new Error(
                "Database call record not found."
            );
        }

        return databaseCallId;
    }


    /**
     * --------------------------------------------------------
     * Check whether call is active
     * --------------------------------------------------------
     */
    isCallActive(callId) {

        const session =
            MessengerCallSession.getSession(
                callId
            );

        if (!session) {
            return false;
        }

        return (
            session.status !== "ended" &&
            session.status !== "rejected"
        );
    }


    /**
     * --------------------------------------------------------
     * Get active call count
     * --------------------------------------------------------
     */
    getActiveCallCount() {

        return MessengerCallSession
            .getActiveSessionCount();
    }
}


module.exports =
    new MessengerCallManager();