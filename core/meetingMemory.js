/**
 * ============================================================
 * Gopes Pinnacle Academy
 * Virtual Classroom V2
 * Live Meeting Memory
 * ============================================================
 *
 * This file stores ONLY live runtime data.
 * Nothing here is stored permanently in MongoDB.
 *
 * If the server restarts,
 * this memory is automatically rebuilt as users join.
 */

const meetingMemory = {

    /**
     * roomId -> participants
     */
    participants: {},

    /**
     * roomId -> waiting room users
     */
    waitingRoom: {},

    /**
     * roomId -> whiteboard drawings
     */
    whiteboard: {},

    /**
     * roomId -> board locked
     */
    boardLock: {},

    /**
     * roomId -> teacher given control
     */
    boardControl: {},

    /**
     * roomId -> raised hands
     */
    raisedHands: {},

    /**
     * roomId -> active screen share
     */
    screenShare: {},

    /**
     * roomId -> meeting state
     */
    meetingState: {},

    /**
     * roomId -> recording state
     */
    recording: {},

    /**
     * roomId -> teacher attendance
     */
    teacherAttendance: {}

};

module.exports = meetingMemory;