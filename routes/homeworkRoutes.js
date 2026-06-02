const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
storage: multer.memoryStorage()
});

const HomeworkUpload =
require("../models/HomeworkUpload");
const stream = require("stream");
const { google } = require("googleapis");

console.log(
"GOOGLE ENV EXISTS:",
!!process.env.GOOGLE_CREDENTIALS
);

const credentials =
JSON.parse(
process.env.GOOGLE_CREDENTIALS.trim()
);

console.log(
"EMAIL:",
credentials.client_email
);

console.log(
"PROJECT:",
credentials.project_id
);

console.log(
"PRIVATE KEY START:",
credentials.private_key.substring(0,50)
);

credentials.private_key =
credentials.private_key
.replace(/\\\\n/g,"\n")
.replace(/\\n/g,"\n");

console.log(
"PRIVATE KEY START:",
credentials.private_key.substring(0,50)
);

console.log(
"PRIVATE KEY LENGTH:",
credentials.private_key.length
);

const auth =
new google.auth.GoogleAuth({

credentials,

scopes:[
"https://www.googleapis.com/auth/drive"
]

});

const drive =
google.drive({
version:"v3",
auth
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
console.log("Uploading to Google Drive...");
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

supportsAllDrives:true,

requestBody:{
role:"reader",
type:"anyone"
}

});

const link =
`https://drive.google.com/file/d/${fileId}/view`;

const hw =
new HomeworkUpload({

studentName:req.body.studentName,

studentId:req.body.studentId,

className:req.body.className,

subject:req.body.subject,

fileName:req.file.originalname,

driveFileId:fileId,

driveLink:link

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

const data =
await HomeworkUpload
.find()
.sort({
uploadedAt:-1
});

res.json(data);

});

module.exports =
router;