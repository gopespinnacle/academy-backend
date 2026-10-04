/**
 * ============================================================
 * GPA MESSENGER
 * Messenger Call Model
 * ============================================================
 *
 * Stores persistent metadata for Messenger audio calls.
 *
 * IMPORTANT:
 *
 * - Actual audio recording is NOT stored in MongoDB.
 * - MongoDB stores only the recording reference.
 * - Audio files will be stored separately.
 * - Call records are automatically eligible for deletion
 *   after 30 days.
 *
 * ============================================================
 */

const mongoose = require("mongoose");

const messengerCallSchema = new mongoose.Schema(
    {
        /**
         * ------------------------------------------------------
         * Caller
         * ------------------------------------------------------
         */
        caller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        /**
         * ------------------------------------------------------
         * Receiver
         * ------------------------------------------------------
         */
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        /**
         * ------------------------------------------------------
         * Call Status
         * ------------------------------------------------------
         */
        status: {
            type: String,
            enum: [
                "initiating",
                "ringing",
                "connected",
                "rejected",
                "ended",
                "missed"
            ],
            default: "initiating",
            required: true
        },

        /**
         * ------------------------------------------------------
         * Call Start
         * ------------------------------------------------------
         *
         * Actual conversation start time.
         */
        startTime: {
            type: Date,
            default: null
        },

        /**
         * ------------------------------------------------------
         * Call End
         * ------------------------------------------------------
         */
        endTime: {
            type: Date,
            default: null
        },

        /**
         * ------------------------------------------------------
         * Call Duration
         * ------------------------------------------------------
         *
         * Stored in seconds.
         */
        duration: {
            type: Number,
            default: 0,
            min: 0
        },

        /**
         * ------------------------------------------------------
         * Recording Reference
         * ------------------------------------------------------
         *
         * This is NOT the audio file itself.
         *
         * Example:
         * S3/object-storage key or recording identifier.
         */
        recordingReference: {
            type: String,
            default: null
        },

        /**
         * ------------------------------------------------------
         * Recording Status
         * ------------------------------------------------------
         */
        recordingStatus: {
            type: String,
            enum: [
                "not_started",
                "recording",
                "processing",
                "available",
                "failed",
                "deleted"
            ],
            default: "not_started"
        },

        /**
         * ------------------------------------------------------
         * End Reason
         * ------------------------------------------------------
         */
        endReason: {
            type: String,
            default: null
        },

        /**
         * ------------------------------------------------------
         * Retention
         * ------------------------------------------------------
         *
         * Call metadata will be retained for 30 days.
         *
         * MongoDB TTL index will automatically remove
         * the document after expiresAt.
         */
        expiresAt: {
            type: Date,
            required: true,
            default: function () {
                return new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                );
            }
        }
    },
    {
        timestamps: true
    }
);

/**
 * ============================================================
 * INDEXES
 * ============================================================
 */

/**
 * Find calls involving a particular user.
 */
messengerCallSchema.index({
    caller: 1,
    createdAt: -1
});

messengerCallSchema.index({
    receiver: 1,
    createdAt: -1
});

/**
 * Useful for call monitoring/history.
 */
messengerCallSchema.index({
    status: 1,
    createdAt: -1
});

/**
 * ============================================================
 * 30-DAY AUTOMATIC RETENTION
 * ============================================================
 *
 * MongoDB removes the call document automatically when
 * expiresAt is reached.
 */
messengerCallSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
);

module.exports = mongoose.model(
    "MessengerCall",
    messengerCallSchema
);