const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema({
    className: String,
    subject: String,
    teacherId: String,
    videoUrl: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Recording", recordingSchema);