const express = require("express");
const router = express.Router();

const ClassSession = require("../models/ClassSession");

router.post("/create", async (req, res) => {

    try {

        const session = await ClassSession.create({

            teacherId: req.body.teacherId,

            teacherName: req.body.teacherName,

            className: req.body.className,

            subject: req.body.subject,

            day: req.body.day,

            date: req.body.date,

            periodStart: req.body.periodStart,

            periodEnd: req.body.periodEnd,

            room: req.body.room,

            students: req.body.students,

            meetingIn: new Date(),

            status: "Live"

        });

        res.json({

            success: true,

            sessionId: session._id

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