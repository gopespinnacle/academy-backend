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
const LessonPlan = require("../models/LessonPlan");
const Homework = require("../models/Homework");
const PeriodAssignment = require("../models/PeriodAssignment");
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

reviewedDocs: s.reviewedDocs || [],

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

router.post(

"/upload-reviewed-docs",

upload.array("files"),

async(req,res)=>{

try{

if(

!req.files ||

req.files.length===0

){

return res.json({

success:false,

message:"No files uploaded"

});

}

let uploadedDocs=[];

for(const file of req.files){

console.log(

"REVIEW DOC:",

file.originalname

);

const uploaded=

await s3.uploadFile(

file,

"Homework/ReviewedDocs"

);

uploadedDocs.push({

fileName:file.originalname,

s3Key:uploaded.Key,

s3Url:uploaded.Location,

uploadedAt:new Date()

});

}

await ClassSummary.updateOne(

{

_id:req.body.summaryId,

"reviewedDocs.studentId":

req.body.studentId

},

{

$push:{

"reviewedDocs.$.files":{

$each:uploadedDocs

}

}

}

);

await ClassSummary.updateOne(

{

_id:req.body.summaryId,

reviewedDocs:{

$not:{

$elemMatch:{

studentId:req.body.studentId

}

}

}

},

{

$push:{

reviewedDocs:{

studentId:req.body.studentId,

studentName:req.body.studentName,

files:uploadedDocs

}

}

}

);

res.json({

success:true,

message:"Reviewed documents uploaded."

});

}catch(err){

console.log(err);

res.json({

success:false,

message:err.message

});

}

});

router.post("/create-homework", async (req, res) => {

try{

let lessonPlan = await LessonPlan.findOne({

    teacherId: req.body.teacherId,

    className: req.body.className,

    subject: req.body.subject,

    date: req.body.date

});

if(lessonPlan){

    lessonPlan.lessons.push(...(req.body.lessons || []));

    await lessonPlan.save();

}else{

    lessonPlan = new LessonPlan({

        teacherId:req.body.teacherId,

        teacherName:req.body.teacherName,

        className:req.body.className,

        subject:req.body.subject,

        date:req.body.date,

        lessons:req.body.lessons || []

    });

    await lessonPlan.save();

}

// Find the assigned students for this period
const period = await PeriodAssignment.findOne({

    teacher: req.body.teacherId,

    className: req.body.className,

    subject: req.body.subject,

    day: req.body.day,

    startTime: req.body.startTime

}).populate("assignments.student");

if (period && period.assignments.length > 0) {

    for (const assignment of period.assignments) {

        const studentId = assignment.student._id;

        const alreadyExists = await Homework.findOne({

            lessonPlan: lessonPlan._id,

            student: studentId

        });

        if (!alreadyExists) {

            await Homework.create({

                lessonPlan: lessonPlan._id,

                student: studentId

            });

        }

    }

}

res.json({

success:true,

message:"Homework Created"

});

}catch(err){

console.error(err);

res.status(500).json({

success:false,

message:"Server Error"

});

}

});

router.post(

"/upload-lesson-material",

upload.array("files"),

async(req,res)=>{

try{

if(!req.files || req.files.length===0){

return res.json({

success:false,

message:"No files uploaded"

});



}

let uploadedDocs=[];

for(const file of req.files){

const uploaded=

await s3.uploadFile(

file,

"Homework/LessonMaterials"

);

uploadedDocs.push({

fileName:file.originalname,

s3Key:uploaded.Key,

s3Url:uploaded.Location

});

}

res.json({

success:true,

files:uploadedDocs

});

}catch(err){

console.log(err);

res.json({

success:false,

message:err.message

});

}

});

router.post(

"/upload-homework-document",

upload.array("files"),

async(req,res)=>{

try{

if(!req.files || req.files.length===0){

return res.json({

success:false,

message:"No files uploaded"

});

}

let uploadedDocs=[];

for(const file of req.files){

const uploaded=

await s3.uploadFile(

file,

"Homework/HomeworkDocuments"

);

uploadedDocs.push({

fileName:file.originalname,

s3Key:uploaded.Key,

s3Url:uploaded.Location

});

}

res.json({

success:true,

files:uploadedDocs

});

}catch(err){

console.log(err);

res.json({

success:false,

message:err.message

});

}

});



router.get("/lesson-plans", async (req, res) => {

try{

const teacherId = req.query.teacherId;

const plans = await LessonPlan.find({

teacherId: teacherId

}).sort({

date:-1,

createdAt:-1

});

res.json({

success:true,

data:plans

});

}catch(err){

console.log(err);

res.status(500).json({

success:false,

message:err.message

});

}

});

router.get("/lesson-plan/:id", async (req,res)=>{

try{

const lessonPlan =
await LessonPlan.findById(req.params.id);

if(!lessonPlan){

return res.status(404).json({

success:false,
message:"Lesson Plan not found"

});

}

res.json({

success:true,
data:lessonPlan

});

}catch(err){

res.status(500).json({

success:false,
message:err.message

});

}

});

router.put("/lesson-plan/:id", async(req,res)=>{

try{

const updated =
await LessonPlan.findByIdAndUpdate(

req.params.id,

req.body,

{

new:true

}

);

res.json({

success:true,
data:updated

});

}catch(err){

res.status(500).json({

success:false,
message:err.message

});

}

});

router.get("/student-homework/:studentId", async (req,res)=>{

try{

const studentId = req.params.studentId;

const data = await Homework.find({

student:studentId

})

.populate("lessonPlan")

.sort({

createdAt:-1

});

res.json({

success:true,

data

});

}catch(err){

console.log(err);

res.status(500).json({

success:false,

message:err.message

});

}

});

router.get("/teacher-submissions/:lessonPlanId", async (req, res) => {

    try {

        const submissions = await Homework.find({
            lessonPlan: req.params.lessonPlanId
        })
        .populate("student", "studentName name admissionNo")
        .lean();

        res.json({
            success: true,
            submissions
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;