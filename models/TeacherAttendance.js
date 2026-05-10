const mongoose = require("mongoose");

const teacherAttendanceSchema = new mongoose.Schema({

teacher:{
type: mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

teacherName: String,

className: String,
subject: String,
day: String,

startTime: String,

date:{
type:Date,
default:Date.now
},

joinTime: Date,
endTime: Date,

status:{
type:String,
enum:["Present","Late","Absent"],
default:"Absent"
},

lateMinutes: Number,
compensationMinutes: Number,

usedMinutes: {
    type: Number,
    default: 0
}
},{timestamps:true});


module.exports = mongoose.model("TeacherAttendance", teacherAttendanceSchema);