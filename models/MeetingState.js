const mongoose = require("mongoose");

const meetingStateSchema = new mongoose.Schema(

{

    // Meeting Reference
    meetingId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Meeting",

        required: true,

        unique: true,

        index: true

    },

    // Meeting Status

    isLive: {

        type: Boolean,

        default: false

    },

    // Whiteboard

    whiteboardLocked: {

        type: Boolean,

        default: false

    },

    whiteboardPage: {

        type: Number,

        default: 1

    },

    currentTool: {

        type: String,

        default: "pen"

    },

    currentColor: {

        type: String,

        default: "#000000"

    },

    currentThickness: {

        type: Number,

        default: 2

    },

    // PDF

    currentPDF: {

        type: String,

        default: ""

    },

    currentPDFPage: {

        type: Number,

        default: 1

    },

    pdfZoom: {

        type: Number,

        default: 1

    },

    // PPT

    currentPPT: {

        type: String,

        default: ""

    },

    currentSlide: {

        type: Number,

        default: 1

    },

    // Image Teaching

    currentImage: {

        type: String,

        default: ""

    },

    // Screen Sharing

    isScreenSharing: {

        type: Boolean,

        default: false

    },

    screenSharerId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "User",

        default: null

    },

    // Recording

    isRecording: {

        type: Boolean,

        default: false

    },

    recordingStartedAt: {

        type: Date,

        default: null

    },

    // Chat

    chatLocked: {

        type: Boolean,

        default: false

    },

    // Raise Hand

    raiseHandEnabled: {

        type: Boolean,

        default: true

    },

    // Future Features

    liveQuizRunning: {

        type: Boolean,

        default: false

    },

    currentPollId: {

        type: String,

        default: ""

    }

},

{

    timestamps: true

}

);

module.exports = mongoose.model(
    "MeetingState",
    meetingStateSchema
);