const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema({

title:{
type:String,
required:true
},

className:{
type:String,
required:true
},

subject:{
type:String,
required:true
},

totalMarks:{
type:Number,
required:true
},
examDuration:{
type:Number
},

examStartTime:{
type:Date
},

questionPaper:{
type:String
},

sentToStudents:{
type:Boolean,
default:false
},

createdBy:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

date:{
type:Date,
default:Date.now
}

},{timestamps:true});

module.exports = mongoose.model("Assessment",assessmentSchema);