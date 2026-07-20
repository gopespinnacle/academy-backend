const OpenAI = require("openai");

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
    try {

        const response = await client.responses.create({

            model: "gpt-5-mini",

            input: "Reply only with: OpenAI Connection Successful"

        });

        return response.output_text;

    } catch (err) {

        console.error("OpenAI Error:", err);

        throw err;

    }
}

async function generateQuestionBank({
    pdfText,
    className,
    subject,
    chapter
}) {

    try {

        const prompt = `
You are an expert CBSE assessment designer.

Class: ${className}
Subject: ${subject}
Chapter: ${chapter}

Study the complete chapter below and generate a structured JSON object.

Chapter Content:
${pdfText}

Return ONLY valid JSON.

Format:

{
  "questions":[
    {
      "type":"Fill in the Blanks",
      "question":"",
      "answer":"",
      "marks":1,
      "difficulty":"Easy",
      "bloomLevel":"Remember"
    }
  ]
}

Rules:

- Cover the entire chapter.
- No duplicate questions.
- Use indirect competency-based questions wherever possible.
- Include easy, medium and hard questions.
- Return JSON only.
`;

        const response = await client.responses.create({

            model: "gpt-5-mini",

            input: prompt

        });

        return response.output_text;

    } catch (err) {

        console.error(err);

        throw err;

    }

}

module.exports = {

    testOpenAI,

    generateQuestionBank

};