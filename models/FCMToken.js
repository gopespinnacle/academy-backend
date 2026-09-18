const mongoose = require("mongoose");

const fcmTokenSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        token: {
            type: String,
            required: true,
            unique: true
        },

        platform: {
            type: String,
            enum: ["web", "android"],
            required: true
        },

        deviceId: {
            type: String,
            default: ""
        },

        lastSeenAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("FCMToken", fcmTokenSchema);