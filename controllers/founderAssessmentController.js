// =========================================================
// FOUNDER ASSESSMENT CONTROLLER
// Gopes Pinnacle Academy
// =========================================================
// IMPORTANT:
// - This controller is isolated for the NEW public assessment
//   feature.
// - DO NOT modify User.js.
// - DO NOT modify existing founderController.js.
// - DO NOT modify openAIService.js.
// =========================================================

const mongoose = require("mongoose");

const PublicAssessment = require("../models/PublicAssessment");
const AssessmentAssignment = require("../models/AssessmentAssignment");
const User = require("../models/User");


// =========================================================
// HELPER — SAFE OBJECT ID
// =========================================================

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}


// =========================================================
// GET ASSESSMENT INBOX
// Founder sees submitted assessments
// =========================================================

exports.getAssessmentInbox = async (req, res) => {

    try {

        const {
            status,
            subject,
            grade,
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // -------------------------------------------------
        // Default inbox:
        // Show assessments that need founder processing
        // -------------------------------------------------

        if (status) {

            filter.status = status;

        } else {

            filter.status = {
                $in: [
                    "SUBMITTED",
                    "UNDER_REVIEW",
                    "EVALUATED",
                    "FINALIZED"
                ]
            };

        }

        if (subject) {
            filter.subject = subject;
        }

        if (grade) {
            filter.grade = grade;
        }


        const pageNumber = Math.max(
            parseInt(page, 10) || 1,
            1
        );

        const limitNumber = Math.min(
            Math.max(parseInt(limit, 10) || 20, 1),
            100
        );

        const skip =
            (pageNumber - 1) * limitNumber;


        const [assessments, total] =
            await Promise.all([

                PublicAssessment
                    .find(filter)
                    .populate(
                        "assignedTeacher",
                        "name teacherId email subject"
                    )
                    .sort({
                        submittedAt: -1,
                        createdAt: -1
                    })
                    .skip(skip)
                    .limit(limitNumber)
                    .lean(),

                PublicAssessment.countDocuments(filter)

            ]);


        return res.json({

            success: true,

            assessments,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total,
                totalPages: Math.ceil(
                    total / limitNumber
                )
            }

        });

    } catch (error) {

        console.error(
            "Founder Assessment Inbox Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load assessment inbox."

        });

    }

};


// =========================================================
// GET SINGLE ASSESSMENT
// Founder can inspect assessment before assignment
// =========================================================

exports.getAssessmentForFounder = async (req, res) => {

    try {

        const { assessmentId } = req.params;

        if (!assessmentId) {

            return res.status(400).json({

                success: false,
                message: "Assessment ID is required."

            });

        }


        const query =
            isValidObjectId(assessmentId)

                ? {
                    $or: [
                        { _id: assessmentId },
                        { assessmentId }
                    ]
                }

                : {
                    assessmentId
                };


        const assessment =
            await PublicAssessment
                .findOne(query)
                .populate(
                    "assignedTeacher",
                    "name teacherId email subject"
                )
                .lean();


        if (!assessment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found."

            });

        }


        return res.json({

            success: true,
            assessment

        });

    } catch (error) {

        console.error(
            "Get Founder Assessment Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load assessment."

        });

    }

};


// =========================================================
// GET TEACHERS FOR ASSESSMENT
// IMPORTANT:
// Teacher filtering uses EXISTING User.subject array.
// User.js is NOT modified.
// =========================================================

exports.getAssessmentTeachers = async (req, res) => {

    try {

        const { subject } = req.query;


        if (!subject) {

            return res.status(400).json({

                success: false,

                message:
                    "Subject is required."

            });

        }


        // -------------------------------------------------
        // Case-insensitive subject matching
        // against existing User.subject array.
        //
        // Example:
        // User.subject = ["Science"]
        //
        // Only teachers with matching subject are returned.
        // -------------------------------------------------

        const teachers =
            await User.find({

                role: "teacher",

                subject: {
                    $elemMatch: {
                        $regex:
                            new RegExp(
                                `^${subject.replace(
                                    /[.*+?^${}()|[\]\\]/g,
                                    "\\$&"
                                )}$`,
                                "i"
                            )
                    }
                }

            })
            .select(
                "_id name teacherId email subject"
            )
            .sort({
                name: 1
            })
            .lean();


        return res.json({

            success: true,

            subject,

            teachers

        });

    } catch (error) {

        console.error(
            "Assessment Teacher List Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load teachers."

        });

    }

};


// =========================================================
// ASSIGN ASSESSMENT TO TEACHER
// =========================================================

