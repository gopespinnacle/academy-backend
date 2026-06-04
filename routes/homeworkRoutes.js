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
upload.single("file"),

async(req,res)=>{

try{
if(!req.file){

return res.status(400).json({
success:false,
message:"No file uploaded"
});

}
  console.log("FILE RECEIVED:", req.file.originalname);
const bufferStream =
new stream.PassThrough();

bufferStream.end(
req.file.buffer
);

const media = {

mimeType:
req.file.mimetype,

body:
bufferStream

};

const fileMetadata = {
 name:req.file.originalname,
 parents:[
   process.env.GOOGLE_FOLDER_ID
 ]
};

console.log(
"FOLDER ID:",
process.env.GOOGLE_FOLDER_ID
);
console.log(
"UPLOAD PARENTS:",
fileMetadata.parents
);
console.log(
"Uploading to Google Drive..."
);

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

const hw =
new HomeworkUpload({

homeworkId:
req.body.homeworkId,

studentName:
req.body.studentName,

studentId:
req.body.studentId,

className:
req.body.className,

subject:
req.body.subject,

fileName:
req.file.originalname,

driveFileId:
fileId,

driveLink:
link

});

await hw.save();

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

String(
x.homeworkId
)

===

String(
s._id
)

);

finalData.push({

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