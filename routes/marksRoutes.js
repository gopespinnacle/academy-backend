// ============================================================
// GPA MARKS MANAGEMENT SYSTEM
// File: routes/marksRoutes.js
// ============================================================

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

const User = require("../models/User");
const Assessment = require("../models/Assessment");
const Marks = require("../models/Marks");
const PeriodAssignment = require("../models/PeriodAssignment");

const {
    protect,
    authorize
} = require("../middleware/authMiddleware");


// ============================================================
// COMMON HELPERS
// ============================================================

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function validateMarks(value, totalMarks) {
    const marks = Number(value);

    return (
        Number.isFinite(marks) &&
        marks >= 0 &&
        marks <= Number(totalMarks)
    );
}


// ============================================================
// FOUNDER - GET ALL STUDENTS
// GET /api/marks/founder/students
// ============================================================

router.get(
    "/founder/students",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const students = await User.find({
                role: "student"
            })
            .select("name studentId grade")
            .sort({ name: 1 })
            .lean();

            res.json({
                success: true,
                students
            });

        } catch (error) {
            console.error("FOUNDER MARKS STUDENTS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load students."
            });
        }
    }
);


// ============================================================
// FOUNDER - GET ASSESSMENTS
// GET /api/marks/founder/assessments
// ============================================================

router.get(
    "/founder/assessments",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const assessments = await Assessment.find()
                .populate("createdBy", "name role")
                .sort({ date: -1 })
                .lean();

            res.json({
                success: true,
                assessments
            });

        } catch (error) {
            console.error("FOUNDER ASSESSMENTS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load assessments."
            });
        }
    }
);


// ============================================================
// FOUNDER - CREATE MANUAL ASSESSMENT
// POST /api/marks/founder/assessments
// ============================================================

router.post(
    "/founder/assessments",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const {
                title,
                className,
                subject,
                totalMarks,
                examDuration,
                date
            } = req.body;

            if (
                !title?.trim() ||
                !className?.trim() ||
                !subject?.trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Title, class and subject are required."
                });
            }

            const maximum = Number(totalMarks);

            if (!Number.isFinite(maximum) || maximum <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Enter a valid maximum mark."
                });
            }

            const assessment = await Assessment.create({
                title: title.trim(),
                className: className.trim(),
                subject: subject.trim(),
                totalMarks: maximum,
                examDuration: examDuration
                    ? Number(examDuration)
                    : undefined,
                date: date ? new Date(date) : new Date(),
                createdBy: req.user._id,
                sentToStudents: true
            });

            res.status(201).json({
                success: true,
                message: "Assessment created successfully.",
                assessment
            });

        } catch (error) {
            console.error("CREATE FOUNDER ASSESSMENT:", error);

            res.status(500).json({
                success: false,
                message: "Unable to create assessment."
            });
        }
    }
);


// ============================================================
// FOUNDER - ENTER OR UPDATE MANUAL MARKS
// POST /api/marks/founder/assessments/:assessmentId/marks
// ============================================================

router.post(
    "/founder/assessments/:assessmentId/marks",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const { assessmentId } = req.params;
            const { studentId, marksObtained } = req.body;

            if (!validId(assessmentId) || !validId(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assessment or student ID."
                });
            }

            const assessment = await Assessment.findById(assessmentId);

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    message: "Assessment not found."
                });
            }

            const student = await User.findOne({
                _id: studentId,
                role: "student"
            });

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            // =====================================================
// VERIFY STUDENT BELONGS TO ASSESSMENT CLASS
// =====================================================

const normalizeGrade = (value) => {
    return String(value ?? "")
        .trim()
        .toLowerCase()
        .replace(/^grade\s*[-:]?\s*/, "")
        .replace(/^class\s*[-:]?\s*/, "")
        .replace(/\s+/g, "");
};

const studentGrade = normalizeGrade(student.grade);

const assessmentGrade = normalizeGrade(
    assessment.className
);

