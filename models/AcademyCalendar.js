const mongoose = require("mongoose");

const academyCalendarSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    eventType: {
        type: String,
        enum: [
            "Holiday",
            "Class",
            "Exam",
            "Test",
            "Assignment",
            "Meeting",
            "Event"
        ],
        required: true
    },

    grade: {
        type: String,
        default: "All"
    },

    subject: {
        type: String,
        default: ""
    },

    startDate: {
        type: Date,
        required: true
    },

    endDate: {
        type: Date,
        required: true
    },

    allDay: {
        type: Boolean,
        default: true
    },

    color: {
    type: String,
    default: "#0d6efd"
},

audience: {

    type: [String],

    default: [

        "Founder"

    ]

},

createdBy: {
    type: String,
    default: "Founder"
}

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "AcademyCalendar",
    academyCalendarSchema
);