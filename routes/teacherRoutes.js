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
const TeacherStudentSchedule = require("../models/TeacherStudentSchedule");
const TeacherLeave = require("../models/TeacherLeave");
const DailyClassRegister =
    require("../models/DailyClassRegister");

    const HomeworkAssignment =
    require("../models/HomeworkAssignment");

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


/* ================= TEACHER DASHBOARD SUMMARY ================= */

router.get(
    "/dashboard-summary",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const teacherId = req.user.id;

            const schedules = await TeacherStudentSchedule.find({
                $or: [
                    { teacher: teacherId },
                    { assistantTeacher: teacherId }
                ]
            })
            .select("className assignments")
            .lean();

            // UNIQUE CLASSES
            const classes = new Set();

            // UNIQUE STUDENTS
            const students = new Set();

            schedules.forEach(schedule => {

                if (schedule.className) {
                    classes.add(schedule.className.trim());
                }

                (schedule.assignments || []).forEach(assignment => {

                    if (assignment.student) {
                        students.add(
                            String(assignment.student)
                        );
                    }

                });

            });

            return res.json({
                success: true,
                classes: classes.size,
                students: students.size,
                thisWeek: schedules.length
            });

        } catch (error) {

            console.error(
                "TEACHER DASHBOARD SUMMARY ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load dashboard summary."
            });
        }
    }
);

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

router.get(
    "/students",
    protect,
    authorize("teacher"),
    async (req, res) => {

        try {

            const teacherId = req.user.id;

            const className =
                (req.query.className || "").trim();

            const subject =
                (req.query.subject || "").trim();


            if (!className || !subject) {

                return res.status(400).json({
                    message:
                        "Class and subject are required."
                });

            }


            /*
            ==================================================
            FIND STUDENTS FROM PERIOD ASSIGNMENT
            ==================================================

            This is the same assignment system used by
            Founder -> Teacher Student Assigned.

            Subject comparison is case-insensitive:
                Science
                science
                SCIENCE

            will all match.
            ==================================================
            */

            const subjectRegex =
                new RegExp(
                    "^" +
                    subject.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&"
                    ) +
                    "$",
                    "i"
                );


            const periods =
                await PeriodAssignment.find({

                    teacher: teacherId,

                    className: className,

                    subject: subjectRegex

                }).populate(
                    "assignments.student",
                    "name grade studentId"
                );


            /*
            ==================================================
            REMOVE DUPLICATE STUDENTS
            ==================================================
            */

            const studentMap =
                new Map();


            periods.forEach(period => {

                if (
                    !period.assignments ||
                    !Array.isArray(period.assignments)
                ) {
                    return;
                }


                period.assignments.forEach(
                    assignment => {

                        const student =
                            assignment.student;


                        if (!student) {
                            return;
                        }


                        const studentId =
                            String(student._id);


                        if (
                            !studentMap.has(studentId)
                        ) {

                            studentMap.set(
                                studentId,
                                {
                                    student
                                }
                            );

                        }

                    }
                );

            });


            const data =
                Array.from(
                    studentMap.values()
                );


            console.log(
                "===================================="
            );

            console.log(
                "AI ASSESSMENT STUDENT LOAD"
            );

            console.log(
                "Teacher ID:",
                teacherId
            );

            console.log(
                "Class:",
                className
            );

            console.log(
                "Subject:",
                subject
            );

            console.log(
                "Periods Found:",
                periods.length
            );

            console.log(
                "Students Found:",
                data.length
            );

            console.log(
                "Students:",
                data.map(x => ({
                    name:
                        x.student?.name,

                    studentId:
                        x.student?.studentId
                }))
            );

            console.log(
                "===================================="
            );


            return res.json({
                data
            });


        } catch (err) {

            console.error(
                "AI Assessment student loading error:",
                err
            );


            return res.status(500).json({

                message:
                    "Error loading students.",

                error:
                    err.message

            });

        }

    }
);

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