// Prevent saving marks when grade is missing
if (!studentGrade || !assessmentGrade) {
    return res.status(400).json({
        success: false,
        message:
            "Student grade or assessment class is missing."
    });
}

// Prevent saving marks for a different grade
if (studentGrade !== assessmentGrade) {
    return res.status(403).json({
        success: false,
        message:
            `Class mismatch. Student belongs to ${student.grade}, ` +
            `but assessment is for ${assessment.className}.`
    });
}

            if (!validateMarks(marksObtained, assessment.totalMarks)) {
                return res.status(400).json({
                    success: false,
                    message: `Marks must be between 0 and ${assessment.totalMarks}.`
                });
            }

            let mark = await Marks.findOne({
                assessmentId,
                studentId
            });

            if (mark) {
                mark.marksObtained = Number(marksObtained);
                mark.isLocked = true;
                mark.modificationRequested = false;
                mark.modificationApproved = false;
            } else {
                mark = new Marks({
                    assessmentId,
                    studentId,
                    marksObtained: Number(marksObtained),
                    isLocked: true
                });
            }

            await mark.save();

            res.json({
                success: true,
                message: "Student marks saved successfully.",
                mark
            });

        } catch (error) {
            console.error("FOUNDER SAVE MARKS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to save marks."
            });
        }
    }
);


// ============================================================
// FOUNDER - PENDING MODIFICATION REQUESTS
// GET /api/marks/founder/modification-requests
// ============================================================

router.get(
    "/founder/modification-requests",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const requests = await Marks.find({
                modificationRequested: true
            })
            .populate("studentId", "name studentId grade")
            .populate("assessmentId", "title className subject totalMarks date")
            .sort({ updatedAt: -1 });

            res.json({
                success: true,
                requests
            });

        } catch (error) {
            console.error("MODIFICATION REQUESTS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load modification requests."
            });
        }
    }
);


// ============================================================
// FOUNDER - APPROVE OR REJECT MODIFICATION
// PATCH /api/marks/founder/modification-requests/:markId
// Body: { decision: "approve" } or { decision: "reject" }
// ============================================================

router.patch(
    "/founder/modification-requests/:markId",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const { markId } = req.params;
            const { decision } = req.body;

            if (!validId(markId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid mark ID."
                });
            }

            if (!["approve", "reject"].includes(decision)) {
                return res.status(400).json({
                    success: false,
                    message: "Decision must be approve or reject."
                });
            }

            const mark = await Marks.findOne({
                _id: markId,
                modificationRequested: true
            });

            if (!mark) {
                return res.status(404).json({
                    success: false,
                    message: "Pending modification request not found."
                });
            }

            if (decision === "approve") {
                mark.modificationApproved = true;
                mark.isLocked = false;
            } else {
                mark.modificationApproved = false;
                mark.isLocked = true;
                mark.modificationRequested = false;
            }

            await mark.save();

            res.json({
                success: true,
                message: decision === "approve"
                    ? "Modification approved. Teacher can update the marks."
                    : "Modification request rejected.",
                mark
            });

        } catch (error) {
            console.error("MODIFICATION DECISION:", error);

            res.status(500).json({
                success: false,
                message: "Unable to process modification request."
            });
        }
    }
);


// ============================================================
// TEACHER - GET ASSIGNED PERIODS
// GET /api/marks/teacher/periods
// ============================================================

router.get(
    "/teacher/periods",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const periods = await PeriodAssignment.find({
                teacher: req.user._id
            })
            .select("className subject day startTime endTime")
            .sort({ className: 1, subject: 1 });

            const unique = new Map();

            periods.forEach(period => {
                const key = [
                    period.className,
                    period.subject
                ].join("::");

                if (!unique.has(key)) {
                    unique.set(key, {
                        className: period.className,
                        subject: period.subject
                    });
                }
            });

            res.json({
                success: true,
                periods: Array.from(unique.values())
            });

        } catch (error) {
            console.error("TEACHER PERIODS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load assigned periods."
            });
        }
    }
);


