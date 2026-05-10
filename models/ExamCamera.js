const mongoose = require("mongoose");

const examCameraSchema = new mongoose.Schema({

student:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

assessment:{
type:mongoose.Schema.Types.ObjectId,
ref:"Assessment"
},

image:{
type:String
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("ExamCamera",examCameraSchema);