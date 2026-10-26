const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const HomeworkAssignment = require("../models/HomeworkAssignment");
const HomeworkSubmission = require("../models/HomeworkSubmission");
const TeacherStudentSchedule = require("../models/TeacherStudentSchedule");

const router = express.Router();

function authenticate(req, res, next) {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ success: false, message: "Login token is required." });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded?.id) {
            return res.status(401).json({ success: false, message: "Invalid login token." });
        }
        req.user = { id: String(decoded.id), role: String(decoded.role || "").toLowerCase() };
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: "Login expired or token is invalid." });
    }
}

function allowRoles(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: "You do not have permission for this action." });
        }
        next();
    };
}

function validId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function cleanAttachments(input) {
    if (!Array.isArray(input)) return [];
    return input
        .filter(item => item && typeof item.url === "string" && /^https?:\/\//i.test(item.url.trim()))
        .map(item => ({ name: String(item.name || "").trim().slice(0, 255), url: item.url.trim() }));
}

function normalizeNames(values) {
    if (!Array.isArray(values)) return [];
    return values.map(value => String(value || "").trim()).filter(Boolean);
}

function activityStudentsForSubject(schedule, subject) {
    const assignments = Array.isArray(schedule.assignments) ? schedule.assignments : [];
    return [...new Set(assignments
        .filter(item => {
            const activities = [
                ...normalizeNames(item.subjects),
                ...normalizeNames(item.languages),
                ...normalizeNames(item.eca)
            ];
            return activities.includes(subject);
        })
        .map(item => String(item.student?._id || item.student || ""))
        .filter(id => validId(id)))];
}

// Teacher: create homework for one selected timetable period and only students assigned to its subject.
router.post("/homework-flow/assignments", authenticate, allowRoles("teacher"), async (req, res) => {
    try {
        const { scheduleId, subject, title, instructions, topic, dueDate } = req.body || {};

        if (!validId(scheduleId)) {
            return res.status(400).json({ success: false, message: "Choose a valid class period first." });
        }
        if (!String(subject || "").trim() || !String(title || "").trim() || !dueDate) {
            return res.status(400).json({ success: false, message: "Subject, homework title and due date are required." });
        }

        const schedule = await TeacherStudentSchedule.findOne({
            _id: scheduleId,
            teacher: req.user.id
        }).populate("assignments.student", "name studentId");

        if (!schedule) {
            return res.status(404).json({ success: false, message: "That class period was not found for this teacher." });
        }

        const chosenSubject = String(subject).trim();
        const availableSubjects = [
            ...normalizeNames(schedule.subject),
            ...normalizeNames(schedule.language),
            ...normalizeNames(schedule.eca)
        ];
        if (!availableSubjects.includes(chosenSubject)) {
            return res.status(400).json({ success: false, message: "That subject is not assigned to this class period." });
        }

        const studentIds = activityStudentsForSubject(schedule, chosenSubject);
        if (!studentIds.length) {
            return res.status(400).json({
                success: false,
                message: "No students are assigned to this class and subject in TeacherStudentSchedule. Assign the students first."
            });
        }

        const parsedDueDate = new Date(dueDate);
        if (Number.isNaN(parsedDueDate.getTime())) {
            return res.status(400).json({ success: false, message: "Enter a valid due date." });
        }

        const homework = await HomeworkAssignment.create({
            teacher: req.user.id,
            schedule: schedule._id,
            className: schedule.className,
            subject: chosenSubject,
            title: String(title).trim(),
            instructions: String(instructions || "").trim(),
            topic: String(topic || "").trim(),
            dueDate: parsedDueDate,
            attachments: cleanAttachments(req.body.attachments),
materialAttachments: cleanAttachments(req.body.materialAttachments),
            assignedStudents: studentIds,
            status: "published"
        });

        const populated = await HomeworkAssignment.findById(homework._id)
            .populate("teacher", "name teacherId")
            .populate("assignedStudents", "name studentId");

        return res.status(201).json({
            success: true,
            message: "Homework published for the selected class and subject.",
            data: populated
        });
    } catch (error) {
        console.error("HOMEWORK FLOW CREATE ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not create homework.", error: error.message });
    }
});

// Teacher: list only homework owned by the logged-in teacher. Optional class and subject filters.
router.get("/homework-flow/teacher/assignments", authenticate, allowRoles("teacher"), async (req, res) => {
    try {
        const filter = { teacher: req.user.id };
        if (req.query.className) filter.className = String(req.query.className);
        if (req.query.subject) filter.subject = String(req.query.subject);
        if (req.query.status && ["published", "closed"].includes(String(req.query.status))) {
            filter.status = String(req.query.status);
        }

        const data = await HomeworkAssignment.find(filter)
            .populate("assignedStudents", "name studentId")
            .sort({ createdAt: -1 });

        const homeworkIds = data.map(item => item._id);
        const submissions = await HomeworkSubmission.find({ homework: { $in: homeworkIds } })
            .populate("student", "name studentId")
            .select("homework student status submittedAt marks feedback reviewedAt");

        const counts = new Map();
        for (const submission of submissions) {
            const key = String(submission.homework);
            if (!counts.has(key)) counts.set(key, { submitted: 0, reviewed: 0, submissions: [] });
            const item = counts.get(key);
            item.submitted += 1;
            if (submission.status === "reviewed") item.reviewed += 1;
            item.submissions.push(submission);
        }

        return res.json({
            success: true,
            data: data.map(homework => ({
                ...homework.toObject(),
                submissionCount: counts.get(String(homework._id))?.submitted || 0,
                reviewedCount: counts.get(String(homework._id))?.reviewed || 0,
                submissions: counts.get(String(homework._id))?.submissions || []
            }))
        });
    } catch (error) {
        console.error("HOMEWORK FLOW TEACHER LIST ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not load teacher homework." });
    }
});

