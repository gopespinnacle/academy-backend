const mongoose = require("mongoose");

const pushTokenSchema = new mongoose.Schema(
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
            unique: true,
            index: true
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
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("PushToken", pushTokenSchema);