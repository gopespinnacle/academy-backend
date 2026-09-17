// =========================================================
// ASSESSMENT CURRICULUM ROUTES
// Gopes Pinnacle Academy
// =========================================================
//
// READ-ONLY CURRICULUM API
//
// Grade → Subject → Split-up → Chapters → Concepts
//
// =========================================================

const express = require("express");

const router = express.Router();

const assessmentCurriculumController =
    require("../controllers/assessmentCurriculumController");


// =========================================================
// GET ALL AVAILABLE GRADES
// =========================================================

router.get(
    "/grades",
    assessmentCurriculumController.getGrades
);


// =========================================================
// GET SUBJECTS FOR GRADE
// =========================================================

router.get(
    "/subjects",
    assessmentCurriculumController.getSubjects
);


// =========================================================
// GET SPLIT-UPS FOR GRADE + SUBJECT
// =========================================================

router.get(
    "/split-ups",
    assessmentCurriculumController.getSplitUps
);


// =========================================================
// GET CHAPTERS
// =========================================================

router.get(
    "/chapters",
    assessmentCurriculumController.getChapters
);


// =========================================================
// GET SELECTED CHAPTER DETAILS
// =========================================================

router.post(
    "/chapter-details",
    assessmentCurriculumController.getChapterDetails
);


// =========================================================
// GET CURRICULUM SUMMARY
// =========================================================

router.get(
    "/summary",
    assessmentCurriculumController.getCurriculumSummary
);


// =========================================================
// EXPORT
// =========================================================

module.exports = router;