/* ================= TEACHER MEETING LINK ================= */

router.get(
    "/my-meeting-link",
    protect,
    authorize("teacher"),
    async (req,res)=>{

        try{

            const teacher = await User.findById(
                req.user.id
            ).select(
                "name teacherId meetingLink"
            );

            if(!teacher){

                return res.status(404).json({
                    message:"Teacher not found"
                });

            }

            if(!teacher.meetingLink){

                return res.status(404).json({
                    message:"Meeting link not configured for this teacher"
                });

            }

            res.json({

                teacherId:teacher._id,

                teacherName:teacher.name,

                meetingLink:teacher.meetingLink

            });

        }catch(err){

            console.error(
                "TEACHER MEETING LINK ERROR:",
                err
            );

            res.status(500).json({
                message:"Unable to get teacher meeting link"
            });

        }

    }
);

/* ================= PERIOD STUDENTS ================= */

router.get("/period-students", protect, authorize("teacher"), async (req,res)=>{
    try{
        const teacherId = req.user.id;

        const { className, subject, language, eca, day, startTime } = req.query;

        
const filter = {
    teacher: teacherId,
    className: className?.trim(),
    day: day?.trim(),
    startTime: startTime
};

const schedules = await TeacherStudentSchedule.find(filter)
    .populate("assignments.student", "name studentId")
    .lean();

const finalData = [];

schedules.forEach(schedule => {
    (schedule.assignments || []).forEach(assignment => {
        if (!assignment.student) return;

        const subjects = assignment.subjects || [];
        const languages = assignment.languages || [];
        const ecaSubjects = assignment.eca || [];

        const requestedSubject = subject?.trim();
        const requestedLanguage = language?.trim();
        const requestedEca = eca?.trim();

        if (
    requestedSubject &&
    !requestedSubject.split(",").some(value => subjects.includes(value.trim()))
) return;
        if (
    requestedLanguage &&
    !requestedLanguage.split(",").some(value => languages.includes(value.trim()))
) return;
        if (
    requestedEca &&
    !requestedEca.split(",").some(value => ecaSubjects.includes(value.trim()))
) return;

        finalData.push({
            className: schedule.className,
            subject: subjects,
            language: languages,
            eca: ecaSubjects,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            student: assignment.student,
            subjects,
            languages,
            eca: ecaSubjects
        });
    });
});

res.json({ data: finalData });


    }catch(err){
        res.status(500).json({message:"Error"});
    }
});
router.get("/schedule", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const teacherId = decoded.id;

        const schedule = await TeacherStudentSchedule.find({
    teacher: teacherId
})
.populate("assignments.student", "name studentId")
.sort({ day: 1, startTime: 1 });

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

        const assignments = await TeacherStudentSchedule.find({
    $or: [
        { teacher: teacherId },
        { assistantTeacher: teacherId }
    ]
}).populate(
    "assignments.student",
    "name studentId"
);

const grouped = [];


assignments.forEach(a => {

    const existing = grouped.find(x =>
        x.className === a.className &&
        JSON.stringify(x.subject) === JSON.stringify(a.subject) &&
        JSON.stringify(x.language) === JSON.stringify(a.language) &&
        JSON.stringify(x.eca) === JSON.stringify(a.eca) &&
        x.day === a.day &&
        x.startTime === a.startTime &&
        x.endTime === a.endTime
    );

    // Create a new grouped period if it does not exist
    let period = existing;

    if (!period) {

        period = {
            periodId: a._id,
            className: a.className,
            subject: a.subject,
            language: a.language,
            eca: a.eca,
            day: a.day,
            startTime: a.startTime,
            endTime: a.endTime,
            students: [],
            assignments: []
        };

        grouped.push(period);
    }

    // Collect individual student assignments
    (a.assignments || []).forEach(assignment => {

        const student = assignment.student;

        if (!student) return;

        const studentId = String(student._id || student);

        if (!studentId || studentId === "undefined") return;

        // Check whether this student is already in this period
        let studentAssignment = period.assignments.find(
            x => String(x.student._id) === studentId
        );

        if (!studentAssignment) {

            studentAssignment = {
                student: {
                    _id: studentId,
                    name: student.name || "",
                    studentId: student.studentId || ""
                },
                subjects: [],
                languages: [],
                eca: []
            };

            period.assignments.push(studentAssignment);
        }

        // Merge individual assignments without duplicates
        studentAssignment.subjects = [
            ...new Set([
                ...studentAssignment.subjects,
                ...(assignment.subjects || [])
            ])
        ];

        studentAssignment.languages = [
            ...new Set([
                ...studentAssignment.languages,
                ...(assignment.languages || [])
            ])
        ];

        studentAssignment.eca = [
            ...new Set([
                ...studentAssignment.eca,
                ...(assignment.eca || [])
            ])
        ];

        // Preserve the existing students array for the website
        const alreadyInStudents = period.students.some(
            s => String(s._id) === studentId
        );

        if (!alreadyInStudents) {

            period.students.push({
                _id: studentId,
                name: student.name || "",
                studentId: student.studentId || ""
            });
        }

    });

});



res.json({
    data: grouped.map(period => ({
        ...period,

        students: (period.assignments || [])
            .filter(assignment => assignment.student)
            .map(assignment => ({
                _id: assignment.student._id || assignment.student,
                name: assignment.student.name || "",
                studentId: assignment.student.studentId || "",

                // Student-specific assigned activities
                subjects: assignment.subjects || [],
                languages: assignment.languages || [],
                eca: assignment.eca || []
            }))
    }))
});


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
        .populate("assignments.student","name");

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

router.get(
"/verify-class/:periodId",
protect,
authorize("teacher"),
async(req,res)=>{

try{

const period =
await PeriodAssignment
.findById(req.params.periodId);

if(!period){

return res.status(404).json({
allowed:false
});

}

if(
period.teacher.toString() !== req.user.id
){

return res.status(403).json({
allowed:false
});

}

res.json({

allowed:true,

period

});

}catch(err){

res.status(500).json({
allowed:false
});

}

});


router.get("/homework-classes/:teacherId", async (req, res) => {
    try {
        const teacherId = req.params.teacherId;

        const periods = await TeacherStudentSchedule.find({
            teacher: teacherId
        }).sort({
            day: 1,
            startTime: 1
        });

        const homeworkClasses = [];

        periods.forEach(period => {
            const activities = [
                ...(period.subject || []),
                ...(period.language || []),
                ...(period.eca || [])
            ];

            activities.forEach(activity => {
                homeworkClasses.push({
                    _id: period._id,
                    teacher: period.teacher,
                    assistantTeacher: period.assistantTeacher,
                    className: period.className,
                    subject: activity,
                    day: period.day,
                    startTime: period.startTime,
                    endTime: period.endTime,
                    assignments: period.assignments || []
                });
            });
        });

        res.json({
            success: true,
            data: homeworkClasses
        });

    } catch (err) {
        console.error("Homework Classes Error:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


/* ================= TEACHER CALENDAR ================= */

router.get("/calendar", protect, authorize("teacher"), async (req, res) => {

    try {

        const periods = await PeriodAssignment.find({
            teacher: req.user.id
        })
        .select(
            "className subject language eca day startTime endTime"
        )
        .sort({
            day: 1,
            startTime: 1
        });

        res.json({
            success: true,
            data: periods
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: "Unable to load calendar."
        });

    }

});


/* =========================================================
   TEACHER LEAVE - PERIODS
   ========================================================= */


router.get(
    "/leave-periods",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const periods = await TeacherStudentSchedule.find({
                $or: [
                    { teacher: req.user.id },
                    { assistantTeacher: req.user.id }
                ]
            })
                .select(
                    "teacher assistantTeacher className subject language eca day startTime endTime assignments"
                )
                .populate("teacher", "name teacherName teacherId")
                .populate("assistantTeacher", "name teacherName teacherId")
                .populate("assignments.student", "name studentName studentId")
                .sort({ day: 1, startTime: 1 });

            return res.json({
                success: true,
                data: periods
            });
        } catch (err) {
            console.error("LEAVE PERIODS ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to load teacher periods."
            });
        }
    }
);


/* =========================================================
   TEACHER LEAVE - APPLY
   ========================================================= */

router.post(
    "/apply-leave",
    protect,
    authorize("teacher"),
    async (req, res) => {

        try {

            const {

                periodAssignmentId,

                date,
                day,

                leaveCategory,
                leaveSubcategory,

                explanation,

                compensationDate,
                compensationStartTime,
                compensationEndTime

            } = req.body;


            /* ================= REQUIRED ================= */

            if (!periodAssignmentId) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Period is required."

                });

            }

            if (!date || !day) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Leave date and day are required."

                });

            }

            if (!leaveCategory) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Leave category is required."

                });

            }

            if (!leaveSubcategory) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Leave subcategory is required."

                });

            }


            /* ================= GET PERIOD ================= */

            const period =
    await TeacherStudentSchedule.findById(
        periodAssignmentId
    );

            if (!period) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Period not found."

                });

            }


            /* ================= TEACHER SECURITY ================= */

         
