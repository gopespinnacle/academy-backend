const crypto = require("crypto");

/**
 * Generate Human Readable Meeting ID
 * Example:
 * GPA-20260708-000001
 */
function generateMeetingId() {

    const now = new Date();

    const year = now.getFullYear();

    const month = String(now.getMonth() + 1).padStart(2, "0");

    const day = String(now.getDate()).padStart(2, "0");

    const random = String(
        Math.floor(Math.random() * 999999) + 1
    ).padStart(6, "0");

    return `GPA-${year}${month}${day}-${random}`;

}

/**
 * Generate Secure Room ID
 * Example:
 * room_x83KdL9pqA72bc
 */
function generateRoomId() {

    return "room_" + crypto.randomBytes(12).toString("hex");

}

/**
 * Returns current server time
 */
function getCurrentTime() {

    return new Date();

}

/**
 * Check whether meeting has started
 */
function hasMeetingStarted(meeting) {

    return meeting.status === "live";

}

/**
 * Check whether meeting has ended
 */
function hasMeetingEnded(meeting) {

    return meeting.status === "ended";

}

/**
 * Check whether meeting is scheduled
 */
function isMeetingScheduled(meeting) {

    return meeting.status === "scheduled";

}

/**
 * Validate Participant Role
 */
function isValidRole(role) {

    return [

        "teacher",

        "assistant",

        "student",

        "founder"

    ].includes(role);

}

/**
 * Maximum students allowed
 */
const MAX_STUDENTS = 20;

/**
 * Maximum assistant teachers
 */
const MAX_ASSISTANTS = 1;

/**
 * Maximum teachers
 */
const MAX_TEACHERS = 1;

/**
 * Total meeting participants
 */
const MAX_PARTICIPANTS =
    MAX_TEACHERS +
    MAX_ASSISTANTS +
    MAX_STUDENTS;

/**
 * Export Everything
 */
module.exports = {

    generateMeetingId,

    generateRoomId,

    getCurrentTime,

    hasMeetingStarted,

    hasMeetingEnded,

    isMeetingScheduled,

    isValidRole,

    MAX_TEACHERS,

    MAX_ASSISTANTS,

    MAX_STUDENTS,

    MAX_PARTICIPANTS

};