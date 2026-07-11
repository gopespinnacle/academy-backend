const express = require("express");
const router = express.Router();

const TeacherSession = require("../models/TeacherSession");
const PeriodAssignment = require("../models/PeriodAssignment");

router.post("/start", async (req, res) => {

    try {

        const { room, periodId } = req.body;

        console.log("Room :", room);
        console.log("Period :", periodId);

        const period = await PeriodAssignment.findById(periodId);

        if (!period) {

            return res.status(404).json({
                success: false,
                message: "Period not found"
            });

        }

        const session = await TeacherSession.create({

            teacher: period.teacher,

            className: period.className,

            subject: period.subject,

            date: new Date(),

            startTime: period.startTime,

            endTime: period.endTime,

            teacherJoined: new Date(),

            classStarted: new Date()

        });

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