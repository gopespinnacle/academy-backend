/**
 * Gopes Pinnacle Academy
 *
 * PUBLIC ASSESSMENT ROUTES
 *
 * This is a NEW isolated route file for:
 * "Your Child Assessment"
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * DO NOT MODIFY:
 *
 * - existing route files
 * - server.js
 * - openAIService.js
 * - User.js
 *
 * This file only connects HTTP endpoints to:
 *
 * controllers/publicAssessmentController.js
 */


/* ============================================================
   DEPENDENCIES
============================================================ */

const express = require("express");

const router = express.Router();

const publicAssessmentController =
    require("../controllers/publicAssessmentController");


/* ============================================================
   PUBLIC ASSESSMENT ROUTES
============================================================ */

/**
 * ------------------------------------------------------------
 * CREATE ASSESSMENT
 * ------------------------------------------------------------
 *
 * Parent/student submits:
 *
 * - Student Name
 * - Parent Name
 * - WhatsApp Number
 * - Parent Email
 * - Grade
 * - Subject
 * - Subject Split-up
 * - Selected Chapters
 *
 * Server:
 * - validates data
 * - validates chapters
 * - generates assessment ID
 * - creates PublicAssessment
 *
 * Example:
 *
 * POST /api/public-assessment/create
 */
router.post(
    "/create",
    publicAssessmentController.createAssessment
);


/**
 * ------------------------------------------------------------
 * GENERATE QUESTIONS
 * ------------------------------------------------------------
 *
 * Generates:
 *
 * - MCQs
 * - Case Studies
 *
 * using the NEW isolated:
 *
 * services/publicAssessmentAIService.js
 *
 * Example:
 *
 * POST /api/public-assessment/ARJ-ASS1/generate
 *
 * Optional body:
 *
 * {
 *     "mcqCount": 20,
 *     "caseStudyCount": 2
 * }
 */
router.post(
    "/:assessmentId/generate",
    publicAssessmentController.generateQuestions
);


/**
 * ------------------------------------------------------------
 * GET ASSESSMENT
 * ------------------------------------------------------------
 *
 * Used to retrieve an assessment using its public
 * assessment ID.
 *
 * Example:
 *
 * GET /api/public-assessment/ARJ-ASS1
 */
router.get(
    "/:assessmentId",
    publicAssessmentController.getAssessment
);


/**
 * ------------------------------------------------------------
 * SUBMIT MCQ ANSWERS
 * ------------------------------------------------------------
 *
 * Student submits online MCQ answers.
 *
 * Example:
 *
 * POST /api/public-assessment/ARJ-ASS1/mcq
 *
 * Body:
 *
 * {
 *     "answers": [
 *         {
 *             "questionId": "Q1",
 *             "selectedAnswer": "B"
 *         }
 *     ]
 * }
 */
router.post(
    "/:assessmentId/mcq",
    publicAssessmentController.submitMCQ
);


/**
 * ------------------------------------------------------------
 * ATTACH CASE STUDY DOCUMENTS
 * ------------------------------------------------------------
 *
 * Links uploaded document IDs to the exact:
 *
 * assessment
 * +
 * case study
 *
 * This prevents documents from being mixed between
 * different assessments/case studies.
 *
 * Example:
 *
 * POST
 * /api/public-assessment/ARJ-ASS1/case-study/CS1/documents
 *
 * Body:
 *
 * {
 *     "documentIds": [
 *         "..."
 *     ]
 * }
 */
router.post(
    "/:assessmentId/case-study/:caseStudyId/documents",
    publicAssessmentController.attachCaseStudyDocuments
);


/**
 * ------------------------------------------------------------
 * FINAL ASSESSMENT SUBMISSION
 * ------------------------------------------------------------
 *
 * Student confirms that the complete assessment is finished.
 *
 * The controller verifies:
 *
 * - MCQs completed
 * - Case Study documents uploaded
 *
 * It then changes the assessment status to SUBMITTED.
 *
 * Example:
 *
 * POST /api/public-assessment/ARJ-ASS1/submit
 */
router.post(
    "/:assessmentId/submit",
    publicAssessmentController.submitAssessment
);


/**
 * ------------------------------------------------------------
 * ASSESSMENT STATUS
 * ------------------------------------------------------------
 *
 * Used by the result/status page.
 *
 * Before teacher evaluation:
 * - status is returned
 * - final score is NOT exposed
 *
 * After FINALIZED:
 * - score
 * - maximum marks
 * - percentage
 *
 * can be returned.
 *
 * Example:
 *
 * GET /api/public-assessment/ARJ-ASS1/status
 */
router.get(
    "/:assessmentId/status",
    publicAssessmentController.getAssessmentStatus
);


/* ============================================================
   EXPORT ROUTER
============================================================ */

module.exports = router;