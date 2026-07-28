const mongoose = require("mongoose");

const demoVideoSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true,
        trim: true
    },

    teacherName: {
        type: String,
        required: true,
        trim: true
    },

    grade: {
        type: String,
        required: true
    },

    subject: {
        type: String,
        required: true
    },

    videoUrl: {
        type: String,
        required: true
    },

    fileName: {
        type: String,
        default: ""
    },

    duration: {
    type: Number,
    default: 0
},

views: {
    type: Number,
    default: 0
},

uploadDate: {
    type: Date,
    default: Date.now
}

});

module.exports = mongoose.model("DemoVideo", demoVideoSchema);