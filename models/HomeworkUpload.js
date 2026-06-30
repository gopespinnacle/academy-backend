const mongoose = require("mongoose");

const homeworkUploadSchema = new mongoose.Schema({

studentName:String,
studentId:String,

className:String,

subject:String,

summaryId:String,

files:[

{

fileName:String,

s3Key:String,

s3Url:String

}

],

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