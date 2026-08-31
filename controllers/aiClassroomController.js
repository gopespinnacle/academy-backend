const PeriodAssignment = require("../models/PeriodAssignment");
const AIClassSettings = require("../models/AIClassSettings");

const {
    generateClassroomQuestions
} = require("../services/aiQuestionService");


/*
==========================================================
AI CLASSROOM QUESTION CONTROLLER
==========================================================

Responsible ONLY for:

1. Finding the teacher's current period
2. Checking class timing
3. Reading Founder AI settings
4. Generating questions from teacher transcript
5. Keeping questions tied to the exact period

Does NOT control:
- WebRTC
- Jitsi
- Microphone
- Camera
- Whiteboard
==========================================================
*/


async function generatePeriodQuestions(req, res) {

    try {

        const {

            teacherId,

            periodId,

            transcript,

            previousQuestions = []

        } = req.body;


        /*
        ==================================================
        VALIDATE BASIC DATA
        ==================================================
        */

        if (!teacherId) {

            return res.status(400).json({

                success: false,

                message: "Teacher ID is required."

            });

        }


        if (!periodId) {

            return res.status(400).json({

                success: false,

                message: "Period ID is required."

            });

        }


        if (
            !transcript ||
            !transcript.trim()
        ) {

            return res.status(400).json({

                success: false,

                message: "Teacher transcript is required."

            });

        }


        /*
        ==================================================
        FIND EXACT PERIOD
        ==================================================
        */

        const period =
            await PeriodAssignment.findById(
                periodId
            );


        if (!period) {

            return res.status(404).json({

                success: false,

                message: "Period not found."

            });

        }


        /*
        ==================================================
        SECURITY CHECK
        ==================================================
        */

        if (
            String(period.teacher)
            !==
            String(teacherId)
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "This period does not belong to this teacher."

            });

        }


        /*
        ==================================================
        CURRENT DAY
        ==================================================
        */

        const days = [

            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday"

        ];


        const now =
            new Date();


        const currentDay =
            days[now.getDay()];


        /*
        ==================================================
        CHECK PERIOD DAY
        ==================================================
        */

        if (
            String(period.day).trim()
            !==
            String(currentDay).trim()
        ) {

            return res.json({

                success: false,

                active: false,

                message:
                    "This period is not active today."

            });

        }


        /*
        ==================================================
        CONVERT PERIOD TIMES
        ==================================================
        */

        const [
            startHour,
            startMinute
        ] =
            period.startTime
                .split(":")
                .map(Number);


        const [
            endHour,
            endMinute
        ] =
            period.endTime
                .split(":")
                .map(Number);


        const classStart =
            new Date();


        classStart.setHours(
            startHour,
            startMinute,
            0,
            0
        );


        const classEnd =
            new Date();


        classEnd.setHours(
            endHour,
            endMinute,
            0,
            0
        );


        /*
        ==================================================
        CHECK CLASS TIMING
        ==================================================
        */

        if (
            now < classStart ||
            now >= classEnd
        ) {

            return res.json({

                success: false,

                active: false,

                message:
                    "The class is not currently active."

            });

        }


        /*
        ==================================================
        GET FOUNDER AI SETTINGS
        ==================================================
        */

        let settings =
            await AIClassSettings.findOne();


        if (!settings) {

            settings =
                await AIClassSettings.create({

                    enabled: true,

                    intervalMinutes: 10,

                    questionCount: 3

                });

        }


        /*
        ==================================================
        CHECK AI ENABLED
        ==================================================
        */

        if (!settings.enabled) {

            return res.json({

                success: false,

                active: true,

                enabled: false,

                message:
                    "AI Classroom Questions are disabled."

            });

        }


        /*
        ==================================================
        GENERATE QUESTIONS
        ==================================================
        */

        const questions =
            await generateClassroomQuestions({

                transcript,

                className:
                    period.className,

                subject:
                    period.subject || "",

                questionCount:
                    settings.questionCount,

                previousQuestions:
                    Array.isArray(previousQuestions)
                        ? previousQuestions
                        : []

            });


        /*
        ==================================================
        RESPONSE
        ==================================================
        */

        return res.json({

            success: true,

            active: true,

            enabled: true,

            periodId:
                period._id,

            className:
                period.className,

            subject:
                period.subject || "",

            day:
                period.day,

            startTime:
                period.startTime,

            endTime:
                period.endTime,

            intervalMinutes:
                settings.intervalMinutes,

            questionCount:
                settings.questionCount,

            questions

        });


    } catch (error) {

        console.error(
            "AI PERIOD QUESTION ERROR:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Unable to generate classroom questions.",

            error:
                error.message

        });

    }

}


module.exports = {

    generatePeriodQuestions

};