// Student: list only homework whose assignedStudents includes the authenticated student.
router.get("/homework-flow/student/assignments", authenticate, allowRoles("student"), async (req, res) => {
    try {
        const filter = {
            assignedStudents: req.user.id,
            status: "published"
        };
        if (req.query.subject) filter.subject = String(req.query.subject);

        const homework = await HomeworkAssignment.find(filter)
            .populate("teacher", "name teacherId")
            .sort({ dueDate: 1, createdAt: -1 });

        const ids = homework.map(item => item._id);
        const submissions = await HomeworkSubmission.find({
            homework: { $in: ids },
            student: req.user.id
        });

        const byHomework = new Map(submissions.map(item => [String(item.homework), item]));
        return res.json({
            success: true,
            data: homework.map(item => ({
                ...item.toObject(),
                submission: byHomework.get(String(item._id)) || null
            }))
        });
    } catch (error) {
        console.error("HOMEWORK FLOW STUDENT LIST ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not load your homework." });
    }
});

// Student: submit or resubmit an answer for homework assigned to them.
router.post("/homework-flow/assignments/:id/submit", authenticate, allowRoles("student"), async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid homework ID." });
        }

        const homework = await HomeworkAssignment.findOne({
            _id: req.params.id,
            assignedStudents: req.user.id,
            status: "published"
        });
        if (!homework) {
            return res.status(404).json({ success: false, message: "This homework is not assigned to your account." });
        }

        const answerText = String(req.body?.answerText || "").trim();
        const attachments = cleanAttachments(req.body?.attachments);
        if (!answerText && !attachments.length) {
            return res.status(400).json({ success: false, message: "Enter an answer or attach a file before submitting." });
        }

        const submission = await HomeworkSubmission.findOneAndUpdate(
            { homework: homework._id, student: req.user.id },
            {
                $set: {
                    answerText,
                    attachments,
                    status: "submitted",
                    submittedAt: new Date(),
                    marks: null,
                    feedback: "",
                    reviewedBy: null,
                    reviewedAt: null
                }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        return res.status(201).json({ success: true, message: "Homework submitted successfully.", data: submission });
    } catch (error) {
        console.error("HOMEWORK FLOW SUBMIT ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not submit homework." });
    }
});

// Teacher: get submissions for a homework assignment owned by them.
router.get("/homework-flow/assignments/:id/submissions", authenticate, allowRoles("teacher"), async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid homework ID." });
        }
        const homework = await HomeworkAssignment.findOne({ _id: req.params.id, teacher: req.user.id });
        if (!homework) {
            return res.status(404).json({ success: false, message: "Homework not found for this teacher." });
        }

        const submissions = await HomeworkSubmission.find({ homework: homework._id })
            .populate("student", "name studentId")
            .populate("reviewedBy", "name teacherId")
            .sort({ submittedAt: -1 });

        return res.json({ success: true, homework, data: submissions });
    } catch (error) {
        console.error("HOMEWORK FLOW SUBMISSIONS ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not load submissions." });
    }
});

// Teacher: mark and give feedback to a submission.
router.patch("/homework-flow/submissions/:id/review", authenticate, allowRoles("teacher"), async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid submission ID." });
        }

        const submission = await HomeworkSubmission.findById(req.params.id).populate("homework");
        if (!submission || String(submission.homework.teacher) !== req.user.id) {
            return res.status(404).json({ success: false, message: "Submission not found for this teacher." });
        }

        const marks = req.body?.marks;
        if (marks !== null && marks !== undefined && marks !== "" &&
            (!Number.isFinite(Number(marks)) || Number(marks) < 0)) {
            return res.status(400).json({ success: false, message: "Marks must be zero or a positive number." });
        }

        submission.marks = marks === null || marks === undefined || marks === "" ? null : Number(marks);
        submission.feedback = String(req.body?.feedback || "").trim();
        submission.status = req.body?.returnToStudent === true ? "returned" : "reviewed";
        submission.reviewedBy = req.user.id;
        submission.reviewedAt = new Date();
        await submission.save();

        return res.json({ success: true, message: "Submission reviewed.", data: submission });
    } catch (error) {
        console.error("HOMEWORK FLOW REVIEW ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not save review." });
    }
});

// Teacher: close/reopen homework without deleting it.
router.patch("/homework-flow/assignments/:id/status", authenticate, allowRoles("teacher"), async (req, res) => {
    try {
        if (!validId(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid homework ID." });
        }
        const status = String(req.body?.status || "");
        if (!["published", "closed"].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be published or closed." });
        }
        const homework = await HomeworkAssignment.findOneAndUpdate(
            { _id: req.params.id, teacher: req.user.id },
            { $set: { status } },
            { new: true }
        );
        if (!homework) return res.status(404).json({ success: false, message: "Homework not found." });
        return res.json({ success: true, data: homework });
    } catch (error) {
        console.error("HOMEWORK FLOW STATUS ERROR:", error);
        return res.status(500).json({ success: false, message: "Could not update homework status." });
    }
});

module.exports = router;
