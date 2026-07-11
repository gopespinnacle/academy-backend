const mongoose = require("mongoose");

const teacherSessionSchema = new mongoose.Schema({

teacher:{
type: mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

schedule:{
type: mongoose.Schema.Types.ObjectId,
ref:"TeacherSchedule"
},

className:String,

subject:String,

date:{
type:Date,
required:true
},

startTime:String,
endTime:String,

attendanceOpenTime:String,

status:{
type:String,
enum:["Pending","Present","Late","Absent"],
default:"Pending"
},

lateMinutes:{
type:Number,
default:0
},
compensationMinutes:{
type:Number,
default:0
},

compensationStatus:{
type:String,
default:"Pending"
},
compensationMinutes:{
type:Number,
default:0
},

meetingLink:String,
joinedStudents:[
{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
}
],
joinBufferMinutes:{
type:Number,
default:10
},

lateJoinRequests:[
{
student:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},
approved:{
type:Boolean,
default:false
}
}
],

attendanceMarkedAt:Date,

// ===============================
// LIVE CLASS SESSION
// ===============================

ssessionId: String,

teacherName: String,

periodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PeriodAssignment"
},

chapter: String,

day: String,

period: String,

chapter: String,

day: String,

period: String,

scheduledStart: String,

scheduledEnd: String,

teacherJoined: Date,

teacherLeft: Date,

teacherLateBy: Number,

teacherDuration: Number,

teacherRejoinedCount: {
    type: Number,
    default: 0
},

teacherNetworkDisconnectTime: {
    type: Number,
    default: 0
},

classStarted: Date,

classEnded: Date,

actualClassDuration: Number

},{timestamps:true});

module.exports = mongoose.model("TeacherSession", teacherSessionSchema);