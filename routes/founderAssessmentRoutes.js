// =========================================================
// FOUNDER ASSESSMENT ROUTES
// Gopes Pinnacle Academy
// =========================================================

const express = require("express");

const router = express.Router();

const founderAssessmentController =
    require("../controllers/founderAssessmentController");


// =========================================================
// ASSESSMENT INBOX
// =========================================================

router.get(
    "/inbox",
    founderAssessmentController.getAssessmentInbox
);


// =========================================================
// SINGLE ASSESSMENT
// =========================================================

router.get(
    "/:assessmentId",
    founderAssessmentController.getAssessmentForFounder
);


// =========================================================
// TEACHERS FOR ASSESSMENT SUBJECT
// =========================================================

router.get(
    "/teachers/list",
    founderAssessmentController.getAssessmentTeachers
);


// =========================================================
// ASSIGN / REASSIGN ASSESSMENT
// =========================================================

router.post(
    "/:assessmentId/assign",
    founderAssessmentController.assignAssessment
);


// =========================================================
// ASSIGNMENT DETAILS
// =========================================================

router.get(
    "/:assessmentId/assignment",
    founderAssessmentController.getAssignment
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;