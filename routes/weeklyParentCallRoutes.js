const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const User = require("../models/User");
const WeeklyParentCall = require("../models/WeeklyParentCall");
const TeacherStudentSchedule = require("../models/TeacherStudentSchedule");
const DailyClassRegister = require("../models/DailyClassRegister");
const LessonPlan = require("../models/LessonPlan");
const Homework = require("../models/Homework");
const HomeworkAssignment = require("../models/HomeworkAssignment");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const Marks = require("../models/Marks");
const Assessment = require("../models/Assessment");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize("founder"));

function validId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}
function dateBounds(startValue, endValue) {
    const parseLocalDate = value => {
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [year, month, day] = value.split("-").map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(value);
    };
    const start = parseLocalDate(startValue);
    const end = parseLocalDate(endValue);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return null;
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}
function withinDate(value, start, end) {
    if (!value) return false;
    const d = new Date(value);
    return Number.isFinite(d.getTime()) && d >= start && d <= end;
}

/* Student list with assigned teachers/classes */
router.get("/students", async (req, res) => {
    try {
        const students = await User.find({ role: "student" })
            .select("name studentId grade board mobile whatsapp email")
            .sort({ name: 1 }).lean();

        const schedules = await TeacherStudentSchedule.find({
            "assignments.student": { $in: students.map(s => s._id) }
        }).populate("teacher", "name teacherId").lean();

        const result = students.map(student => {
            const matched = schedules.filter(s =>
                (s.assignments || []).some(a => String(a.student?._id || a.student) === String(student._id))
            );
            const teachers = [...new Map(matched.filter(s => s.teacher).map(s => [
                String(s.teacher._id), { _id: s.teacher._id, name: s.teacher.name, teacherId: s.teacher.teacherId || "" }
            ])).values()];
            return {
                ...student,
                teachers,
                classes: [...new Set(matched.map(s => s.className).filter(Boolean))],
                subjects: [...new Set(matched.flatMap(s => {
                    const a = (s.assignments || []).find(x => String(x.student?._id || x.student) === String(student._id));
                    return [...(a?.subjects || []), ...(a?.languages || []), ...(a?.eca || [])];
                }).filter(Boolean))]
            };
        });
        res.json({ success: true, students: result });
    } catch (err) {
        console.error("WEEKLY PARENT CALL STUDENTS:", err);
        res.status(500).json({ success: false, message: "Unable to load students." });
    }
});

