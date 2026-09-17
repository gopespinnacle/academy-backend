// =========================================================
// TEACHER ASSESSMENT CONTROLLER
// Gopes Pinnacle Academy
// =========================================================
// IMPORTANT:
// - This is ONLY for the NEW Public Child Assessment.
// - DO NOT modify teacherController.js.
// - DO NOT modify User.js.
// - DO NOT modify openAIService.js.
// =========================================================

const mongoose = require("mongoose");

const PublicAssessment = require("../models/PublicAssessment");
const AssessmentAssignment = require("../models/AssessmentAssignment");
const AssessmentDocument = require("../models/AssessmentDocument");


// =========================================================
// HELPER
// =========================================================

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}


// =========================================================
// FIND ASSIGNMENT FOR CURRENT TEACHER
// =========================================================

async function findTeacherAssignment(assessmentId, req) {

    const teacherMongoId =
        req.user && req.user._id
            ? String(req.user._id)
            : null;

    const teacherId =
        req.user && req.user.teacherId
            ? String(req.user.teacherId)
            : null;


    const conditions = [];


    if (teacherMongoId && isValidObjectId(teacherMongoId)) {

        conditions.push({
            teacher: teacherMongoId
        });

    }


    if (teacherId) {

        conditions.push({
            teacherId: teacherId
        });

    }


    if (!conditions.length) {
        return null;
    }


    const assessmentConditions = [];


    if (isValidObjectId(assessmentId)) {

        assessmentConditions.push({
            assessment: assessmentId
        });

    }


    assessmentConditions.push({
        assessmentId: assessmentId
    });


    return AssessmentAssignment.findOne({

        $and: [

            {
                $or: conditions
            },

            {
                $or: assessmentConditions
            }

        ]

    });

}


// =========================================================
// GET TEACHER ASSESSMENT INBOX
// =========================================================

exports.getTeacherAssessmentInbox = async (req, res) => {

    try {

        const teacherMongoId =
            req.user && req.user._id
                ? String(req.user._id)
                : null;

        const teacherId =
            req.user && req.user.teacherId
                ? String(req.user.teacherId)
                : null;


        if (!teacherMongoId && !teacherId) {

            return res.status(401).json({

                success: false,

                message:
                    "Teacher authentication is required."

            });

        }


        const teacherConditions = [];


        if (
            teacherMongoId &&
            isValidObjectId(teacherMongoId)
        ) {

            teacherConditions.push({
                teacher: teacherMongoId
            });

        }


        if (teacherId) {

            teacherConditions.push({
                teacherId
            });

        }


        const {
            status,
            subject,
            grade,
            page = 1,
            limit = 20
        } = req.query;


        const filter = {

            $or: teacherConditions

        };


        if (status) {

            filter.status = status;

        } else {

            filter.status = {
                $in: [
                    "ASSIGNED",
                    "OPENED",
                    "UNDER_REVIEW",
                    "EVALUATED"
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
            Math.max(
                parseInt(limit, 10) || 20,
                1
            ),
            100
        );


        const skip =
            (pageNumber - 1) * limitNumber;


        const [
            assignments,
            total
        ] = await Promise.all([

            AssessmentAssignment
                .find(filter)
                .populate(
                    "assessment"
                )
                .sort({
                    assignedAt: -1,
                    createdAt: -1
                })
                .skip(skip)
                .limit(limitNumber)
                .lean(),

            AssessmentAssignment.countDocuments(
                filter
            )

        ]);


        return res.json({

            success: true,

            assignments,

            pagination: {

                page: pageNumber,

                limit: limitNumber,

                total,

                totalPages:
                    Math.ceil(
                        total / limitNumber
                    )

            }

        });

    } catch (error) {

        console.error(
            "Teacher Assessment Inbox Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load assigned assessments."

        });

    }

};


// =========================================================
// OPEN ASSESSMENT
// =========================================================

exports.getTeacherAssessment = async (req, res) => {

    try {

        const {
            assessmentId
        } = req.params;


        if (!assessmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "Assessment ID is required."

            });

        }


        const assignment =
            await findTeacherAssignment(
                assessmentId,
                req
            );


        if (!assignment) {

            return res.status(403).json({

                success: false,

                message:
                    "This assessment is not assigned to you."

            });

        }


        const assessment =
            await PublicAssessment
                .findById(
                    assignment.assessment
                )
                .lean();


        if (!assessment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found."

            });

        }


        // -------------------------------------------------
        // Mark assignment as opened
        // -------------------------------------------------

        if (
            assignment.status === "ASSIGNED"
        ) {

            assignment.status =
                "OPENED";

            assignment.openedAt =
                new Date();

            assignment.lastActivityAt =
                new Date();

            await assignment.save();

        }


        return res.json({

            success: true,

            assignment,

            assessment

        });

    } catch (error) {

        console.error(
            "Get Teacher Assessment Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to open assessment."

        });

    }

};


