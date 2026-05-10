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

attendanceMarkedAt:Date

},{timestamps:true});

module.exports = mongoose.model("TeacherSession", teacherSessionSchema);