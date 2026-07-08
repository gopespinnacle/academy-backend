const mongoose = require("mongoose");

const meetingParticipantSchema = new mongoose.Schema(

{

    // Meeting Reference
    meetingId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Meeting",

        required: true,

        index: true

    },

    // User Reference
    userId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,

        index: true

    },

    // User Information
    name: {

        type: String,

        required: true,

        trim: true

    },

    email: {

        type: String,

        default: ""

    },

    // Participant Role
    role: {

        type: String,

        enum: [

            "teacher",
            "assistant",
            "student",
            "founder"

        ],

        required: true

    },

    // Socket Connection
    socketId: {

        type: String,

        default: ""

    },

    // Device Information

    deviceType: {

        type: String,

        enum: [

            "desktop",
            "mobile",
            "tablet"

        ],

        default: "desktop"

    },

    platform: {

        type: String,

        default: ""

    },

    browser: {

        type: String,

        default: ""

    },

    // Live Status

    connectionStatus: {

        type: String,

        enum: [

            "connected",
            "reconnecting",
            "disconnected",
            "left"

        ],

        default: "connected"

    },

    // Camera

    cameraEnabled: {

        type: Boolean,

        default: false

    },

    // Microphone

    microphoneEnabled: {

        type: Boolean,

        default: false

    },

    // Screen Sharing

    screenSharing: {

        type: Boolean,

        default: false

    },

    // Raise Hand

    handRaised: {

        type: Boolean,

        default: false

    },

    // Network

    networkQuality: {

        type: String,

        enum: [

            "excellent",
            "good",
            "fair",
            "poor",
            "unknown"

        ],

        default: "unknown"

    },

    // Attendance

    joinedAt: {

        type: Date,

        default: Date.now

    },

    leftAt: {

        type: Date,

        default: null

    },

    totalDuration: {

        type: Number,

        default: 0

    },

    // Future Ready

    isActiveSpeaker: {

        type: Boolean,

        default: false

    },

    isMutedByTeacher: {

        type: Boolean,

        default: false

    }

},

{

    timestamps: true

}

);

module.exports = mongoose.model(
    "MeetingParticipant",
    meetingParticipantSchema
);