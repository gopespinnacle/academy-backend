const mongoose = require("mongoose");

const studentAnswerSchema = new mongoose.Schema({

assessment:{
type: mongoose.Schema.Types.ObjectId,
ref:"Assessment"
},

student:{
type: mongoose.Schema.Types.ObjectId,
ref:"User"
},

answerFile:{
type:String
},

marks:{
type:Number,
default:null
},

submittedAt:{
type:Date,
default:Date.now
}

},{timestamps:true});

module.exports = mongoose.model("StudentAnswer",studentAnswerSchema);