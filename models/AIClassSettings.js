const mongoose = require("mongoose");

const aiClassSettingsSchema = new mongoose.Schema({

    enabled: {
        type: Boolean,
        default: true
    },

    intervalMinutes: {
        type: Number,
        enum: [5, 10, 15, 20],
        default: 10
    },

    questionCount: {
        type: Number,
        enum: [1, 3, 6, 9],
        default: 3
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "AIClassSettings",
    aiClassSettingsSchema
);