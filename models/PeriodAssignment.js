const mongoose = require("mongoose");

const periodAssignmentSchema = new mongoose.Schema({

teacher: {
type: mongoose.Schema.Types.ObjectId,
ref: "User"
},

students: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
],

className: String,
subject: String,

day: String,
startTime: String,
endTime: String,

subjects: [String],
languages: [String],
eca: [String]

});

module.exports = mongoose.model("PeriodAssignment", periodAssignmentSchema);