console.log("FOUNDER ROUTES LOADED");
const PeriodAssignment = require("../models/PeriodAssignment");
const express = require("express");
const router = express.Router();
const founderController = require("../controllers/founderController")
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Marks = require("../models/Marks");
const Assessment = require("../models/Assessment");
const AuditLog = require("../models/AuditLog");
const TeacherSchedule = require("../models/TeacherSchedule");
const TeacherSession = require("../models/TeacherSession");
const TeacherAttendance = require("../models/TeacherAttendance");
const TeacherStudentMap = require("../models/TeacherStudentMap");
const Attendance = require("../models/Attendance");
const CompensationClass = require("../models/CompensationClass");
const Subject = require("../models/Subject");
const Category = require("../models/Category");


const { protect, authorize } = require("../middleware/authMiddleware");


/* ================= ADD TEACHER ================= */

router.post("/add-teacher", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const founder = await User.findById(decoded.id);
        if (!founder || founder.role !== "founder") {
            return res.status(403).json({ message: "Access denied" });
        }

        const {
            name, email, password, subject, eca, language,
            mobile, whatsapp, experience,
            salaryMonth, sessionsWeek, salarySession
        } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Teacher already exists" });
        }

        const teacher = new User({
            name, email, password,
            role: "teacher",
            subject, eca, language,
            mobile, whatsapp, experience,
            salaryMonth, sessionsWeek, salarySession
        });

        await teacher.save();

        res.status(201).json({ message: "Teacher created successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error creating teacher" });
    }
});

/* ================= GET TEACHERS ================= */

router.get("/teachers", founderController.getTeachers);
/* ================= ANALYTICS ================= */

router.get("/analytics", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const founder = await User.findById(decoded.id);
        if (!founder || founder.role !== "founder") {
            return res.status(403).json({ message: "Access denied" });
        }

        const totalStudents = await User.countDocuments({ role: "student" });
        const totalTeachers = await User.countDocuments({ role: "teacher" });
        const totalAssessments = await Assessment.countDocuments();

        const marks = await Marks.find();
        const average =
            marks.length > 0
                ? marks.reduce((sum, m) => sum + m.marksObtained, 0) / marks.length
                : 0;

        const pendingModifications = await Marks.countDocuments({
            modificationRequested: true
        });

        const recentActivities = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalStudents,
            totalTeachers,
            totalAssessments,
            averageMarks: average.toFixed(2),
            pendingModifications,
            recentActivities
        });

    } catch (error) {
        res.status(500).json({ message: "Error loading analytics" });
    }
});

/* ================= STUDENT CRUD ================= */

router.get("/students", async (req,res)=>{
    const students = await User.find({ role: "student" });
    res.json({ students });
});

router.post("/student", protect, authorize("founder"), async (req,res)=>{
    try{
        const { name, grade, board, mobile, subject, eca, language } = req.body;

        const email =
        name.toLowerCase().replace(/\s/g,"") +
        Math.floor(Math.random()*1000) +
        "@student.com";

        const password = Math.random().toString(36).slice(-6);

        const student = new User({
            name, email, password,
            grade, board, mobile,
            role:"student",
            loginEmail: email,
            loginPassword: password,
            subject: subject || [],
            eca: eca || [],
            language: language || []
        });

        await student.save();

        res.json({
            message:"Student added successfully",
            login:{ email, password }
        });

    }catch(error){
        res.status(500).json({ message:"Server error" });
    }
});

router.put("/student/:id", async (req,res)=>{
    try{
        const updatedStudent = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new:true }
        );

        res.json({ student:updatedStudent });

    }catch(error){
        res.status(500).json({ message:"Server error" });
    }
});

router.delete("/student/:id", async (req,res)=>{
    await User.findByIdAndDelete(req.params.id);
    res.json({ message:"Student deleted successfully" });
});

/* ================= SCHEDULE ================= */

router.post("/add-schedule", protect, authorize("founder"), async (req,res)=>{
    try{

        const schedule = new TeacherSchedule(req.body);
        await schedule.save();

        res.json({ message:"Schedule added successfully" });

    }catch(error){
        res.status(500).json({ message:error.message });
    }
});

router.get("/schedules", protect, authorize("founder"), async (req,res)=>{
    const schedules = await TeacherSchedule.find()
    .populate("teacher","name subject");

    res.json({ schedules });
});

router.put("/update-schedule/:id", protect, authorize("founder"), async (req,res)=>{
    try{

            const updated = await TeacherSchedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new:true }
        );

        if(!updated){
            return res.status(404).json({ message:"Schedule not found" });
        }

        res.json({ message:"Schedule updated successfully", data: updated });

    }catch(error){
        res.status(500).json({ message:"Server error" });
    }
});
/* ================= TODAY CLASSES ================= */

