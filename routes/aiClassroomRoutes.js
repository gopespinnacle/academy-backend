const express = require("express");

const router = express.Router();

const AIClassSettings =
    require("../models/AIClassSettings");

    const {
    generateClassroomQuestions
} = require("../services/aiQuestionService");
const {
    generatePeriodQuestions
} = require("../controllers/aiClassroomController");


// =====================================================
// GET AI CLASSROOM SETTINGS
// =====================================================

router.get(
    "/settings",
    async (req, res) => {

        try {

            let settings =
                await AIClassSettings.findOne();

            // Create default settings if none exist
            if (!settings) {

                settings =
                    await AIClassSettings.create({

                        enabled: true,

                        intervalMinutes: 10,

                        questionCount: 3

                    });

            }

            res.json({

                success: true,

                data: settings

            });

        } catch (error) {

            console.log(
                "AI SETTINGS GET ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message: "Server error"

            });

        }

    }
);


// =====================================================
// SAVE AI CLASSROOM SETTINGS
// =====================================================

router.put(
    "/settings",
    async (req, res) => {

        try {

            const {
                enabled,
                intervalMinutes
            } = req.body;


            // ==========================================
            // VALID INTERVALS
            // ==========================================

            const questionMap = {

                5: 1,

                10: 3,

                15: 6,

                20: 9

            };


            if (
                !questionMap[
                    Number(intervalMinutes)
                ]
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid question interval"

                });

            }


            // ==========================================
            // FIND EXISTING SETTINGS
            // ==========================================

            let settings =
                await AIClassSettings.findOne();


            // ==========================================
            // CREATE IF NOT EXISTS
            // ==========================================

            if (!settings) {

                settings =
                    new AIClassSettings();

            }


            // ==========================================
            // SAVE
            // ==========================================

            settings.enabled =
                enabled !== false;

            settings.intervalMinutes =
                Number(intervalMinutes);

            settings.questionCount =
                questionMap[
                    Number(intervalMinutes)
                ];


            await settings.save();


            res.json({

                success: true,

                message:
                    "AI Classroom settings saved successfully",

                data: settings

            });


        } catch (error) {

            console.log(
                "AI SETTINGS SAVE ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message: "Server error"

            });

        }

    }
);

// =====================================================
// GENERATE AI CLASSROOM QUESTIONS
// =====================================================

router.post(
    "/classroom/generate-questions",
    async (req, res) => {

        try {

            const {
                transcript,
                className,
                subject,
                previousQuestions = []
            } = req.body;


            // ==========================================
            // VALIDATE TRANSCRIPT
            // ==========================================

            if (
                !transcript ||
                !transcript.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Teacher transcript is required"

                });

            }


            // ==========================================
            // GET FOUNDER AI SETTINGS
            // ==========================================

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


            // ==========================================
            // CHECK AI ENABLED
            // ==========================================

            if (!settings.enabled) {

                return res.json({

                    success: false,

                    enabled: false,

                    message:
                        "AI Classroom Questions are disabled"

                });

            }


            // ==========================================
            // GENERATE QUESTIONS
            // ==========================================

            const questions =
                await generateClassroomQuestions({

                    transcript,

                    className:
                        className || "",

                    subject:
                        subject || "",

                    questionCount:
                        settings.questionCount,

                    previousQuestions:
                        Array.isArray(previousQuestions)
                            ? previousQuestions
                            : []

                });


            // ==========================================
            // RESPONSE
            // ==========================================

            res.json({

                success: true,

                intervalMinutes:
                    settings.intervalMinutes,

                questionCount:
                    settings.questionCount,

                questions

            });


        } catch (error) {

            console.error(
                "AI CLASSROOM QUESTION ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to generate classroom questions"

            });

        }

    }
);

// =====================================================
// GENERATE QUESTIONS FOR ACTIVE PERIOD
// =====================================================

router.post(
    "/classroom/generate-period-questions",
    generatePeriodQuestions
);

// =====================================================
// GENERATE AI QUESTIONS FOR CURRENT PERIOD
// =====================================================

router.post(
    "/classroom/generate-period-questions",
    async (req, res) => {

        try {

            const {
                teacherId,
                periodId,
                transcript,
                previousQuestions = []
            } = req.body;


            // ==========================================
            // VALIDATE REQUIRED DATA
            // ==========================================

            if (!teacherId) {

                return res.status(400).json({

                    success: false,

                    message: "Teacher ID is required"

                });

            }


            if (!periodId) {

                return res.status(400).json({

                    success: false,

                    message: "Period ID is required"

                });

            }


            if (
                !transcript ||
                !transcript.trim()
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Teacher transcript is required"

                });

            }


            // ==========================================
            // GET AI SETTINGS
            // ==========================================

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


            // ==========================================
            // CHECK AI ENABLED
            // ==========================================

            if (!settings.enabled) {

                return res.json({

                    success: false,

                    enabled: false,

                    message:
                        "AI Classroom Questions are disabled"

                });

            }


            // ==========================================
            // GET PERIOD
            // ==========================================

            const PeriodAssignment =
                require("../models/PeriodAssignment");


            const period =
                await PeriodAssignment.findById(
                    periodId
                );


            if (!period) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Period assignment not found"

                });

            }


            // ==========================================
            // VERIFY TEACHER
            // ==========================================

            if (
                period.teacher &&
                String(period.teacher) !==
                String(teacherId)
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "Teacher is not assigned to this period"

                });

            }


            // ==========================================
            // GET CLASS + SUBJECT FROM PERIOD
            // ==========================================

            const className =
                period.className || "";

            const subject =
                period.subject || "";


            console.log(
                "AI PERIOD:",
                {
                    periodId,
                    teacherId,
                    className,
                    subject
                }
            );


            // ==========================================
            // GENERATE QUESTIONS
            // ==========================================

            const questions =
                await generateClassroomQuestions({

                    transcript,

                    className,

                    subject,

                    questionCount:
                        settings.questionCount,

                    previousQuestions:
                        Array.isArray(previousQuestions)
                            ? previousQuestions
                            : []

                });


            // ==========================================
            // SUCCESS RESPONSE
            // ==========================================

            return res.json({

                success: true,

                enabled: true,

                periodId,

                teacherId,

                className,

                subject,

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
                    "Failed to generate period questions",

                error:
                    error.message

            });

        }

    }
);

module.exports = router;