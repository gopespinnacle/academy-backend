
const mongoose = require("mongoose");

const championshipPasswordOTPSchema = new mongoose.Schema({
    participantUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    otpHash: {
        type: String,
        required: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    attempts: {
        type: Number,
        default: 0
    },

    lastSentAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model(
    "ChampionshipPasswordOTP",
    championshipPasswordOTPSchema
);
