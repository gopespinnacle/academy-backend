const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


/*
========================================================
AI CLASSROOM QUESTION GENERATOR
========================================================

Input:
- Teacher's spoken transcript
- Class
- Subject
- Number of questions
- Previously generated questions

Output:
- Different interactive questions
*/


async function generateClassroomQuestions({

    transcript,
    className,
    subject,
    questionCount = 1,
    previousQuestions = []

}) {

    try {

        if (!transcript || !transcript.trim()) {

            throw new Error(
                "Teacher transcript is empty."
            );

        }


        const previousText =
            previousQuestions.length > 0
                ? previousQuestions.join("\n")
                : "None";


        const prompt = `

You are an expert CBSE classroom AI assistant.

Your job is to listen to a teacher's classroom explanation
and create interactive questions for the student.

CLASS:
${className}

SUBJECT:
${subject}

TEACHER'S SPOKEN EXPLANATION:
${transcript}


PREVIOUSLY GENERATED QUESTIONS:
${previousText}


IMPORTANT RULES:

1. Understand the concept taught by the teacher.

2. The teacher may speak in:
   - English
   - Tamil
   - Hindi
   - Mixed languages.

3. Understand the meaning even when languages are mixed.

4. Questions must be based ONLY on concepts actually explained
   by the teacher.

5. Do NOT require the teacher to upload any document.

6. The teacher may give many examples.

7. Do NOT simply repeat the teacher's examples.

8. Create NEW questions that test whether the student
   understood the concept.

9. Questions should be interactive and suitable for
   a live classroom.

10. Questions can include:
    - Concept questions
    - Application questions
    - Why questions
    - How questions
    - Situation-based questions
    - Simple competency-based questions
    - Maths problem-solving questions

11. For Mathematics:
    - Create a NEW numerical problem.
    - Do not simply copy numbers used by the teacher.
    - Test the same concept using different values.

12. For Science:
    - Use concept understanding.
    - Use real-life situations where appropriate.

13. Do not create questions from information
    that the teacher did not explain.

14. Do not repeat any previous question.

15. Keep the difficulty appropriate for the class.

16. Questions should be concise enough for a student
    to read during a live class.

17. Return ONLY valid JSON.

RETURN FORMAT:

{
    "questions": [
        {
            "question": "Question text",
            "type": "concept",
            "difficulty": "easy",
            "answer": "Expected answer"
        }
    ]
}

Generate exactly ${questionCount} question(s).

`;


        const response =
            await client.responses.create({

                model: "gpt-5-mini",

                input: prompt

            });


        const text =
            response.output_text.trim();


        /*
        Remove accidental markdown JSON fences
        */

        const cleanText =
            text
                .replace(/^```json\s*/i, "")
                .replace(/^```\s*/i, "")
                .replace(/\s*```$/i, "")
                .trim();


        const result =
            JSON.parse(cleanText);


        if (
            !result.questions ||
            !Array.isArray(result.questions)
        ) {

            throw new Error(
                "Invalid AI question response."
            );

        }


        return result.questions;


    } catch (error) {

        console.error(
            "AI Classroom Question Error:",
            error
        );

        throw error;

    }

}


module.exports = {

    generateClassroomQuestions

};