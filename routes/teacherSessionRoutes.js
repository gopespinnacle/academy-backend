const express = require("express");
const router = express.Router();

const TeacherSession = require("../models/TeacherSession");

router.post("/start", async (req, res) => {

    try {

        console.log("Teacher Session Start API Called");

        res.json({
            success: true,
            message: "Teacher Session API Working"
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false
        });

    }

});

module.exports = router;