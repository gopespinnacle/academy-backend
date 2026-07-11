const express = require("express");
const router = express.Router();

const TeacherSession = require("../models/TeacherSession");

router.post("/start", async (req, res) => {

    try {

        const session = await TeacherSession.create(req.body);

        res.json({
            success: true,
            session
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

module.exports = router;