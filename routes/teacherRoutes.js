const express = require("express");
const router = express.Router();
const { createAssessment, getTeacherAssessments, giveMarks } = require("../controllers/assessmentController");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const User = require("../models/User");
const Attendance = require("../models/TeacherAttendance");
const Assessment = require("../models/Assessment");
const Marks = require("../models/Marks");
const AuditLog = require("../models/AuditLog");
const TeacherStudentMap = require("../models/TeacherStudentMap");
const TeacherSession = require("../models/TeacherSession");
const CompensationClass = require("../models/CompensationClass");
const Homework = require("../models/Homework");
const StudentAnswer = require("../models/StudentAnswer");
const ExamActivity = require("../models/ExamActivity");
const ExamCamera = require("../models/ExamCamera");
const PeriodAssignment = require("../models/PeriodAssignment");
const TeacherSchedule = require("../models/TeacherSchedule");

const { protect, authorize } = require("../middleware/authMiddleware");

/* ================= MULTER ================= */

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/");
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+"-"+file.originalname);
    }
});

const upload = multer({storage});

/* ================= TEACHER CLASSES ================= */

router.get("/classes", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacher = await User.findById(decoded.id);

        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({
            classes: teacher.assignedClasses || []
        });

    } catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
});

/* ================= ATTENDANCE ================= */
const { markTeacherAttendance } = require("../controllers/teacherAttendanceController");
router.post("/attendance", async (req,res)=>{
    const result = await markTeacherAttendance(req.body);
    res.json(result);
});
const TeacherAttendance = require("../models/TeacherAttendance");

router.get("/get-attendance", async (req,res)=>{
try{

const { className, day, startTime } = req.query;

const attendance = await TeacherAttendance.findOne({
className,
day,
startTime,
date: {
$gte: new Date(new Date().setHours(0,0,0,0)),
$lte: new Date(new Date().setHours(23,59,59,999))
}
}).sort({ createdAt: -1 }); // 🔥 VERY IMPORTANT

res.json({ data: attendance });

}catch(err){
res.status(500).json({ message:"Error fetching attendance" });
}
});
/* ================= CREATE ASSESSMENT ================= */

router.post("/create-assessment", upload.single("pdf"), async (req,res)=>{
    const result = await createAssessment(req.user.id, req.body, req.file);
    res.json(result);
});

router.put("/give-marks/:answerId", async (req,res)=>{
    const result = await giveMarks(req.params.answerId, req.body.marks);
    res.json(result);
});

/* ================= SUBMIT MARKS ================= */

router.post("/submit-marks", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacher = await User.findById(decoded.id);

        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { assessmentId, studentId, marksObtained } = req.body;

        const existing = await Marks.findOne({ studentId, assessmentId });

        if (existing) {

            if (existing.isLocked && !existing.modificationApproved) {
                return res.status(403).json({
                    message: "Marks are locked. Request founder approval."
                });
            }

            const oldMarks = existing.marksObtained;

            existing.marksObtained = marksObtained;
            existing.isLocked = true;
            existing.modificationApproved = false;
            existing.modificationRequested = false;

            await existing.save();

            const student = await User.findById(existing.studentId);
            const assessment = await Assessment.findById(existing.assessmentId);

            await AuditLog.create({
                performedBy: {
                    userId: teacher._id,
                    name: teacher.name,
                    role: teacher.role
                },
                actionType: "MARK_UPDATE",
                target: {
                    targetId: existing.studentId,
                    targetName: student?.name || "Unknown",
                    targetType: "Student"
                },
                oldValue: oldMarks,
                newValue: marksObtained,
                severity: "normal"
            });

            return res.json({ message: "Marks updated and locked again." });
        }

        const newMarks = new Marks({
            studentId,
            assessmentId,
            marksObtained,
            isLocked: true
        });

        await newMarks.save();

        res.json({ message: "Marks saved and locked." });

    } catch (error) {
        res.status(500).json({ message: "Error saving marks" });
    }
});

/* ================= VIEW ASSESSMENTS ================= */

router.get("/assessments", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacher = await User.findById(decoded.id);

        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        const assessments = await Assessment.find({
            createdBy: teacher._id
        });

        res.json({ assessments });

    } catch (error) {
        res.status(500).json({ message: "Error fetching assessments" });
    }
});

/* ================= TEACHER STUDENTS ================= */