/* Student academic report for selected week */
router.get("/academic/:studentId", async (req, res) => {
    try {
        if (!validId(req.params.studentId)) return res.status(400).json({ success: false, message: "Invalid student ID." });
        const bounds = dateBounds(req.query.weekStart, req.query.weekEnd);
        if (!bounds) return res.status(400).json({ success: false, message: "A valid weekStart and weekEnd are required." });

        const student = await User.findOne({ _id: req.params.studentId, role: "student" })
            .select("name studentId grade board mobile whatsapp email").lean();
        if (!student) return res.status(404).json({ success: false, message: "Student not found." });

        const [registers, plans, legacyHomework, assignments, submissions, marks] = await Promise.all([
            DailyClassRegister.find({ date: { $gte: bounds.start, $lte: bounds.end } })
                .populate("teacher", "name teacherId").lean(),
            LessonPlan.find({}).sort({ date: -1 }).lean(),
            Homework.find({ student: student._id }).populate("lessonPlan").sort({ createdAt: -1 }).lean(),
            HomeworkAssignment.find({ assignedStudents: student._id, createdAt: { $gte: bounds.start, $lte: bounds.end } })
                .populate("teacher", "name").lean(),
            HomeworkSubmission.find({ student: student._id }).populate("homework", "title subject dueDate topic").lean(),
            Marks.find({ studentId: student._id }).populate("assessmentId").sort({ createdAt: -1 }).lean()
        ]);

        const studentRegisters = registers.filter(r =>
            (r.students || []).some(s =>
                String(s.studentId || "") === String(student.studentId || "") ||
                String(s.studentName || "").trim().toLowerCase() === String(student.name || "").trim().toLowerCase()
            )
        );

        const attendanceRows = studentRegisters.map(r => {
            const sr = (r.students || []).find(s =>
                String(s.studentId || "") === String(student.studentId || "") ||
                String(s.studentName || "").trim().toLowerCase() === String(student.name || "").trim().toLowerCase()
            );
            return {
                date: r.date, className: r.className, subject: r.subject,
                teacher: r.teacher?.name || "", attendance: sr?.attendance || "Unknown",
                topicCovered: r.topicCovered || ""
            };
        });
        const knownAttendance = attendanceRows.filter(r => ["Present", "Absent"].includes(r.attendance));
        const present = knownAttendance.filter(r => r.attendance === "Present").length;
        const absent = knownAttendance.filter(r => r.attendance === "Absent").length;

        const topics = [];
        for (const plan of plans) {
            const planDate = plan.date ? new Date(plan.date) : null;
            const inWeek = planDate && Number.isFinite(planDate.getTime())
                ? planDate >= bounds.start && planDate <= bounds.end
                : (String(plan.date || "") >= bounds.start.toISOString().slice(0, 10) &&
                   String(plan.date || "") <= bounds.end.toISOString().slice(0, 10));
            if (!inWeek) continue;
            const schedule = plan.periodId ? null : null;
            for (const lesson of plan.lessons || []) {
                if (lesson.topic || lesson.topicSummary) topics.push({
                    date: plan.date, className: plan.className, subject: lesson.subject || plan.subject,
                    topic: lesson.topic || "", summary: lesson.topicSummary || "", teacher: plan.teacherName || ""
                });
            }
        }
        for (const r of studentRegisters) {
            if (r.topicCovered && !topics.some(t => t.topic === r.topicCovered && String(t.date) === String(r.date))) {
                topics.push({ date: r.date, className: r.className, subject: r.subject, topic: r.topicCovered, summary: "", teacher: r.teacher?.name || "" });
            }
        }
        topics.sort((a, b) => new Date(a.date) - new Date(b.date));

        const legacyWeek = legacyHomework.filter(h => {
            const dt = h.createdAt || h.lessonPlan?.date;
            return withinDate(dt, bounds.start, bounds.end);
        }).map(h => ({
            title: h.lessonPlan?.lessons?.find(l => l.topicId === h.topicId)?.homework ||
                   h.lessonPlan?.lessons?.find(l => l.topicId === h.topicId)?.topic || "Lesson homework",
            subject: h.lessonPlan?.subject || "",
            dueDate: h.lessonPlan?.date || "",
            status: h.status || "Pending",
            source: "Lesson plan"
        }));
        const submissionById = new Map(submissions.map(s => [String(s.homework?._id || s.homework), s]));
        const assignedWeek = assignments.map(a => {
            const sub = submissionById.get(String(a._id));
            return {
                title: a.title, subject: a.subject, topic: a.topic, dueDate: a.dueDate,
                status: sub ? (sub.status === "reviewed" ? "Reviewed" : sub.status === "returned" ? "Returned" : "Submitted") : "Not submitted",
                submittedAt: sub?.submittedAt || null, marks: sub?.marks ?? null, feedback: sub?.feedback || "",
                source: "Homework assignment"
            };
        });
        const homeworkRows = [...legacyWeek, ...assignedWeek];
        const assessmentRows = marks.map(m => ({
            assessment: m.assessmentId?.title || m.assessmentId?.name || m.assessmentId?.assessmentName || "Assessment",
            subject: m.assessmentId?.subject || "",
            date: m.assessmentId?.date || m.createdAt,
            marksObtained: m.marksObtained ?? m.marks ?? null,
            totalMarks: m.assessmentId?.totalMarks ?? m.assessmentId?.maxMarks ?? null
        })).filter(m => withinDate(m.date, bounds.start, bounds.end) || !m.date);

        res.json({
            success: true,
            student,
            week: { start: bounds.start, end: bounds.end },
            attendance: { scheduledRegisters: studentRegisters.length, recorded: knownAttendance.length, present, absent,
                percentage: knownAttendance.length ? Math.round(present / knownAttendance.length * 100) : null, rows: attendanceRows },
            topics,
            homework: homeworkRows,
            assessments: assessmentRows
        });
    } catch (err) {
        console.error("WEEKLY PARENT CALL ACADEMIC:", err);
        res.status(500).json({ success: false, message: "Unable to load academic report." });
    }
});

