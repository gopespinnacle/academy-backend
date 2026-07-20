const mongoose = require("mongoose");

const aiSettingsSchema = new mongoose.Schema({

    aiEnabled: {
        type: Boolean,
        default: true
    },

    allowedTeachers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Teacher"
    }],

    allowedDays: [{
        type: String
    }],

    startTime: {
        type: String,
        default: "09:00"
    },

    endTime: {
        type: String,
        default: "18:00"
    },

    dailyGenerationLimit: {
        type: Number,
        default: 10
    },

    monthlyGenerationLimit: {
        type: Number,
        default: 200
    },

    monthlyBudgetLimit: {
        type: Number,
        default: 10
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("AISettings", aiSettingsSchema);