// ============================================================
// TEACHER - GET ASSESSMENTS FOR ASSIGNED CLASS/SUBJECT
// GET /api/marks/teacher/assessments?className=...&subject=...
// ============================================================

router.get(
    "/teacher/assessments",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const className = String(req.query.className || "").trim();
            const subject = String(req.query.subject || "").trim();

            if (!className || !subject) {
                return res.status(400).json({
                    success: false,
                    message: "Class and subject are required."
                });
            }

            const subjectRegex = new RegExp(
                "^" + escapeRegex(subject) + "$",
                "i"
            );

            const assigned = await PeriodAssignment.exists({
                teacher: req.user._id,
                className,
                subject: subjectRegex
            });

            if (!assigned) {
                return res.status(403).json({
                    success: false,
                    message: "This class and subject are not assigned to you."
                });
            }

            const assessments = await Assessment.find({
                className,
                subject: subjectRegex
            })
            .sort({ date: -1 });

            res.json({
                success: true,
                assessments
            });

        } catch (error) {
            console.error("TEACHER ASSESSMENTS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load assessments."
            });
        }
    }
);


// ============================================================
// TEACHER - GET ASSIGNED STUDENTS
// GET /api/marks/teacher/students?className=...&subject=...
// ============================================================

router.get(
    "/teacher/students",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const className = String(req.query.className || "").trim();
            const subject = String(req.query.subject || "").trim();

            if (!className || !subject) {
                return res.status(400).json({
                    success: false,
                    message: "Class and subject are required."
                });
            }

            const subjectRegex = new RegExp(
                "^" + escapeRegex(subject) + "$",
                "i"
            );

            const periods = await PeriodAssignment.find({
                teacher: req.user._id,
                className,
                subject: subjectRegex
            }).populate(
                "assignments.student",
                "name studentId grade"
            );

            const studentsMap = new Map();

            periods.forEach(period => {
                (period.assignments || []).forEach(assignment => {
                    const student = assignment.student;

                    if (student && student._id) {
                        studentsMap.set(
                            String(student._id),
                            student
                        );
                    }
                });
            });

            res.json({
                success: true,
                students: Array.from(studentsMap.values())
            });

        } catch (error) {
            console.error("TEACHER MARKS STUDENTS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load assigned students."
            });
        }
    }
);


// ============================================================
// TEACHER - SUBMIT MARKS
// POST /api/marks/teacher/submit
// ============================================================

router.post(
    "/teacher/submit",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const {
                assessmentId,
                studentId,
                marksObtained
            } = req.body;

            if (!validId(assessmentId) || !validId(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assessment or student ID."
                });
            }

            const assessment = await Assessment.findById(assessmentId);

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    message: "Assessment not found."
                });
            }

            const subjectRegex = new RegExp(
                "^" + escapeRegex(assessment.subject) + "$",
                "i"
            );

            const assigned = await PeriodAssignment.exists({
                teacher: req.user._id,
                className: assessment.className,
                subject: subjectRegex,
                "assignments.student": studentId
            });

            if (!assigned) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to this student for this subject."
                });
            }

            if (!validateMarks(marksObtained, assessment.totalMarks)) {
                return res.status(400).json({
                    success: false,
                    message: `Marks must be between 0 and ${assessment.totalMarks}.`
                });
            }

            let mark = await Marks.findOne({
                assessmentId,
                studentId
            });

            if (mark) {
                if (mark.isLocked && !mark.modificationApproved) {
                    return res.status(403).json({
                        success: false,
                        message: "Marks are locked. Request Founder approval."
                    });
                }

                mark.marksObtained = Number(marksObtained);
                mark.isLocked = true;
                mark.modificationApproved = false;
                mark.modificationRequested = false;

            } else {
                mark = new Marks({
                    assessmentId,
                    studentId,
                    marksObtained: Number(marksObtained),
                    isLocked: true
                });
            }

            await mark.save();

            res.json({
                success: true,
                message: "Marks saved and locked successfully.",
                mark
            });

        } catch (error) {
            console.error("TEACHER SUBMIT MARKS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to save marks."
            });
        }
    }
);


