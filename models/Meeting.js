const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(

{
    // Unique Meeting ID
    meetingId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Room ID used by Socket/WebRTC
    roomId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    // Period Assignment Reference
    periodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PeriodAssignment",
        required: true
    },

    // Class Details
    className: {
        type: String,
        required: true,
        trim: true
    },

    subject: {
        type: String,
        required: true,
        trim: true
    },

    day: {
        type: String,
        required: true
    },

    startTime: {
        type: String,
        required: true
    },

    endTime: {
        type: String,
        required: true
    },

    // Main Teacher
    teacher: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },

    // Assistant Teacher (Optional)
    assistantTeacher: {

        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        name: {
            type: String,
            default: ""
        }

    },

    // Meeting Status
    status: {

        type: String,

        enum: [

            "scheduled",
            "live",
            "ended"

        ],

        default: "scheduled"

    },

    // Meeting Time

    meetingStartedAt: {

        type: Date,
        default: null

    },

    meetingEndedAt: {

        type: Date,
        default: null

    },

    // Live Statistics

    totalParticipants: {

        type: Number,
        default: 0

    },

    teacherPresent: {

        type: Boolean,
        default: false

    },

    assistantPresent: {

        type: Boolean,
        default: false

    },

    // Features

    recordingEnabled: {

        type: Boolean,
        default: false

    },

    whiteboardEnabled: {

        type: Boolean,
        default: true

    },

    screenSharingEnabled: {

        type: Boolean,
        default: true

    },

    chatEnabled: {

        type: Boolean,
        default: true

    },

    raiseHandEnabled: {

        type: Boolean,
        default: true

    },

    // Future Ready

    aiEnabled: {

        type: Boolean,
        default: false

    }

},

{
    timestamps: true
}

);

module.exports = mongoose.model("Meeting", meetingSchema);