/* Call history */
router.get("/history/:studentId", async (req, res) => {
    try {
        if (!validId(req.params.studentId)) return res.status(400).json({ success: false, message: "Invalid student ID." });
        const calls = await WeeklyParentCall.find({ student: req.params.studentId })
            .sort({ weekStart: -1, createdAt: -1 }).lean();
        res.json({ success: true, calls });
    } catch (err) {
        console.error("WEEKLY PARENT CALL HISTORY:", err);
        res.status(500).json({ success: false, message: "Unable to load call history." });
    }
});

/* Save/update one record for the selected student and week */
router.post("/save", async (req, res) => {
    try {
        const {
            studentId, weekStart, weekEnd, callDateTime, callStatus, callerName,
            nextFollowUpDate, discussion, additionalRemarks, parentFeedback,
            teacherFeedback, actionPlan, recordStatus
        } = req.body || {};
        if (!validId(studentId)) return res.status(400).json({ success: false, message: "Invalid student ID." });
        const student = await User.findOne({ _id: studentId, role: "student" }).select("_id");
        if (!student) return res.status(404).json({ success: false, message: "Student not found." });
        const bounds = dateBounds(weekStart, weekEnd);
        if (!bounds) return res.status(400).json({ success: false, message: "Invalid week range." });
        if (!["Draft", "Saved", "Completed"].includes(recordStatus || "Draft")) {
            return res.status(400).json({ success: false, message: "Invalid record status." });
        }
        if (!["Parent answered", "No answer", "Rescheduled", "Call back requested"].includes(callStatus || "Parent answered")) {
            return res.status(400).json({ success: false, message: "Invalid call status." });
        }
        const cleanDiscussion = Array.isArray(discussion) ? discussion.slice(0, 4).map((q, i) => ({
            questionNumber: i + 1,
            question: [
                "How is the student studying at home?",
                "Is the parent satisfied with the teacher's teaching?",
                "Any concerns about homework?",
                "What additional support do you need from the academy?"
            ][i],
            status: String(q?.status || "").slice(0, 120),
            notes: String(q?.notes || "").slice(0, 500)
        })) : undefined;
        const filter = { student: studentId, weekStart: bounds.start };
        const update = {
            $set: {
                weekEnd: bounds.end,
                callDateTime: callDateTime ? new Date(callDateTime) : new Date(),
                callStatus: callStatus || "Parent answered",
                callerName: String(callerName || "Founder").slice(0, 120),
                nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
                ...(cleanDiscussion ? { discussion: cleanDiscussion } : {}),
                additionalRemarks: String(additionalRemarks || "").slice(0, 1000),
                parentFeedback: parentFeedback || { rating: "", notes: "" },
                teacherFeedback: teacherFeedback || { rating: "", notes: "" },
                actionPlan: actionPlan || { items: [], notes: "" },
                recordStatus: recordStatus || "Draft",
                createdBy: req.user._id
            }
        };
        const call = await WeeklyParentCall.findOneAndUpdate(filter, update, {
            new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true
        });
        res.status(200).json({ success: true, message: "Weekly parent call saved.", call });
    } catch (err) {
        console.error("WEEKLY PARENT CALL SAVE:", err);
        if (err.name === "ValidationError") return res.status(400).json({ success: false, message: err.message });
        res.status(500).json({ success: false, message: "Unable to save weekly call." });
    }
});

module.exports = router;