if (
    String(period.teacher?._id || period.teacher) !==
        String(req.user.id) &&
    String(period.assistantTeacher?._id || period.assistantTeacher) !==
        String(req.user.id)
) {


                return res.status(403).json({

                    success: false,

                    message:
                        "You are not authorized to apply leave for this period."

                });

            }


            /* ================= DUPLICATE CHECK ================= */

            const existingLeave =
                await TeacherLeave.findOne({

                    teacher: req.user.id,

                    periodAssignment:
                        period._id,

                    date: date,

                    status: {
                        $in: [
                            "Pending",
                            "Approved"
                        ]
                    }

                });

            if (existingLeave) {

                return res.status(409).json({

                    success: false,

                    message:
                        "A leave request already exists for this period and date."

                });

            }


            /* ================= COMPENSATION ================= */

            if (
                compensationDate ||
                compensationStartTime ||
                compensationEndTime
            ) {

                if (
                    !compensationDate ||
                    !compensationStartTime ||
                    !compensationEndTime
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Please provide complete compensation class date and time."

                    });

                }

                const leaveDate =
                    new Date(date + "T00:00:00");

                const compDate =
                    new Date(
                        compensationDate +
                        "T00:00:00"
                    );

                if (
                    isNaN(leaveDate.getTime()) ||
                    isNaN(compDate.getTime())
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid compensation date."

                    });

                }

                if (compDate < leaveDate) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Compensation class cannot be before the leave date."

                    });

                }

            }


            /* ================= TEACHER ================= */

            const teacher =
                await User.findById(
                    req.user.id
                );

            if (!teacher) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Teacher account not found."

                });

            }


            /* ================= SAVE ================= */

            const leave =
                await TeacherLeave.create({

                    teacher:
                        teacher._id,

                    teacherName:
                        teacher.name ||
                        teacher.teacherName ||
                        "",


                    periodAssignment:
                        period._id,

                    className:
                        period.className,

                    subject: [
    ...(period.subject || []),
    ...(period.language || []),
    ...(period.eca || [])
].join(", "),


                    date:
                        date,

                    day:
                        day,

                    startTime:
                        period.startTime,

                    endTime:
                        period.endTime,


                    leaveCategory:
                        leaveCategory,

                    leaveSubcategory:
                        leaveSubcategory,

                    explanation:
                        explanation || "",


                    compensationDate:
                        compensationDate || "",

                    compensationStartTime:
                        compensationStartTime || "",

                    compensationEndTime:
                        compensationEndTime || "",


                    status:
                        "Pending"

                });


            /* ================= RESPONSE ================= */

            res.status(201).json({

                success: true,

                message:
                    "Leave submitted for Founder approval.",

                data:
                    leave

            });

        } catch (err) {

            console.error(
                "APPLY LEAVE ERROR:",
                err
            );

            res.status(500).json({

                success: false,

                message:
                    err.message

            });

        }

    }
);

