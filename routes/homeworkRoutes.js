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
const s3 = require("../config/s3");

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
for (const file of req.files) {

    console.log(
        "FILE RECEIVED:",
        file.originalname
    );

    const uploaded = await s3.uploadFile(
        file,
        "Homework/StudentUploads"
    );

    uploadedFiles.push({

        fileName: file.originalname,

        s3Key: uploaded.Key,

        s3Url: uploaded.Location

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

summaryId:
req.body.summaryId,

files:
uploadedFiles

});

await hw.save();

await ClassSummary.updateOne(

{

_id: req.body.summaryId

},

{

homeworkStatus:

"Submitted"

}

);

res.json({

success:true,

message:
"Files uploaded successfully"

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

const uploadsForHomework =
uploads.filter(

x =>

x.summaryId

===

String(s._id)

);
finalData.push({

summaryId: String(s._id),

teacherName: s.teacherName,

className: s.className,

subject: s.subject,

homework: s.homework,

date: s.date,

students: s.students || [],

questionDocs: s.questionDocs || [],

files: uploadsForHomework

});
});

res.json(finalData);

});

router.post(

"/upload-question-docs",

upload.array("files"),

async(req,res)=>{

try{

if(

!req.files ||

req.files.length===0

){

return res.json({

success:false,

message:"No files"

});

}

let uploadedDocs = [];

for (const file of req.files) {

    console.log(
        "QUESTION DOC:",
        file.originalname
    );

    const uploaded = await s3.uploadFile(
        file,
        "Homework/Questions"
    );

    uploadedDocs.push({

        fileName: file.originalname,

        s3Key: uploaded.Key,

        s3Url: uploaded.Location

    });

}

const result = await ClassSummary.updateOne(

{
    _id: req.body.summaryId
},

{
    $push: {
        questionDocs: {
            $each: uploadedDocs
        }
    }
}

);

console.log(result);

res.json({

success:true

});

}catch(err){

console.log(err);

res.json({

success:false,

message:err.message

});

}

});

module.exports =
router;