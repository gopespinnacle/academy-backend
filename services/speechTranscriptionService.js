const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


/*
==========================================================
TEACHER SPEECH → TEXT
==========================================================
*/

async function transcribeTeacherAudio(audioFile) {

    try {

        if (!audioFile) {
            throw new Error("Audio file is required.");
        }


        console.log(
            "AI TRANSCRIPTION: Processing teacher audio..."
        );


        const transcription =
            await client.audio.transcriptions.create({

                file: audioFile,

                model: "gpt-4o-transcribe",

                response_format: "text"

            });


        console.log(
            "AI TRANSCRIPTION: Completed."
        );


        return transcription;

    } catch (error) {

        console.error(
            "AI TRANSCRIPTION ERROR:",
            error
        );

        throw error;

    }

}


module.exports = {
    transcribeTeacherAudio
};