router.get("/today-classes", protect, authorize("founder"), async (req,res)=>{
    try{
        const today = new Date();

        const start = new Date(today.setHours(0,0,0,0));
        const end = new Date(today.setHours(23,59,59,999));

        const sessions = await TeacherSession.find({
            date:{ $gte:start,$lte:end }
        }).populate("teacher","name subject");

        res.json({ sessions });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= LIVE CLASSES ================= */

router.get("/live-classes", protect, authorize("founder"), async (req,res)=>{
    try{
        const now = new Date();

        const sessions = await TeacherSession.find()
        .populate("teacher","name subject");

        const liveClasses = sessions.filter(s=>{
            const [sh,sm] = s.startTime.split(":");
            const [eh,em] = s.endTime.split(":");

            const start = new Date(s.date);
            start.setHours(sh,sm,0);

            const end = new Date(s.date);
            end.setHours(eh,em,0);

            return now >= start && now <= end;
        });

        res.json({ liveClasses });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= SUBJECT ================= */

router.post("/add-subject", async (req,res)=>{
    const subject = new Subject({ name:req.body.name });
    await subject.save();
    res.json({ message:"Subject added" });
});

router.get("/subjects", async (req,res)=>{
    const subjects = await Subject.find();
    res.json({ subjects });
});

router.delete("/subject/:id", async (req,res)=>{
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message:"Deleted" });
});

/* ================= CATEGORY ================= */

router.post("/add-category", async(req,res)=>{
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.json({message:"Added successfully"});
});

router.get("/categories/:type", async(req,res)=>{
    const data = await Category.find({type:req.params.type});
    res.json({data});
});

router.delete("/category/:id", async(req,res)=>{
    await Category.findByIdAndDelete(req.params.id);
    res.json({message:"Deleted"});
});


router.get("/teacher/:id", async (req,res)=>{
    try{

        const teacher = await User.findById(req.params.id);

        if(!teacher){
            return res.status(404).json({message:"Teacher not found"});
        }

        res.json({ teacher });

    }catch(error){
        res.status(500).json({message:"Server error"});
    }
});


router.put("/update-teacher/:id", async (req,res)=>{
    try{

        const updatedTeacher = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new:true }
        );

        if(!updatedTeacher){
            return res.status(404).json({message:"Teacher not found"});
        }

        res.json({ message:"Teacher updated successfully", teacher: updatedTeacher });

    }catch(error){
        console.log(error);
        res.status(500).json({message:"Server error"});
    }
});


router.get("/teacher-schedule/:teacherId", async (req, res) => {
    try {

        const schedule = await TeacherSchedule.find({
            teacher: req.params.teacherId
        });

        res.json({ schedule });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});



router.post("/get-period-assignments", async (req,res)=>{
    try{

        let { teacherId, className, subject, day, startTime } = req.body;

        startTime = startTime.trim();

        const data = await PeriodAssignment.find({
            teacher: teacherId,
            className,
            subject,
            day,
            startTime: { $regex: "^" + startTime }
        });

        console.log("FILTERED DATA:", data);

        let assignments = data.map(d => ({
            student: d.student,
            subjects: d.subjects || [],
            languages: d.languages || [],
            eca: d.eca || []
        }));

        res.json({ assignments });

    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server error"});
    }
});

router.post("/assign-period", async (req,res)=>{
    try{

        const { teacherId, className, subject, day, startTime, endTime, assignments } = req.body;

      await PeriodAssignment.deleteMany({
    teacher: teacherId,
    className,
    day,
    startTime,
    endTime
});

        const data = assignments.map(a => ({
            teacher: teacherId,
            className,
            subject,
            day,
            startTime,
            endTime,
            student: a.studentId,
            subjects: a.subjects,
            languages: a.languages,
            eca: a.eca
        }));

        await PeriodAssignment.insertMany(data);

        res.json({ message:"Saved successfully", assignments:data });

    }catch(err){
        console.log(err);
        res.status(500).json({ message:"Server error" });
    }
});

router.delete("/delete-schedule/:id", protect, authorize("founder"), async (req, res) => {
    try {

        const deleted = await TeacherSchedule.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Schedule not found" });
        }

        res.json({ message: "Schedule deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/compensation-report", async (req,res)=>{
    try{

        const StudentCompensation = require("../models/StudentCompensation");

        const data = await StudentCompensation.find()
        .populate("student","name")
        .populate("teacher","name");

        res.json({ data });

    }catch(err){
        res.status(500).json({ message:"Error" });
    }
});


/* ================= ADMISSION FORM ================= */

const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({
    parentName: String,
    studentName: String,
    grade: String,
    mobile: String
});

const Admission = mongoose.model("Admission", admissionSchema);

router.post("/admission", async (req, res) => {
    console.log("🔥 ADMISSION HIT");

    try {
        const { parentName, studentName, grade, mobile } = req.body;

        const Admission = mongoose.model("Admission", new mongoose.Schema({
            parentName: String,
            studentName: String,
            grade: String,
            mobile: String
        }));

        await Admission.create({
            parentName,
            studentName,
            grade,
            mobile
        });

        res.json({ message: "Admission Saved Successfully" });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error saving admission" });
    }
});
module.exports = router;