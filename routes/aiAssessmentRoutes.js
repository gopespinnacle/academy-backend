const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage()
});

const AIAssessmentController =
require("../controllers/AIAssessmentController");

/*
====================================================
Upload Chapter
====================================================
*/

router.post(
    "/upload-chapter",
    upload.single("file"),
    AIAssessmentController.uploadChapter
);

router.get(
    "/question-bank/:id",
    AIAssessmentController.getQuestionBank
);

router.get(
    "/question-bank",
    AIAssessmentController.getLatestQuestionBank
);

router.put(
    "/question-bank/:id",
    AIAssessmentController.updateQuestionBank
);

/*
====================================================
Generate Question Paper
====================================================
*/

router.post(

    "/generate-paper",

    AIAssessmentController.generateQuestionPaper

);


/*
====================================================
STUDENT ASSESSMENT SHEET
====================================================
*/

/*
Get question papers assigned
to the logged-in student
*/

router.get(

    "/student/assignments",

    AIAssessmentController.getStudentAssessments

);


/*
Get one particular assigned
question paper
*/

router.get(

    "/student/assignment/:assignmentId",

    AIAssessmentController.getStudentAssessment

);


/*
Submit multiple answer files
*/

router.post(

    "/student/assignment/:assignmentId/submit",

    upload.array("answerFiles", 20),

    AIAssessmentController.submitStudentAnswers

);


module.exports = router;