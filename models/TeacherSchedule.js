const mongoose = require("mongoose");

const teacherScheduleSchema = new mongoose.Schema({

teacher:{
type: mongoose.Schema.Types.ObjectId,
ref:"User",
required:true
},

day:{
type:String,
required:true
},

className:{
type:String,
required:true
},

subject:{
type:String,
default:""
},
eca:{
type:String,
default:""
},
language:{
type:String,
default:""
},

startTime:{
type:String,
required:true
},

endTime:{
type:String,
required:true
}

},{timestamps:true});

module.exports = mongoose.model("TeacherSchedule", teacherScheduleSchema);