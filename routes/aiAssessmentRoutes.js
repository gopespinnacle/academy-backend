const express = require("express");
const router = express.Router();

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage()
});

const aiAssessmentController =
require("../controllers/AIAssessmentController");

/*
====================================================
Upload Chapter
====================================================
*/

router.post(
    "/upload-chapter",
    upload.single("file"),
    aiAssessmentController.uploadChapter
);

module.exports = router;