router.get("/students", protect, authorize("teacher"), async (req,res)=>{
    try{
        const { className, subject } = req.query;

        const data = await TeacherStudentMap.find({
            teacher: req.user.id,
            className,
            subject
        }).populate("student","name grade");

        res.json({data});

    }catch(err){
        res.status(500).json({message:"Error loading students"});
    }
});

/* ================= REQUEST MODIFICATION ================= */

router.post("/request-modification", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacher = await User.findById(decoded.id);

        if (!teacher || teacher.role !== "teacher") {
            return res.status(403).json({ message: "Access denied" });
        }

        const { assessmentId, studentId } = req.body;

        const mark = await Marks.findOne({ assessmentId, studentId });

        if (!mark) {
            return res.status(404).json({ message: "Mark not found" });
        }

        mark.modificationRequested = true;
        mark.modificationApproved = false;
        mark.isLocked = true;

        await mark.save();

        res.json({ message: "Modification request sent to founder" });

    } catch (error) {
        res.status(500).json({ message: "Error requesting modification" });
    }
});

/* ================= TODAY SESSIONS ================= */

router.get("/today-sessions", protect, authorize("teacher"), async (req,res)=>{
    try{
        const teacherId = req.user.id;

        const today = new Date();
        const startOfDay = new Date(today.setHours(0,0,0,0));
        const endOfDay = new Date(today.setHours(23,59,59,999));

        const sessions = await TeacherSession.find({
            teacher: teacherId,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        res.json({sessions});

    }catch(err){
        res.status(500).json({message:"Error loading sessions"});
    }
});

/* ================= MARK SESSION PRESENT ================= */

router.put("/mark-session-present/:id", protect, authorize("teacher"), async (req,res)=>{
    try{
        const session = await TeacherSession.findById(req.params.id);

        if(!session){
            return res.status(404).json({message:"Session not found"});
        }

        const now = new Date();

        const [startHour,startMinute] = session.startTime.split(":");

        const sessionStart = new Date(session.date);
        sessionStart.setHours(startHour,startMinute,0);

        const bufferEnd = new Date(sessionStart.getTime() + (10 * 60000));

        let lateMinutes = 0;
        let status = "Present";

        if(now > bufferEnd){
            lateMinutes = Math.floor((now - sessionStart)/60000);

            const [endHour,endMinute] = session.endTime.split(":");
            const sessionEnd = new Date(session.date);
            sessionEnd.setHours(endHour,endMinute,0);

            const maxLate = Math.floor((sessionEnd - sessionStart)/60000);

            if(lateMinutes > maxLate){
                lateMinutes = maxLate;
            }

            status = "Late";
        }

        session.status = status;
        session.lateMinutes = lateMinutes;
        session.compensationMinutes = lateMinutes;

        await session.save();

        res.json({ message:"Attendance updated", status, lateMinutes });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= HOMEWORK ================= */
const { createHomework } = require("../controllers/homeworkController");
router.post("/homework", protect, authorize("teacher"), async (req,res)=>{
    const result = await createHomework(req.user.id, req.body);
    res.json(result);
});

/* ================= PERIOD STUDENTS ================= */

router.get("/period-students", protect, authorize("teacher"), async (req,res)=>{
    try{
        const teacherId = req.user.id;

        const { className, subject, language, eca, day, startTime } = req.query;

        let filter = {
            teacher: teacherId,
            className: className?.trim(),
            day: day?.trim(),
            startTime: startTime
        };

        let orConditions = [];

        if(subject) orConditions.push({ subject });
        if(language) orConditions.push({ languages: { $in: [language] } });
        if(eca) orConditions.push({ eca: { $in: [eca] } });

        if(orConditions.length > 0){
            filter.$or = orConditions;
        }

        const data = await PeriodAssignment.find(filter)
        .populate("student","name");

        res.json({data});

    }catch(err){
        res.status(500).json({message:"Error"});
    }
});
router.get("/schedule", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacherId = decoded.id;

        const schedule = await TeacherSchedule.find({
            teacher: teacherId
        });

        res.json({ schedule });

    } catch (err) {
        res.status(500).json({ message: "Error loading schedule" });
    }
});

router.get("/all-period-assignments", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacherId = decoded.id;

        const data = await PeriodAssignment.find({
            teacher: teacherId
        }).populate("student", "name");

        res.json({ data });

    } catch (err) {
        console.log(err); // 🔥 ADD THIS (important)
        res.status(500).json({ message: "Error loading assignments" });
    }
});

router.post("/end-attendance", async (req,res)=>{
try{

const { teacherId, className, day, startTime, endTime } = req.body;

const attendance = await Attendance.findOne({
teacher: teacherId,
className,
day,
startTime
}).sort({ createdAt: -1 });

if(attendance){

attendance.endTime = endTime;

const join = new Date(attendance.joinTime);
const end = new Date(endTime);

// class end
const [hour, minute] = startTime.split(":");

const classStart = new Date();
classStart.setHours(hour, minute, 0);

const classEnd = new Date(classStart.getTime() + 60 * 60000);

/* 🔥 EARLY LEAVE */
if(end < classEnd){

const earlyMinutes = Math.floor((classEnd - end) / 60000);

attendance.compensationMinutes += earlyMinutes;
}

await attendance.save();
}

res.json({ message: "End time saved ✅" });

}catch(err){
res.status(500).json({ message:"Error" });
}
});

router.get("/attendance-today", async (req,res)=>{
try{

const { teacherId, className, day, startTime } = req.query;

const startOfDay = new Date(new Date().setHours(0,0,0,0));
const endOfDay = new Date(new Date().setHours(23,59,59,999));

const data = await Attendance.findOne({
teacher: teacherId,
className,
day,
startTime,
date: { $gte: startOfDay, $lte: endOfDay }
}).sort({ createdAt: -1 });

res.json({ data });

}catch(err){
res.status(500).json({ message:"Error" });
}
});

router.get("/teacher-attendance", async (req, res) => {
    try {
        const { teacherId, className, day, startTime } = req.query;

        const data = await Attendance.find({
            teacher: teacherId,
            className,
            day,
            startTime
        }).sort({ createdAt: -1 });

        res.json({ data });

    } catch (err) {
        res.status(500).json({ message: "Error fetching attendance" });
    }
});

/* ================= COMPENSATION LIST ================= */

router.get("/compensation-classes", protect, authorize("teacher"), async (req,res)=>{
    try{
        const data = await CompensationClass.find({
            teacher: req.user.id
        });

        res.json({ data });

    }catch(err){
        res.status(500).json({ message:"Error loading compensation" });
    }
});

/* ================= UPDATE COMPENSATION ================= */

router.post("/use-compensation", protect, authorize("teacher"), async (req,res)=>{
    try{

        const { attendanceId, usedMinutes } = req.body;

        const record = await TeacherAttendance.findById(attendanceId);

        if(!record){
            return res.status(404).json({ message:"Not found" });
        }

        record.usedMinutes += usedMinutes;

        await record.save();

        res.json({ message:"Updated successfully" });

    }catch(err){
        res.status(500).json({ message:"Error updating" });
    }
});

router.get("/student-compensation", async (req,res)=>{
    try{

        const StudentCompensation = require("../models/StudentCompensation");

        const data = await StudentCompensation.find()
        .populate("student","name");

        res.json({ data });

    }catch(err){
        res.status(500).json({ message:"Error" });
    }
});

router.get("/test-student", async (req,res)=>{

const StudentCompensation = require("../models/StudentCompensation");

await StudentCompensation.create({
    className:"Grade-2",
    subject:"Math",
    totalMinutes:10,
    usedMinutes:0,
    student: null
});

res.send("Inserted ✅");

});


/* ================= UPDATE STUDENT COMPENSATION ================= */

router.post("/use-student-compensation", async (req,res)=>{
    try{

        const { id, usedMinutes } = req.body;

        const StudentCompensation = require("../models/StudentCompensation");

        const record = await StudentCompensation.findById(id);

        if(!record){
            return res.status(404).json({ message:"Not found" });
        }

        const remaining = record.totalMinutes - record.usedMinutes;

        if(usedMinutes > remaining){
            return res.json({ message:"Exceeded limit ❌" });
        }

        if(usedMinutes < 1){
            return res.json({ message:"Too short ❌" });
        }

        record.usedMinutes += usedMinutes;

        await record.save();

        res.json({ message:"Updated successfully ✅" });

    }catch(err){
        res.status(500).json({ message:"Error updating student" });
    }
});

router.get("/pending-compensation", async (req,res)=>{
    try{

        const StudentCompensation = require("../models/StudentCompensation");

        const data = await StudentCompensation.find({
            $expr: { $gt: ["$totalMinutes", "$usedMinutes"] }
        }).populate("student","name");

        res.json({ data });

    }catch(err){
        res.status(500).json({ message:"Error" });
    }
});
module.exports = router;