// =========================================================
// GET ASSESSMENT DOCUMENTS
// Teacher can see documents belonging to this assessment
// =========================================================

exports.getAssessmentDocuments = async (
    req,
    res
) => {

    try {

        const {
            assessmentId
        } = req.params;


        const assignment =
            await findTeacherAssignment(
                assessmentId,
                req
            );


        if (!assignment) {

            return res.status(403).json({

                success: false,

                message:
                    "This assessment is not assigned to you."

            });

        }


        const documents =
            await AssessmentDocument
                .find({

                    assessment:
                        assignment.assessment

                })
                .sort({

                    caseStudyId: 1,

                    uploadedAt: 1

                })
                .lean();


        return res.json({

            success: true,

            documents

        });

    } catch (error) {

        console.error(
            "Teacher Assessment Documents Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load assessment documents."

        });

    }

};


// =========================================================
// GET ONE DOCUMENT
// =========================================================

exports.getAssessmentDocument = async (
    req,
    res
) => {

    try {

        const {
            assessmentId,
            documentId
        } = req.params;


        const assignment =
            await findTeacherAssignment(
                assessmentId,
                req
            );


        if (!assignment) {

            return res.status(403).json({

                success: false,

                message:
                    "This assessment is not assigned to you."

            });

        }


        if (
            !isValidObjectId(documentId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid document ID."

            });

        }


        const document =
            await AssessmentDocument
                .findOne({

                    _id: documentId,

                    assessment:
                        assignment.assessment

                })
                .lean();


        if (!document) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment document not found."

            });

        }


        return res.json({

            success: true,

            document

        });

    } catch (error) {

        console.error(
            "Teacher Assessment Document Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to load document."

        });

    }

};


// =========================================================
// SAVE TEACHER MARKS
// =========================================================

exports.saveEvaluation = async (req, res) => {

    try {

        const {
            assessmentId
        } = req.params;


        const {
            caseStudyMarks,
            teacherFeedback
        } = req.body;


        const assignment =
            await findTeacherAssignment(
                assessmentId,
                req
            );


        if (!assignment) {

            return res.status(403).json({

                success: false,

                message:
                    "This assessment is not assigned to you."

            });

        }


        const assessment =
            await PublicAssessment.findById(
                assignment.assessment
            );


        if (!assessment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found."

            });

        }


        // -------------------------------------------------
        // Validate case-study marks
        // -------------------------------------------------

        if (
            caseStudyMarks !== undefined &&
            caseStudyMarks !== null
        ) {

            if (
                !Array.isArray(
                    caseStudyMarks
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Case-study marks must be an array."

                });

            }


            for (
                const item
                of caseStudyMarks
            ) {

                if (!item.caseStudyId) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Each case study mark requires a caseStudyId."

                    });

                }


                const marks =
                    Number(
                        item.marksObtained
                    );


                if (
                    !Number.isFinite(marks) ||
                    marks < 0
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid case-study marks."

                    });

                }


                const caseStudy =
                    assessment.caseStudies
                        .find(
                            item2 =>
                                item2.caseStudyId ===
                                item.caseStudyId
                        );


                if (!caseStudy) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid case study."

                    });

                }


                if (
                    marks >
                    Number(
                        caseStudy.totalMarks || 0
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Marks cannot exceed case-study maximum marks."

                    });

                }

            }

        }


        // -------------------------------------------------
        // Save case-study marks
        // -------------------------------------------------

        if (
            Array.isArray(
                caseStudyMarks
            )
        ) {

            for (
                const item
                of caseStudyMarks
            ) {

                const caseStudy =
                    assessment.caseStudies
                        .find(
                            item2 =>
                                item2.caseStudyId ===
                                item.caseStudyId
                        );


                if (caseStudy) {

                    caseStudy.marksObtained =
                        Number(
                            item.marksObtained
                        );

                }

            }

        }


        // -------------------------------------------------
        // Save teacher feedback
        // -------------------------------------------------

        if (
            teacherFeedback !== undefined
        ) {

            assignment.teacherFeedback =
                String(
                    teacherFeedback
                ).trim();

        }


        assignment.status =
            "UNDER_REVIEW";

        assignment.lastActivityAt =
            new Date();

        assignment.reviewStartedAt =
            assignment.reviewStartedAt ||
            new Date();


        await assessment.save();
        await assignment.save();


        return res.json({

            success: true,

            message:
                "Evaluation saved successfully.",

            assessmentId:
                assessment.assessmentId,

            status:
                assignment.status

        });

    } catch (error) {

        console.error(
            "Save Teacher Evaluation Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to save evaluation."

        });

    }

};