// ============================================================
// TEACHER - REQUEST MARK MODIFICATION
// POST /api/marks/teacher/request-modification
// ============================================================

router.post(
    "/teacher/request-modification",
    protect,
    authorize("teacher"),
    async (req, res) => {
        try {
            const { assessmentId, studentId } = req.body;

            if (!validId(assessmentId) || !validId(studentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assessment or student ID."
                });
            }

            const assessment = await Assessment.findById(assessmentId);

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    message: "Assessment not found."
                });
            }

            const subjectRegex = new RegExp(
                "^" + escapeRegex(assessment.subject) + "$",
                "i"
            );

            const assigned = await PeriodAssignment.exists({
                teacher: req.user._id,
                className: assessment.className,
                subject: subjectRegex,
                "assignments.student": studentId
            });

            if (!assigned) {
                return res.status(403).json({
                    success: false,
                    message: "You are not assigned to this student."
                });
            }

            const mark = await Marks.findOne({
                assessmentId,
                studentId
            });

            if (!mark) {
                return res.status(404).json({
                    success: false,
                    message: "Marks not found."
                });
            }

            if (mark.modificationRequested) {
                return res.status(409).json({
                    success: false,
                    message: "A modification request is already pending."
                });
            }

            mark.modificationRequested = true;
            mark.modificationApproved = false;
            mark.isLocked = true;

            await mark.save();

            res.json({
                success: true,
                message: "Modification request sent to Founder."
            });

        } catch (error) {
            console.error("REQUEST MARK MODIFICATION:", error);

            res.status(500).json({
                success: false,
                message: "Unable to request modification."
            });
        }
    }
);


// ============================================================
// STUDENT - VIEW COMBINED ACADEMIC HISTORY
// GET /api/marks/student/results
// ============================================================

router.get(
    "/student/results",
    protect,
    authorize("student"),
    async (req, res) => {
        try {
            const results = await Marks.find({
                studentId: req.user._id
            })
            .populate({
                path: "assessmentId",
                select: "title className subject totalMarks date createdBy",
                populate: {
                    path: "createdBy",
                    select: "name role"
                }
            })
            .sort({ createdAt: -1 })
            .lean();

            const validResults = results.filter(
                result => result.assessmentId
            );

            const formattedResults = validResults.map(result => ({
                ...result,
                entrySource:
                    result.assessmentId.createdBy?.role === "founder"
                        ? "Founder"
                        : "Teacher"
            }));

            res.json({
                success: true,
                results: formattedResults
            });

        } catch (error) {
            console.error("STUDENT ACADEMIC HISTORY:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load academic history."
            });
        }
    }
);


// ============================================================
// FOUNDER - GET SAVED MARKS FOR AN ASSESSMENT
// GET /api/marks/founder/assessments/:assessmentId/marks
// ============================================================

router.get(
    "/founder/assessments/:assessmentId/marks",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const { assessmentId } = req.params;

            if (!validId(assessmentId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid assessment ID."
                });
            }

            const assessment = await Assessment.findById(
                assessmentId
            );

            if (!assessment) {
                return res.status(404).json({
                    success: false,
                    message: "Assessment not found."
                });
            }

            const marks = await Marks.find({
                assessmentId
            })
            .populate("studentId", "name studentId grade")
            .sort({ createdAt: 1 })
            .lean();

            res.json({
                success: true,
                assessment,
                marks
            });

        } catch (error) {
            console.error("FOUNDER GET SAVED MARKS:", error);

            res.status(500).json({
                success: false,
                message: "Unable to load saved marks."
            });
        }
    }
);

module.exports = router;