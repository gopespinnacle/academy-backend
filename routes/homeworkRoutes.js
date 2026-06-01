const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
storage: multer.memoryStorage()
});

const HomeworkUpload =
require("../models/HomeworkUpload");

const { google } = require("googleapis");

const credentials =
JSON.parse(
process.env.GOOGLE_CREDENTIALS
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

const fileMetadata = {

name:req.file.originalname,

parents:[
process.env.GOOGLE_FOLDER_ID
]

};

const media = {

mimeType:req.file.mimetype,

body: Buffer.from(
req.file.buffer
)

};

const response =
await drive.files.create({

resource:fileMetadata,

media,

fields:"id"

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

console.log(err);

res.status(500).json({
success:false
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