/* =========================================================
   TEACHER LEAVE - MY REQUESTS
   ========================================================= */

router.get(
    "/my-leaves",
    protect,
    authorize("teacher"),
    async (req, res) => {

        try {

            const leaves =
                await TeacherLeave.find({

                    teacher:
                        req.user.id

                })
               .sort({
    date: -1,
    createdAt: -1
});


            res.json({

                success: true,

                data:
                    leaves

            });

        } catch (err) {

            console.error(
                "MY LEAVES ERROR:",
                err
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to load leave requests."

            });

        }

    }
);


/* ================= DAILY CLASS REGISTER ================= */

router.post(
    "/daily-class-register",
    protect,
    authorize("teacher"),
    async (req, res) => {

        try {

            const teacherId = req.user.id;

            const {
                periodAssignmentId,
                date,
                className,
                subject,
                scheduledStartTime,
                scheduledEndTime,
                actualStartTime,
                actualEndTime,
                teacherStatus,
                topicCovered,
                students
            } = req.body;


            /* ================= VALIDATION ================= */

            if (
                !periodAssignmentId ||
                !date ||
                !className ||
                !subject ||
                !scheduledStartTime ||
                !scheduledEndTime ||
                !teacherStatus
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Required class details are missing."
                });

            }


            /* ================= VERIFY PERIOD ================= */

           const period =
    await TeacherStudentSchedule.findById(
        periodAssignmentId
    );


            if (!period) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Class period not found."
                });

            }


            /* ================= VERIFY TEACHER ================= */

            
