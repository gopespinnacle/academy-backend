// =========================================================
// TEACHER ASSESSMENT ROUTES
// Gopes Pinnacle Academy
// =========================================================

const express = require("express");

const router = express.Router();

const teacherAssessmentController =
    require("../controllers/teacherAssessmentController");


// =========================================================
// TEACHER ASSESSMENT INBOX
// =========================================================

router.get(
    "/inbox",
    teacherAssessmentController.getTeacherAssessmentInbox
);


// =========================================================
// OPEN ONE ASSIGNED ASSESSMENT
// =========================================================

router.get(
    "/:assessmentId",
    teacherAssessmentController.getTeacherAssessment
);


// =========================================================
// GET ALL DOCUMENTS FOR ASSESSMENT
// =========================================================

router.get(
    "/:assessmentId/documents",
    teacherAssessmentController.getAssessmentDocuments
);


// =========================================================
// GET ONE DOCUMENT
// =========================================================

router.get(
    "/:assessmentId/documents/:documentId",
    teacherAssessmentController.getAssessmentDocument
);


// =========================================================
// SAVE EVALUATION WITHOUT FINAL SUBMISSION
// =========================================================

router.post(
    "/:assessmentId/evaluation/save",
    teacherAssessmentController.saveEvaluation
);


// =========================================================
// SUBMIT FINAL TEACHER EVALUATION
// =========================================================

router.post(
    "/:assessmentId/evaluation/submit",
    teacherAssessmentController.submitEvaluation
);


// =========================================================
// UPDATE DOCUMENT REVIEW / MARKS / FEEDBACK
// =========================================================

router.post(
    "/:assessmentId/documents/:documentId/review",
    teacherAssessmentController.updateDocumentReview
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;