const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const controller = require("../controllers/teacherApplicationController");

router.post(
    "/teacher-application",
    upload.single("resume"),
    controller.submitApplication
);

module.exports = router;