if (
    String(period.teacher?._id || period.teacher) !== String(teacherId) &&
    String(period.assistantTeacher?._id || period.assistantTeacher) !== String(teacherId)
) {
    return res.status(403).json({
        success: false,
        message: "You are not authorized to save this class."
    });
}


            /* ================= CHECK APPROVED LEAVE ================= */

const approvedLeave =
    await TeacherLeave.findOne({

        teacher: teacherId,

        periodAssignment:
            periodAssignmentId,

        date: date,

        status: "Approved"

    });


/* ================= TEACHER ABSENT ================= */

if (approvedLeave) {

    const existingAbsent =
        await DailyClassRegister.findOne({

            teacher: teacherId,

            periodAssignment:
                periodAssignmentId,

            date: date

        });


    if (existingAbsent) {

        return res.status(409).json({

            success: false,

            message:
                "Daily class register already exists for this class and date."

        });

    }


    const absentRecord =
        await DailyClassRegister.create({

            teacher: teacherId,

            periodAssignment:
                periodAssignmentId,

            date: new Date(date),

            className:
                period.className,

            subject: [
    ...(period.subject || []),
    ...(period.language || []),
    ...(period.eca || [])
].join(", "),

            scheduledStartTime:
                period.startTime,

            scheduledEndTime:
                period.endTime,

            actualStartTime: "",

            actualEndTime: "",

            teacherStatus:
                "Absent",

            topicCovered: "",

            students: []

        });


    return res.status(201).json({

        success: true,

        message:
            "Teacher absence recorded from approved leave.",

        data: absentRecord

    });

}


            /* ================= TEACHER ABSENT ================= */

            if (teacherStatus === "Absent") {

                const existingAbsent =
                    await DailyClassRegister.findOne({
                        teacher: teacherId,
                        periodAssignment:
                            periodAssignmentId,
                        date: new Date(date)
                    });


                if (existingAbsent) {

                    return res.status(409).json({
                        success: false,
                        message:
                            "Daily class register already exists for this class and date."
                    });

                }


                const absentRecord =
                    await DailyClassRegister.create({

                        teacher: teacherId,

                        periodAssignment:
                            periodAssignmentId,

                        date: new Date(date),

                        className,

                        subject,

                        scheduledStartTime,

                        scheduledEndTime,

                        actualStartTime: "",

                        actualEndTime: "",

                        teacherStatus: "Absent",

                        topicCovered: "",

                        students: []

                    });


                return res.status(201).json({

                    success: true,

                    message:
                        "Teacher absence recorded successfully.",

                    data: absentRecord

                });

            }


            /* ================= PRESENT ================= */

            if (
                !Array.isArray(students) ||
                students.length === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Student attendance is required."
                });

            }


            if (
                !topicCovered ||
                !topicCovered.trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Topic covered is required."
                });

            }


            /* ================= PREVENT DUPLICATE ================= */

            const existing =
                await DailyClassRegister.findOne({

                    teacher: teacherId,

                    periodAssignment:
                        periodAssignmentId,

                    date: new Date(date)

                });


            if (existing) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Daily class register already exists for this class and date."

                });

            }


            /* ================= SAVE ================= */

            const register =
                await DailyClassRegister.create({

                    teacher: teacherId,

                    periodAssignment:
                        periodAssignmentId,

                    date: new Date(date),

                    className,

                    subject,

                    scheduledStartTime,

                    scheduledEndTime,

                    actualStartTime:
                        actualStartTime || "",

                    actualEndTime:
                        actualEndTime || "",

                    teacherStatus:
                        "Present",

                    topicCovered:
                        topicCovered.trim(),

                    students

                });


            res.status(201).json({

                success: true,

                message:
                    "Daily class register saved successfully.",

                data: register

            });


        } catch (error) {

            console.error(
                "Daily Class Register Error:",
                error
            );


            /* ================= DUPLICATE INDEX ================= */

            if (error.code === 11000) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Daily class register already exists for this class and date."

                });

            }


            res.status(500).json({

                success: false,

                message:
                    "Error saving daily class register.",

                error:
                    error.message

            });

        }

    }
);

