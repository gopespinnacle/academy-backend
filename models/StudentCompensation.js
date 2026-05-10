const mongoose = require("mongoose");

const studentCompensationSchema = new mongoose.Schema({

teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
},

student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
},

className: String,
subject: String,
period: String,

totalMinutes: {
    type: Number,
    default: 0
},

usedMinutes: {
    type: Number,
    default: 0
}

},{timestamps:true});

module.exports = mongoose.model("StudentCompensation", studentCompensationSchema);