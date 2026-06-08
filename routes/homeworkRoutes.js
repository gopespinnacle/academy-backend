const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
storage: multer.memoryStorage()
});

const HomeworkUpload =
require("../models/HomeworkUpload");
const ClassSummary =
require("../models/ClassSummary");
const stream = require("stream");
const { google } = require("googleapis");

const oauth2Client =
new google.auth.OAuth2(

process.env.GOOGLE_CLIENT_ID,

process.env.GOOGLE_CLIENT_SECRET,

process.env.GOOGLE_REDIRECT_URI

);

oauth2Client.setCredentials({

refresh_token:
process.env.GOOGLE_REFRESH_TOKEN

});

const drive =
google.drive({

version:"v3",

auth:oauth2Client

});

router.post(
"/upload-homework",
upload.array("files"),

async(req,res)=>{

try{
if(
!req.files ||
req.files.length === 0
){

return res.status(400).json({

success:false,

message:"No files uploaded"

});

}
let uploadedFiles = [];

for(const file of req.files){

console.log(
"FILE RECEIVED:",
file.originalname
);

const bufferStream =
new stream.PassThrough();

bufferStream.end(
file.buffer
);

const media = {

mimeType:
file.mimetype,

body:
bufferStream

};

const fileMetadata = {

name:file.originalname,

parents:[
process.env.GOOGLE_FOLDER_ID
]

};

const response =
await drive.files.create({

requestBody:fileMetadata,

media,

fields:"id",

supportsAllDrives:true

});

const fileId =
response.data.id;

await drive.permissions.create({

fileId,

requestBody:{
role:"reader",
type:"anyone"
}

});

const link =
`https://drive.google.com/file/d/${fileId}/view`;

uploadedFiles.push({

fileName:file.originalname,

driveFileId:fileId,

driveLink:link

});

}

const hw =
new HomeworkUpload({

studentName:
req.body.studentName,

studentId:
req.body.studentId,

className:
req.body.className,

subject:
req.body.subject,

homeworkUniqueId:
req.body.homeworkUniqueId,

files:
uploadedFiles

});

await hw.save();

await ClassSummary.updateOne(

{

homeworkUniqueId:

req.body.homeworkUniqueId

},

{

homeworkStatus:

"Submitted"

}

);

res.json({

success:true,

link

});

}catch(err){

console.log(
"UPLOAD FULL ERROR:"
);

console.log(
err.response?.data || err
);

res.status(500).json({

success:false,

message:
err.message,

error:
err.response?.data || err

});

}

});

router.get(
"/teacher-homeworks",

async(req,res)=>{

const teacherName =
req.query.teacherName;

const studentName =
req.query.studentName;

const className =
req.query.className;

const subject =
req.query.subject;

let filter = {};

if(teacherName){

filter.teacherName =
teacherName;

}

if(studentName){

filter.studentName =
studentName;

}

if(className){

filter.className =
className;

}

if(subject){

filter.subject =
subject;

}

const summaries =
await ClassSummary.find(
filter
);

const uploads =
await HomeworkUpload.find();

let finalData = [];

summaries.forEach(s=>{

const upload =
uploads.find(x =>

x.homeworkUniqueId

===

s.homeworkUniqueId

);

finalData.push({

summaryId:
s._id,

homeworkUniqueId:
s.homeworkUniqueId,

homeworkStatus:
s.homeworkStatus,

teacherName:
s.teacherName,

studentName:
s.studentName,

className:
s.className,

subject:
s.subject,

homework:
s.homework,

date:
s.date,

driveLink:
upload ?
upload.driveLink
:
null

});
});

res.json(finalData);

});
module.exports =
router;