/* ================= DAILY CLASS REGISTER - CHECK LEAVE ================= */

router.get(
    "/daily-class-register/check-leave",
    protect,
    authorize("teacher"),
    async (req, res) => {

        try {

            const {
                periodAssignmentId,
                date
            } = req.query;


            if (
                !periodAssignmentId ||
                !date
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Period and date are required."

                });

            }


            const period =
    await TeacherStudentSchedule.findById(
        periodAssignmentId
    );


            if (!period) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Period not found."

                });

            }


            /* ================= SECURITY ================= */

    if (
    String(period.teacher?._id || period.teacher) !== String(req.user.id) &&
    String(period.assistantTeacher?._id || period.assistantTeacher) !== String(req.user.id)
) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not authorized to check this period."

                });

            }


            /* ================= APPROVED LEAVE ================= */

            const approvedLeave =
                await TeacherLeave.findOne({

                    teacher:
                        req.user.id,

                    periodAssignment:
                        periodAssignmentId,

                    date:
                        date,

                    status:
                        "Approved"

                });


            res.json({

                success: true,

                hasApprovedLeave:
                    !!approvedLeave,

                leave:
                    approvedLeave || null

            });


        } catch (error) {

            console.error(
                "DAILY REGISTER LEAVE CHECK ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Unable to check teacher leave."

            });

        }

    }
);


/* =========================================================
   TEACHER REGISTER SUMMARY - VIEW OWN RECORDS
   ========================================================= */

