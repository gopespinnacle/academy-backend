const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,"uploads/");
    },
    filename:(req,file,cb)=>{
        cb(null,Date.now()+"-"+file.originalname);
    }
});

const upload = multer({storage});
const User = require("../models/User");
const Marks = require("../models/Marks");
const TeacherSession = require("../models/TeacherSession");
const Attendance = require("../models/Attendance");
const Homework = require("../models/Homework");
const StudentAnswer = require("../models/StudentAnswer");
const Assessment = require("../models/Assessment");
const ExamActivity = require("../models/ExamActivity");
const ExamCamera = require("../models/ExamCamera");
const PeriodAssignment = require("../models/PeriodAssignment");
const TeacherSchedule = require("../models/TeacherSchedule");

const { protect, authorize } = require("../middleware/authMiddleware");

/* ================= STUDENT RESULTS ================= */

router.get("/results", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = require("jsonwebtoken").verify(token, process.env.JWT_SECRET);

        const student = await User.findById(decoded.id);

        if (!student || student.role !== "student") {
            return res.status(403).json({ message: "Access denied" });
        }

        const results = await Marks.find({ studentId: student._id })
            .populate("assessmentId");

        res.json({ results });

    } catch (error) {
        res.status(500).json({ message: "Error fetching results" });
    }
});

/* ================= TODAY SESSIONS ================= */

router.get("/today-sessions", protect, authorize("student"), async (req,res)=>{
    try{
        const today = new Date();

        const start = new Date(today.setHours(0,0,0,0));
        const end = new Date(today.setHours(23,59,59,999));

        const sessions = await TeacherSession.find({
            date:{ $gte:start,$lte:end }
        }).populate("teacher","name subject");

        res.json({sessions});

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= JOIN CLASS ================= */

router.post("/join-class", protect, authorize("student"), async (req,res)=>{
    try{
        const { sessionId } = req.body;

        const session = await TeacherSession.findById(sessionId);

        if(!session){
            return res.status(404).json({message:"Session not found"});
        }

        const now = new Date();

        const [startHour,startMinute] = session.startTime.split(":");

        const start = new Date(session.date);
        start.setHours(startHour,startMinute,0);

        const bufferEnd = new Date(start.getTime() + (10 * 60000));

        if(now <= bufferEnd){

            session.joinedStudents.push(req.user.id);
            await session.save();

            const startOfDay = new Date(session.date);
            startOfDay.setHours(0,0,0,0);

            const endOfDay = new Date(session.date);
            endOfDay.setHours(23,59,59,999);

            await Attendance.findOneAndUpdate(
            {
                studentId: req.user.id,
                className: session.className,
                subject: session.subject,
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            },
            {
                studentId: req.user.id,
                className: session.className,
                subject: session.subject,
                status: "Present"
            },
            { upsert: true, new: true });

            return res.json({
                allowed:true,
                meetingLink:session.meetingLink
            });
        }

        session.lateJoinRequests.push({
            student:req.user.id
        });

        await session.save();

        res.json({
            allowed:false,
            message:"Teacher approval required"
        });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= TIMETABLE ================= */

router.get("/timetable", protect, authorize("student"), async (req,res)=>{
    try{
        const schedules = await TeacherSchedule.find()
        .populate("teacher","name subject")
        .sort({ day:1, startTime:1 });

        res.json({ schedules });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= MY TIMETABLE ================= */

router.get("/my-timetable", protect, authorize("student"), async (req,res)=>{
    try{
        const studentId = req.user.id;

        const data = await PeriodAssignment.find({
            student: studentId
        });

        res.json({ data });

    }catch(err){
        res.status(500).json({message:"Error"});
    }
});

/* ================= MY ATTENDANCE ================= */
const { getAttendance } = require("../controllers/attendanceController");
router.get("/my-attendance", async (req,res)=>{
    const data = await getAttendance(req.user.id);
    res.json({ data });
});

/* ================= HOMEWORK ================= */
const { getStudentHomework } = require("../controllers/homeworkController");
router.get("/homework", protect, authorize("student"), async (req,res)=>{
    const data = await getStudentHomework(req.user.id);
    res.json({ homework: data });
});
/* ================= VIEW ASSESSMENTS ================= */

const { getStudentAssessments, uploadAnswer } = require("../controllers/assessmentController");


/* ================= UPLOAD ANSWER ================= */



router.post(
"/upload-answer",
protect,
authorize("student"),
upload.single("answer"),
async(req,res)=>{
    const result = await uploadAnswer(
        req.user.id,
        req.body.assessmentId,
        req.file
    );

    res.json(result);
});

/* ================= EXAM ACTIVITY ================= */

router.post("/exam-activity", protect, authorize("student"), async(req,res)=>{
    try{
        const {assessmentId,tabSwitch} = req.body;

        const activity = new ExamActivity({
            student:req.user.id,
            assessment:assessmentId,
            tabSwitch
        });

        await activity.save();

        res.json({message:"Activity recorded"});

    }catch(error){
        res.status(500).json({message:"Error saving activity"});
    }
});

/* ================= CAMERA UPLOAD ================= */

router.post("/upload-camera", protect, authorize("student"), async(req,res)=>{
    try{
        const {assessmentId,image} = req.body;

        const camera = new ExamCamera({
            student:req.user.id,
            assessment:assessmentId,
            image
        });

        await camera.save();

        res.json({ message:"Camera frame saved" });

    }catch(error){
        res.status(500).json({ message:"Camera upload failed" });
    }
});

module.exports = router;