// =========================================================
// SUBMIT FINAL TEACHER EVALUATION
// =========================================================

exports.submitEvaluation = async (
    req,
    res
) => {

    try {

        const {
            assessmentId
        } = req.params;


        const {
            caseStudyMarks,
            teacherFeedback
        } = req.body;


        const assignment =
            await findTeacherAssignment(
                assessmentId,
                req
            );


        if (!assignment) {

            return res.status(403).json({

                success: false,

                message:
                    "This assessment is not assigned to you."

            });

        }


        const assessment =
            await PublicAssessment.findById(
                assignment.assessment
            );


        if (!assessment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found."

            });

        }


        // -------------------------------------------------
        // Apply submitted case-study marks
        // -------------------------------------------------

        if (
            Array.isArray(
                caseStudyMarks
            )
        ) {

            for (
                const item
                of caseStudyMarks
            ) {

                const caseStudy =
                    assessment.caseStudies
                        .find(
                            item2 =>
                                item2.caseStudyId ===
                                item.caseStudyId
                        );


                if (!caseStudy) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid case study ID."

                    });

                }


                const marks =
                    Number(
                        item.marksObtained
                    );


                if (
                    !Number.isFinite(marks) ||
                    marks < 0 ||
                    marks >
                    Number(
                        caseStudy.totalMarks || 0
                    )
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Invalid case-study marks."

                    });

                }


                caseStudy.marksObtained =
                    marks;

            }

        }


        // -------------------------------------------------
        // Ensure all case studies have marks
        // -------------------------------------------------

        const incompleteCaseStudy =
            assessment.caseStudies
                .some(
                    item =>
                        item.marksObtained ===
                        null ||
                        item.marksObtained ===
                        undefined
                );


        if (incompleteCaseStudy) {

            return res.status(400).json({

                success: false,

                message:
                    "Please evaluate all case studies before submitting."

            });

        }


        // -------------------------------------------------
        // Teacher feedback
        // -------------------------------------------------

        if (
            teacherFeedback !== undefined
        ) {

            assignment.teacherFeedback =
                String(
                    teacherFeedback
                ).trim();

        }


        // -------------------------------------------------
        // Calculate case-study total
        // -------------------------------------------------

        const caseStudyTotal =
            assessment.caseStudies.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.marksObtained || 0
                    ),
                0
            );


        const caseStudyMaximum =
            assessment.caseStudies.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    Number(
                        item.totalMarks || 0
                    ),
                0
            );


        // -------------------------------------------------
        // MCQ score should already be present
        // -------------------------------------------------

        const mcqScore =
            Number(
                assessment.scores &&
                assessment.scores.mcq
                    ? assessment.scores.mcq
                    : 0
            );


        const mcqMaximum =
            Number(
                assessment.scores &&
                assessment.scores.mcqTotal
                    ? assessment.scores.mcqTotal
                    : 0
            );


        const finalScore =
            mcqScore +
            caseStudyTotal;


        const finalMaximum =
            mcqMaximum +
            caseStudyMaximum;


        // -------------------------------------------------
        // Save assessment score
        // -------------------------------------------------

        assessment.scores = {

            ...(assessment.scores || {}),

            mcq:
                mcqScore,

            mcqTotal:
                mcqMaximum,

            caseStudy:
                caseStudyTotal,

            caseStudyTotal:
                caseStudyMaximum,

            total:
                finalScore,

            totalMarks:
                finalMaximum,

            percentage:
                finalMaximum > 0
                    ? Number(
                        (
                            finalScore /
                            finalMaximum
                        ) * 100
                    .toFixed(2)
                    )
                    : 0

        };


        assessment.status =
            "EVALUATED";

        assessment.evaluatedAt =
            new Date();


        assignment.caseStudyScore =
            caseStudyTotal;

        assignment.finalScore =
            finalScore;

        assignment.finalMaximum =
            finalMaximum;

        assignment.teacherFeedback =
            String(
                teacherFeedback ||
                assignment.teacherFeedback ||
                ""
            ).trim();

        assignment.status =
            "EVALUATED";

        assignment.evaluatedAt =
            new Date();

        assignment.lastActivityAt =
            new Date();


        await assessment.save();
        await assignment.save();


        return res.json({

            success: true,

            message:
                "Assessment evaluation submitted successfully.",

            assessmentId:
                assessment.assessmentId,

            status:
                "EVALUATED",

            score: {

                total:
                    finalScore,

                totalMarks:
                    finalMaximum,

                percentage:
                    assessment.scores.percentage

            }

        });

    } catch (error) {

        console.error(
            "Submit Teacher Evaluation Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to submit evaluation."

        });

    }

};


