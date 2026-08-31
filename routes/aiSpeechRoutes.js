const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
    transcribeTeacherAudio
} = require("../services/speechTranscriptionService");


/*
==========================================================
MULTER
==========================================================
*/

const upload = multer({
    storage: multer.memoryStorage()
});


/*
==========================================================
TEACHER AUDIO → TRANSCRIPTION
==========================================================
*/

router.post(
    "/transcribe-teacher-audio",
    upload.single("audio"),
    async (req, res) => {

        try {

            /*
            ------------------------------------------------
            CHECK AUDIO
            ------------------------------------------------
            */

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message: "Teacher audio file is required."

                });

            }


            console.log(
                "AI AUDIO RECEIVED:",
                req.file.originalname,
                req.file.mimetype,
                req.file.size
            );


            /*
            ------------------------------------------------
            CREATE FILE OBJECT FOR OPENAI
            ------------------------------------------------
            */

            const audioFile = new File(
                [
                    req.file.buffer
                ],
                req.file.originalname || "teacher-audio.webm",
                {
                    type:
                        req.file.mimetype ||
                        "audio/webm"
                }
            );


            /*
            ------------------------------------------------
            TRANSCRIBE
            ------------------------------------------------
            */

            const transcript =
                await transcribeTeacherAudio(
                    audioFile
                );


            /*
            ------------------------------------------------
            RESPONSE
            ------------------------------------------------
            */

            return res.json({

                success: true,

                transcript: transcript

            });

        }

        catch (error) {

            console.error(
                "TEACHER AUDIO TRANSCRIPTION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to transcribe teacher audio.",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;