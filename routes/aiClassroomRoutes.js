const express = require("express");

const router = express.Router();

const AIClassSettings =
    require("../models/AIClassSettings");


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


module.exports = router;