// =========================================================
// UPDATE DOCUMENT REVIEW INFORMATION
// =========================================================

exports.updateDocumentReview = async (
    req,
    res
) => {

    try {

        const {
            assessmentId,
            documentId
        } = req.params;


        const {
            teacherFeedback,
            marksObtained
        } = req.body;


        const assignment =
            await findTeacherAssignment(
                assessmentId,
                req
            );


        if (!assignment) {

            return res.status(403).json({

                success: false,

                message:
                    "This assessment is not assigned to you."

            });

        }


        if (
            !isValidObjectId(documentId)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid document ID."

            });

        }


        const document =
            await AssessmentDocument.findOne({

                _id: documentId,

                assessment:
                    assignment.assessment

            });


        if (!document) {

            return res.status(404).json({

                success: false,

                message:
                    "Document not found."

            });

        }


        if (
            teacherFeedback !== undefined
        ) {

            document.teacherFeedback =
                String(
                    teacherFeedback
                ).trim();

        }


        if (
            marksObtained !== undefined
        ) {

            const marks =
                Number(
                    marksObtained
                );


            if (
                !Number.isFinite(marks) ||
                marks < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid marks."

                });

            }


            document.marksObtained =
                marks;

        }


        document.reviewStatus =
            "IN_REVIEW";

        document.reviewedBy =
            req.user &&
            req.user._id
                ? req.user._id
                : null;

        document.reviewedAt =
            new Date();


        await document.save();


        assignment.status =
            "UNDER_REVIEW";

        assignment.lastActivityAt =
            new Date();

        await assignment.save();


        return res.json({

            success: true,

            message:
                "Document review information saved."

        });

    } catch (error) {

        console.error(
            "Update Document Review Error:",
            error
        );

        return res.status(500).json({

            success: false,

            message:
                "Unable to save document review."

        });

    }

};


// =========================================================
// EXPORT
// =========================================================

module.exports = {

    getTeacherAssessmentInbox:
        exports.getTeacherAssessmentInbox,

    getTeacherAssessment:
        exports.getTeacherAssessment,

    getAssessmentDocuments:
        exports.getAssessmentDocuments,

    getAssessmentDocument:
        exports.getAssessmentDocument,

    saveEvaluation:
        exports.saveEvaluation,

    submitEvaluation:
        exports.submitEvaluation,

    updateDocumentReview:
        exports.updateDocumentReview

};