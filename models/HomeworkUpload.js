const mongoose = require("mongoose");

const homeworkUploadSchema = new mongoose.Schema({

studentName:String,
studentId:String,

className:String,

subject:String,

fileName:String,

driveFileId:String,

driveLink:String,

uploadedAt:{
type:Date,
default:Date.now
}

});

module.exports =
mongoose.model(
"HomeworkUpload",
homeworkUploadSchema
);