/**
 * ============================================================
 * GPA MESSENGER
 * Call Repository
 * ============================================================
 *
 * Responsible only for MongoDB operations related to
 * Messenger audio calls.
 *
 * This file does NOT handle:
 *
 * - Permissions
 * - Socket.IO
 * - WebRTC
 * - Call session logic
 * - Recording
 *
 * ============================================================
 */

const MessengerCall = require("../../models/MessengerCall");

class MessengerCallRepository {

    /**
     * --------------------------------------------------------
     * Create a new call record
     * --------------------------------------------------------
     */
    async createCall(data) {

        if (!data) {
            throw new Error(
                "Call data is required."
            );
        }

        if (!data.caller) {
            throw new Error(
                "Caller is required."
            );
        }

        if (!data.receiver) {
            throw new Error(
                "Receiver is required."
            );
        }

        const call = await MessengerCall.create({
            caller: data.caller,
            receiver: data.receiver,
            status: data.status || "initiating",
            startTime: data.startTime || null,
            endTime: data.endTime || null,
            duration: data.duration || 0,
            recordingReference:
                data.recordingReference || null,
            recordingStatus:
                data.recordingStatus || "not_started",
            endReason:
                data.endReason || null
        });

        return call;
    }

    /**
     * --------------------------------------------------------
     * Get call by ID
     * --------------------------------------------------------
     */
    async getCallById(callId) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        return await MessengerCall
            .findById(callId)
            .populate(
                "caller",
                "name role studentId teacherId adminId"
            )
            .populate(
                "receiver",
                "name role studentId teacherId adminId"
            );
    }

    /**
     * --------------------------------------------------------
     * Update call status
     * --------------------------------------------------------
     */
    async updateStatus(callId, status) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        if (!status) {
            throw new Error(
                "Call status is required."
            );
        }

        return await MessengerCall.findByIdAndUpdate(
            callId,
            {
                status
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    /**
     * --------------------------------------------------------
     * Mark call as connected
     * --------------------------------------------------------
     */
    async markConnected(callId, startTime = new Date()) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        return await MessengerCall.findByIdAndUpdate(
            callId,
            {
                status: "connected",
                startTime
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    /**
     * --------------------------------------------------------
     * Mark call as rejected
     * --------------------------------------------------------
     */
    async markRejected(
        callId,
        reason = "rejected"
    ) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        return await MessengerCall.findByIdAndUpdate(
            callId,
            {
                status: "rejected",
                endTime: new Date(),
                endReason: reason
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    /**
     * --------------------------------------------------------
     * Mark call as ended
     * --------------------------------------------------------
     */
    async markEnded(
        callId,
        endTime = new Date(),
        duration = 0,
        reason = "ended"
    ) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        return await MessengerCall.findByIdAndUpdate(
            callId,
            {
                status: "ended",
                endTime,
                duration,
                endReason: reason
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    /**
     * --------------------------------------------------------
     * Save recording reference
     * --------------------------------------------------------
     */
    async saveRecordingReference(
        callId,
        recordingReference
    ) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        if (!recordingReference) {
            throw new Error(
                "Recording reference is required."
            );
        }

        return await MessengerCall.findByIdAndUpdate(
            callId,
            {
                recordingReference,
                recordingStatus: "available"
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    /**
     * --------------------------------------------------------
     * Update recording status
     * --------------------------------------------------------
     */
    async updateRecordingStatus(
        callId,
        recordingStatus
    ) {

        if (!callId) {
            throw new Error(
                "Call ID is required."
            );
        }

        if (!recordingStatus) {
            throw new Error(
                "Recording status is required."
            );
        }

        return await MessengerCall.findByIdAndUpdate(
            callId,
            {
                recordingStatus
            },
            {
                new: true,
                runValidators: true
            }
        );
    }

    /**
     * --------------------------------------------------------
     * Get user's call history
     * --------------------------------------------------------
     *
     * This returns calls where the user is either
     * caller or receiver.
     */
    async getUserCalls(
        userId,
        limit = 50
    ) {

        if (!userId) {
            throw new Error(
                "User ID is required."
            );
        }

        return await MessengerCall
            .find({
                $or: [
                    { caller: userId },
                    { receiver: userId }
                ]
            })
            .sort({
                createdAt: -1
            })
            .limit(limit)
            .populate(
                "caller",
                "name role studentId teacherId adminId"
            )
            .populate(
                "receiver",
                "name role studentId teacherId adminId"
            );
    }

    /**
     * --------------------------------------------------------
     * Get all calls
     * --------------------------------------------------------
     *
     * This method will later be protected by the
     * Founder-only monitoring layer.
     */
    async getAllCalls(limit = 100) {

        return await MessengerCall
            .find({})
            .sort({
                createdAt: -1
            })
            .limit(limit)
            .populate(
                "caller",
                "name role studentId teacherId adminId"
            )
            .populate(
                "receiver",
                "name role studentId teacherId adminId"
            );
    }
}

module.exports = new MessengerCallRepository();