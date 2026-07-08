const Meeting = require("../models/Meeting");
const MeetingParticipant = require("../models/MeetingParticipant");
const MeetingState = require("../models/MeetingState");
const PeriodAssignment = require("../models/PeriodAssignment");
const User = require("../models/User");

const {
    generateMeetingId,
    generateRoomId
} = require("../utils/meetingUtils");

/**
 * ============================================================
 * CREATE MEETING
 * ============================================================
 */

async function createMeeting(periodId) {

    // Check Period Assignment
    const period = await PeriodAssignment
        .findById(periodId)
        .populate("teacher")
        .populate("assistantTeacher")
        .populate("assignments.student");

    if (!period) {
        throw new Error("Period Assignment not found.");
    }

    // Check Existing Live Meeting
    const existingMeeting = await Meeting.findOne({
        periodId,
        status: { $in: ["scheduled", "live"] }
    });

    if (existingMeeting) {
        return existingMeeting;
    }

    // Create Meeting
    const meeting = await Meeting.create({

        meetingId: generateMeetingId(),

        roomId: generateRoomId(),

        periodId: period._id,

        className: period.className,

        subject: period.subject,

        day: period.day,

        startTime: period.startTime,

        endTime: period.endTime,

        teacher: {

            id: period.teacher._id,

            name: period.teacher.name

        },

        assistantTeacher: period.assistantTeacher ? {

            id: period.assistantTeacher._id,

            name: period.assistantTeacher.name

        } : {

            id: null,

            name: ""

        }

    });

    // Create Meeting State

    await MeetingState.create({

        meetingId: meeting._id

    });

    return meeting;

}

/**
 * ============================================================
 * GET MEETING
 * ============================================================
 */

async function getMeeting(meetingId) {

    return await Meeting.findById(meetingId);

}

/**
 * ============================================================
 * GET MEETING USING ROOM ID
 * ============================================================
 */

async function getMeetingByRoom(roomId) {

    return await Meeting.findOne({

        roomId

    });

}

/**
 * ============================================================
 * START MEETING
 * ============================================================
 */

async function startMeeting(meetingId) {

    return await Meeting.findByIdAndUpdate(

        meetingId,

        {

            status: "live",

            teacherPresent: true,

            meetingStartedAt: new Date()

        },

        {

            new: true

        }

    );

}

/**
 * ============================================================
 * END MEETING
 * ============================================================
 */

async function endMeeting(meetingId) {

    return await Meeting.findByIdAndUpdate(

        meetingId,

        {

            status: "ended",

            meetingEndedAt: new Date()

        },

        {

            new: true

        }

    );

}

/**
 * ============================================================
 * JOIN MEETING
 * ============================================================
 */

async function joinMeeting({

    meetingId,

    user,

    socketId,

    role,

    deviceType = "desktop",

    platform = "",

    browser = ""

}) {

    let participant = await MeetingParticipant.findOne({

        meetingId,

        userId: user._id

    });

    if (participant) {

        participant.socketId = socketId;

        participant.connectionStatus = "connected";

        participant.joinedAt = new Date();

        participant.deviceType = deviceType;

        participant.platform = platform;

        participant.browser = browser;

        await participant.save();

        return participant;

    }

    participant = await MeetingParticipant.create({

        meetingId,

        userId: user._id,

        name: user.name,

        email: user.email,

        role,

        socketId,

        deviceType,

        platform,

        browser

    });

    await Meeting.findByIdAndUpdate(

        meetingId,

        {

            $inc: {

                totalParticipants: 1

            }

        }

    );

    return participant;

}

/**
 * ============================================================
 * LEAVE MEETING
 * ============================================================
 */

async function leaveMeeting(meetingId, userId) {

    const participant = await MeetingParticipant.findOne({

        meetingId,

        userId

    });

    if (!participant) return;

    participant.connectionStatus = "left";

    participant.leftAt = new Date();

    participant.totalDuration = Math.floor(

        (participant.leftAt - participant.joinedAt) / 1000

    );

    await participant.save();

    await Meeting.findByIdAndUpdate(

        meetingId,

        {

            $inc: {

                totalParticipants: -1

            }

        }

    );

}

/**
 * ============================================================
 * GET PARTICIPANTS
 * ============================================================
 */

async function getParticipants(meetingId) {

    return await MeetingParticipant.find({

        meetingId,

        connectionStatus: "connected"

    });

}

module.exports = {

    createMeeting,

    getMeeting,

    getMeetingByRoom,

    startMeeting,

    endMeeting,

    joinMeeting,

    leaveMeeting,

    getParticipants

};