router.get(
    "/daily-class-register",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            // Always use the authenticated teacher's ID.
            const filter = {
                teacher: req.user.id
            };

            // Optional date filters: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
            const { startDate, endDate } = req.query;

            if (startDate || endDate) {
                const dateFilter = {};

                if (startDate) {
                    const start = new Date(startDate + "T00:00:00.000");
                    if (isNaN(start.getTime())) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid start date."
                        });
                    }
                    dateFilter.$gte = start;
                }

                if (endDate) {
                    const end = new Date(endDate + "T00:00:00.000");
                    if (isNaN(end.getTime())) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid end date."
                        });
                    }

                    // Include the entire selected end date.
                    end.setDate(end.getDate() + 1);
                    dateFilter.$lt = end;
                }

                if (
                    startDate &&
                    endDate &&
                    dateFilter.$gte >= dateFilter.$lt
                ) {
                    return res.status(400).json({
                        success: false,
                        message: "End date must be on or after start date."
                    });
                }

                filter.date = dateFilter;
            }

            const registers = await DailyClassRegister.find(filter)
                .populate(
    "periodAssignment",
    "className subject language eca day startTime endTime"
)
                .sort({
                    date: -1,
                    scheduledStartTime: 1,
                    createdAt: -1
                });

            return res.json({
                success: true,
                count: registers.length,
                data: registers
            });

        } catch (error) {
            console.error("Teacher Register Summary Error:", error);

            return res.status(500).json({
                success: false,
                message: "Unable to load your register summary."
            });
        }
    }
);



/* ==========================================
   TEACHER - MONTHLY SCHEDULE ENTRY STATUS
========================================== */

router.get(
    "/daily-schedule-entry-status",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const { month } = req.query;
            const teacherId = req.user.id;

            // Expected format: YYYY-MM
            if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
                return res.status(400).json({
                    success: false,
                    message: "Valid month is required (YYYY-MM)."
                });
            }

            const [year, monthNumber] = month.split("-").map(Number);

            // Academy dates are based on Indian Standard Time.
            const IST_OFFSET = 330 * 60 * 1000;

            const startDate = new Date(
                Date.UTC(year, monthNumber - 1, 1) - IST_OFFSET
            );

            const endDate = new Date(
                Date.UTC(year, monthNumber, 1) - IST_OFFSET
            );

            // Convert database dates into YYYY-MM-DD in IST.
            const getIndiaDateKey = (value) => {
                const parts = new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Asia/Kolkata",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit"
                }).formatToParts(new Date(value));

                const values = {};

                parts.forEach(part => {
                    values[part.type] = part.value;
                });

                return `${values.year}-${values.month}-${values.day}`;
            };

            // Only this logged-in teacher's schedules.
            const schedules = await TeacherStudentSchedule.find({
                $or: [
                    { teacher: teacherId },
                    { assistantTeacher: teacherId }
                ]
            }).select("_id");

            const scheduleIds = schedules.map(schedule => schedule._id);

            if (!scheduleIds.length) {
                return res.json({
                    success: true,
                    month,
                    statuses: {
                        registers: [],
                        homework: []
                    }
                });
            }

            // Retrieve the complete month's records in two queries.
            const [registers, homework] = await Promise.all([

                DailyClassRegister.find({
                    periodAssignment: { $in: scheduleIds },
                    date: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }).select("periodAssignment date"),

                HomeworkAssignment.find({
                    schedule: { $in: scheduleIds },
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate
                    }
                }).select("schedule createdAt")

            ]);

            const registerStatuses = registers.map(item => ({
                scheduleId: String(item.periodAssignment),
                date: getIndiaDateKey(item.date)
            }));

            const homeworkStatuses = homework.map(item => ({
                scheduleId: String(item.schedule),
                date: getIndiaDateKey(item.createdAt)
            }));

            return res.json({
                success: true,
                month,
                statuses: {
                    registers: registerStatuses,
                    homework: homeworkStatuses
                }
            });

        } catch (error) {
            console.error(
                "TEACHER MONTHLY SCHEDULE STATUS ERROR:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Unable to load monthly schedule statuses."
            });
        }
    }
);


module.exports = router;