exports.assignAssessment = async (req, res) => {

    try {

        const { assessmentId } = req.params;

        const {
            teacherId,
            teacherMongoId
        } = req.body;


        if (!assessmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Assessment ID is required."

            });

        }


        if (!teacherId && !teacherMongoId) {

            return res.status(400).json({

                success: false,

                message:
                    "Teacher selection is required."

            });

        }


        // -------------------------------------------------
        // Find assessment
        // -------------------------------------------------

        const assessmentQuery =
            isValidObjectId(assessmentId)

                ? {
                    $or: [
                        { _id: assessmentId },
                        { assessmentId }
                    ]
                }

                : {
                    assessmentId
                };


        const assessment =
            await PublicAssessment.findOne(
                assessmentQuery
            );


        if (!assessment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found."

            });

        }


        // -------------------------------------------------
        // Find selected teacher
        // -------------------------------------------------

        let teacher;


        if (
            teacherMongoId &&
            isValidObjectId(teacherMongoId)
        ) {

            teacher =
                await User.findOne({

                    _id: teacherMongoId,

                    role: "teacher"

                });

        } else {

            teacher =
                await User.findOne({

                    teacherId,

                    role: "teacher"

                });

        }


        if (!teacher) {

            return res.status(404).json({

                success: false,

                message:
                    "Selected teacher was not found."

            });

        }


        // -------------------------------------------------
        // Verify teacher teaches this subject
        // using EXISTING User.subject field.
        // -------------------------------------------------

        const teacherSubjects =
            Array.isArray(teacher.subject)
                ? teacher.subject
                : [];


        const subjectMatches =
            teacherSubjects.some(
                item =>
                    String(item).trim().toLowerCase() ===
                    String(assessment.subject)
                        .trim()
                        .toLowerCase()
            );


        if (!subjectMatches) {

            return res.status(400).json({

                success: false,

                message:
                    "This teacher is not assigned to the assessment subject."

            });

        }


        // -------------------------------------------------
        // Founder identity
        // -------------------------------------------------

        const founderId =
            req.user && req.user._id
                ? req.user._id
                : null;

        const founderName =
            req.user && req.user.name
                ? req.user.name
                : "Founder";


        // -------------------------------------------------
        // Check existing assignment
        // -------------------------------------------------

        let assignment =
            await AssessmentAssignment.findOne({

                assessment:
                    assessment._id

            });


        // -------------------------------------------------
        // CREATE NEW ASSIGNMENT
        // -------------------------------------------------

        if (!assignment) {

            assignment =
                new AssessmentAssignment({

                    assessment:
                        assessment._id,

                    assessmentId:
                        assessment.assessmentId,

                    studentName:
                        assessment.studentName,

                    grade:
                        assessment.grade,

                    subject:
                        assessment.subject,

                    teacher:
                        teacher._id,

                    teacherId:
                        teacher.teacherId,

                    teacherName:
                        teacher.name,

                    assignedBy:
                        founderId,

                    assignedByName:
                        founderName,

                    status:
                        "ASSIGNED",

                    assignedAt:
                        new Date(),

                    lastActivityAt:
                        new Date()

                });


        } else {

            // -------------------------------------------------
            // REASSIGNMENT
            // -------------------------------------------------

            assignment.previousTeacher =
                assignment.teacher;

            assignment.previousTeacherId =
                assignment.teacherId;

            assignment.previousTeacherName =
                assignment.teacherName;

            assignment.teacher =
                teacher._id;

            assignment.teacherId =
                teacher.teacherId;

            assignment.teacherName =
                teacher.name;

            assignment.assignedBy =
                founderId;

            assignment.assignedByName =
                founderName;

            assignment.status =
                "ASSIGNED";

            assignment.assignedAt =
                new Date();

            assignment.reassignedAt =
                new Date();

            assignment.reassignmentReason =
                "Reassigned by founder";

            assignment.lastActivityAt =
                new Date();

        }


        await assignment.save();


        // -------------------------------------------------
        // Update PublicAssessment
        // -------------------------------------------------

        assessment.assignedTeacher =
            teacher._id;

        assessment.status =
            "UNDER_REVIEW";


        await assessment.save();


        return res.json({

            success: true,

            message:
                "Assessment assigned successfully.",

            assessmentId:
                assessment.assessmentId,

            assignment: {

                id:
                    assignment._id,

                teacherId:
                    teacher.teacherId,

                teacherName:
                    teacher.name,

                subject:
                    assessment.subject,

                status:
                    assignment.status

            }

        });

    } catch (error) {

        console.error(
            "Assign Assessment Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to assign assessment."

        });

    }

};


// =========================================================
// GET ASSIGNMENT DETAILS
// =========================================================

exports.getAssignment = async (req, res) => {

    try {

        const { assessmentId } = req.params;


        if (!assessmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Assessment ID is required."

            });

        }


        const assignment =
            await AssessmentAssignment
                .findOne({

                    $or: [

                        {
                            assessmentId
                        },

                        ...(isValidObjectId(
                            assessmentId
                        )
                            ? [
                                {
                                    assessment:
                                        assessmentId
                                }
                            ]
                            : [])

                    ]

                })
                .populate(
                    "teacher",
                    "name teacherId email subject"
                )
                .populate(
                    "assignedBy",
                    "name email"
                )
                .lean();


        if (!assignment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment assignment not found."

            });

        }


        return res.json({

            success: true,

            assignment

        });

    } catch (error) {

        console.error(
            "Get Assessment Assignment Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load assignment."

        });

    }

};


// =========================================================
// EXPORT COMPLETE CONTROLLER
// =========================================================

module.exports = {

    getAssessmentInbox:
        exports.getAssessmentInbox,

    getAssessmentForFounder:
        exports.getAssessmentForFounder,

    getAssessmentTeachers:
        exports.getAssessmentTeachers,

    assignAssessment:
        exports.assignAssessment,

    getAssignment:
        exports.getAssignment

};