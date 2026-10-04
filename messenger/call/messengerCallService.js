/**
 * GPA Messenger
 * Audio Call Service
 *
 * This file is responsible only for
 * managing the basic call state.
 *
 * WebRTC, Socket.IO signaling,
 * recording and TURN will be handled
 * by separate modules.
 */

class MessengerCallService {

    constructor() {
        this.activeCalls = new Map();
    }

    /**
     * Start a call
     */
    startCall(callerId, receiverId) {

        if (!callerId) {
            throw new Error("Caller ID is required.");
        }

        if (!receiverId) {
            throw new Error("Receiver ID is required.");
        }

        if (callerId === receiverId) {
            throw new Error("User cannot call themselves.");
        }

        const callId = this.createCallId();

        const call = {
            callId,
            callerId,
            receiverId,
            status: "initiating",
            startTime: null,
            endTime: null,
            duration: 0
        };

        this.activeCalls.set(callId, call);

        console.log(
            `[GPA CALL] Call created: ${callId}`
        );

        return call;
    }

    /**
     * Mark a call as connected
     */
    connectCall(callId) {

        const call = this.activeCalls.get(callId);

        if (!call) {
            throw new Error("Call not found.");
        }

        call.status = "connected";
        call.startTime = new Date();

        console.log(
            `[GPA CALL] Call connected: ${callId}`
        );

        return call;
    }

    /**
     * End a call
     */
    endCall(callId) {

        const call = this.activeCalls.get(callId);

        if (!call) {
            throw new Error("Call not found.");
        }

        call.endTime = new Date();

        if (call.startTime) {
            call.duration = Math.floor(
                (call.endTime.getTime() - call.startTime.getTime()) / 1000
            );
        }

        call.status = "ended";

        console.log(
            `[GPA CALL] Call ended: ${callId} | Duration: ${call.duration}s`
        );

        return call;
    }

    /**
     * Get current call
     */
    getCallStatus(callId) {

        return this.activeCalls.get(callId) || null;
    }

    /**
     * Generate unique call ID
     */
    createCallId() {

        return `call_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 10)}`;
    }
}

module.exports = new MessengerCallService();