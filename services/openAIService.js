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

module.exports = {

    testOpenAI

};