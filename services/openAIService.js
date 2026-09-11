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
    pdfPages,
    className,
    subject,
    chapter,
    questionLevel,
    totalMarks,
    duration,
    questionMode,
    questionTypes
}) {

    try {

        const pages = Array.isArray(pdfPages) && pdfPages.length > 0
    ? pdfPages
    : [pdfText];

const CHUNK_SIZE = 5;

const chunks = [];

for (let i = 0; i < pages.length; i += CHUNK_SIZE) {

    const pageChunk = pages.slice(
        i,
        i + CHUNK_SIZE
    );

    chunks.push({
        startPage: i + 1,
        endPage: Math.min(
            i + CHUNK_SIZE,
            pages.length
        ),
        text: pageChunk.join("\n\n")
    });

}

console.log(
    `PDF EXTRACTION: ${pages.length} pages received`
);

chunks.forEach((chunk, index) => {

    console.log(
        `PDF CHUNK ${index + 1}: Pages ${chunk.startPage}-${chunk.endPage}, Text Length: ${chunk.text.length}`
    );

    console.log(
        `PDF CHUNK ${index + 1} PREVIEW:`,
        chunk.text.substring(0, 300)
    );

});

        const prompt = `
You are an expert academic assessment designer for GOPES PINNACLE ACADEMY.

Your task is to analyse the uploaded educational document completely and generate a high-quality Question Bank.

====================================================
ACADEMIC CONFIGURATION
====================================================

Class: ${className}
Subject: ${subject}
Chapter: ${chapter}

Question Paper Level:
${questionLevel || "Medium"}

Total Marks Target:
${totalMarks || 25}

Duration: ${duration}

Question Mode:
${questionMode || "Direct + Indirect"}

Selected Question Types:
${Array.isArray(questionTypes) && questionTypes.length > 0
    ? questionTypes.join(", ")
    : "MCQ, Short Answer, Problem Solving"}

====================================================
PRIMARY OBJECTIVE — COMPLETE DOCUMENT COVERAGE
====================================================

The uploaded document is the PRIMARY and AUTHORITATIVE SOURCE.

You must study the COMPLETE uploaded document before generating questions.

DO NOT generate questions merely from the chapter title or from general knowledge.

Analyse the document sequentially from beginning to end.

Treat the document as a sequence of meaningful content units.

A content unit may be:

- A sentence
- A definition
- A fact
- A concept
- An explanation
- A rule
- A formula
- A worked example
- A solved example
- A process
- A step
- A table
- A labelled diagram
- A caption
- A comparison
- A classification
- A key statement
- An important observation
- A conclusion
- A learning point

====================================================
LINE-BY-LINE COVERAGE REQUIREMENT
====================================================

Your internal analysis must proceed sequentially through the document.

For EVERY meaningful line or content unit:

1. Identify what concept or information it teaches.
2. Determine whether it is assessable.
3. Record it as a coverage item internally.
4. Ensure that the information is represented by at least one suitable question whenever reasonably possible.
5. Avoid repeatedly generating questions from the same content while other meaningful content remains uncovered.

Do NOT stop after analysing only the first few pages.

Do NOT concentrate questions on the beginning of the document.

Continue analysing until the END of the uploaded document.

The generated Question Bank must provide broad and balanced coverage of the COMPLETE source material.

====================================================
NO CONTENT SKIPPING
====================================================

Do not intentionally skip:

- Definitions
- Important facts
- Examples
- Rules
- Formulas
- Explanations
- Steps
- Comparisons
- Tables
- Diagrams
- Special cases
- Key observations
- Important terminology
- Applications contained in the source

If a section contains meaningful assessable information, consider it for question generation.

====================================================
QUESTION PAPER LEVEL
====================================================

The selected level is:

${questionLevel || "Medium"}

Apply this difficulty consistently.

EASY:
- Basic recall
- Recognition
- Simple understanding
- Direct textbook-based questions
- Simple one-step applications

MEDIUM:
- Understanding
- Multi-step application
- Interpretation
- Comparison
- Moderate reasoning
- Familiar and moderately unfamiliar situations

HARD:
- Complex reasoning
- Multi-step problem solving
- Unfamiliar situations
- Deeper analysis
- Strong application
- Higher-order thinking

IMPORTANT:

Do not change the selected level randomly.

If the teacher selects Medium, the questions should predominantly be Medium difficulty.

====================================================
QUESTION MODE
====================================================

Selected mode:

${questionMode || "Direct + Indirect"}

====================================================
PUBLIC BOARD EXAM QUESTION-WRITING STANDARD
====================================================

Write every question as if it is appearing in a real
CBSE / public board examination question paper.

The student must understand the question independently.

The student must NOT need to know:

- the chapter name
- the textbook
- the uploaded document
- where the information was found

The uploaded document is ONLY the knowledge source.

It must NOT be referenced inside normal questions.

====================================================
STRICTLY FORBIDDEN QUESTION WORDING
====================================================

NEVER use phrases such as:

- "as per the chapter"
- "according to the chapter"
- "mentioned in the chapter"
- "given in the chapter"
- "provided in the chapter"
- "stated in the chapter"
- "discussed in the chapter"
- "described in the chapter"
- "shown in the chapter"
- "from the chapter"
- "from the textbook"
- "in this chapter"
- "in the lesson"
- "as taught in the chapter"
- "as explained in the chapter"
- "the example mentioned in the chapter"
- "the example given in the chapter"
- "the example provided in the chapter"
- "which example is mentioned"
- "which example is given"
- "which term is mentioned in the chapter"

Also avoid:

- "according to the passage"
- "mentioned above"
- "given above"
- "stated above"

unless the selected question type is specifically
Source-Based and the source passage is intentionally
presented as part of the question.

====================================================
IMPORTANT TRANSFORMATION RULE
====================================================

Use information from the document to CREATE questions.

Do NOT ask students to identify information merely because
it appeared in the document.

Convert textbook statements and examples into independent
academic questions.

Example:

BAD:

"Which term describes animals that eat only plants,
as per the chapter?"

GOOD:

"What term is used for animals that feed only on plants?"

----------------------------------------------------

BAD:

"Which is the parasite-host example mentioned in the chapter?"

GOOD:

"A tick feeds on the blood of a dog. What type of interaction
exists between the tick and the dog?"

----------------------------------------------------

BAD:

"Which food chain is provided in the chapter?"

GOOD:

"Consider the food chain:
Grass → Grasshopper → Frog → Snake → Eagle.
Identify the producer and the primary consumer."

----------------------------------------------------

BAD:

"What example of competition is given in the lesson?"

GOOD:

"How can competition for limited food resources affect
the population of organisms in an ecosystem?"

====================================================
BOARD EXAM INDEPENDENCE TEST
====================================================

Before returning each question, silently check:

"If the chapter title and source document are completely
removed, can a student still understand exactly what the
question is asking?"

If YES:

Keep the question.

If NO:

Rewrite the question.

====================================================
DIRECT QUESTIONS
====================================================

If the selected mode is Direct:

Ask directly about:

- definitions
- concepts
- facts
- processes
- classifications
- relationships
- causes and effects
- scientific principles
- important observations
- terminology
- examples converted into conceptual questions

Do NOT mention the source or chapter.

Example:

Instead of:

"Which term is mentioned in the chapter for organisms
that make their own food?"

Write:

"What term is used for organisms that make their own
food through photosynthesis?"

====================================================
INDIRECT QUESTIONS
====================================================

If the selected mode is Indirect:

Test the SAME SOURCE CONCEPT through:

- Application
- Reasoning
- Interpretation
- Comparison
- Problem solving
- Unfamiliar situations
- Real-life contexts
- Logical thinking
- Error analysis
- Justification

Do not introduce concepts outside the uploaded document
merely to make the question harder.

====================================================
DIRECT + INDIRECT
====================================================

If the selected mode is Direct + Indirect:

Create a balanced combination of:

- Direct conceptual questions
- Application questions
- Reasoning questions
- Competency-based questions
- Real-life situations
- Interpretation questions

All questions must independently make sense to the student.

====================================================

====================================================
QUESTION TYPE CONTROL
====================================================

The teacher selected these question types:

${Array.isArray(questionTypes) && questionTypes.length > 0
    ? questionTypes.join(", ")
    : "MCQ, Short Answer, Problem Solving"}

ONLY use the selected question types.

Do NOT introduce other question types unless absolutely necessary to represent source content.

Question types may include:

MCQ
Fill in the Blanks
True / False
Match the Following
One Word Answer
Very Short Answer
Short Answer
Long Answer
Problem Solving
Word Problems
Case Study
Competency-Based
Assertion & Reason
Statement-Based
Reasoning / Logical Thinking
Odd One Out
Pattern-Based
Sequence Questions
Data Interpretation
Diagram-Based
Error Identification
Correct the Solution
Compare & Explain
Justify Your Answer
Prove / Show That
Construction-Based
Practical / Application-Based
Open-Ended
HOTS

====================================================
QUESTION QUALITY
====================================================

Every question must:

- Be academically meaningful.
- Be answerable from the uploaded source material or by applying concepts taught in it.
- Use the uploaded document as the knowledge foundation.
- NEVER mention the uploaded document in the question.
- NEVER refer to "the chapter", "the lesson", "the textbook",
  or "the source" in a normal question.
- Convert textbook examples into independent examination questions.
- Convert source statements into conceptual, application,
  reasoning, or competency-based questions.
- Be independently understandable without the chapter title.
- Match the selected class level.
- Match the selected difficulty.
- Match one of the selected question types.
- Match the selected question mode.
- Avoid ambiguity.
- Avoid duplicate concepts wherever possible.
- Have one clear expected answer where applicable.

For MCQs:

- Provide exactly four options.
- Only one option should be correct.
- Store the options separately in the "options" array.
- Do not put the options only inside the question text.

For questions requiring explanation:

- Provide a suitable model answer.
- Include enough detail for teacher evaluation.

====================================================
MARKS — STRICT QUESTION BANK RULE
====================================================

The Question Bank must use ONLY these individual mark values:

1 mark
2 marks
5 marks

NEVER assign 3 marks.

NEVER assign 4 marks.

NEVER assign 6 or more marks to a single question.

Every question MUST have marks equal to exactly:

1, 2, or 5.

Use the following rules:

1 MARK:
- MCQ
- Fill in the Blanks
- True / False
- One Word Answer
- Very Short Answer

2 MARKS:
- Short Answer
- Basic Reasoning
- Simple Application
- Compare / Explain

5 MARKS:
- Long Answer
- Case Study
- Competency-Based
- HOTS
- Detailed Reasoning
- Complex Application
- Diagram-Based where appropriate

The Question Bank is NOT limited to the selected total marks.

The Question Bank must be LARGE ENOUGH to support future paper generation.

IMPORTANT QUESTION QUANTITY REQUIREMENT:

Generate AT LEAST 50 questions in the complete Question Bank whenever the uploaded source contains sufficient assessable content.

The Question Bank should contain a balanced supply of:

- At least 15 questions worth 1 mark each.
- At least 15 questions worth 2 marks each.
- At least 10 questions worth 5 marks each.

Use the remaining questions to improve complete document coverage.

This gives the paper generator enough material to create:

25-mark papers
50-mark papers
80-mark papers
100-mark papers

The 100-mark paper generator must be able to select an exact combination from the Question Bank.

IMPORTANT:

The Question Bank itself is NOT a 100-mark paper.

It is a QUESTION POOL from which different papers will later be generated.

Therefore, DO NOT stop generating questions when their combined marks reach the selected totalMarks.

For example, if totalMarks is 25, you must STILL generate a large Question Bank.

Do NOT generate only 25 marks worth of questions.

====================================================
STRICT MARK VALIDATION
====================================================

Every generated question MUST have exactly one of these mark values:

1
2
5

NEVER generate:

3 marks
4 marks
6 marks
7 marks
8 marks
9 marks
10 marks
or any other mark value.

Before returning the final JSON, internally verify every question.

For every question:

question.marks === 1
OR
question.marks === 2
OR
question.marks === 5

If any question has another mark value, correct it before returning the JSON.

====================================================
100-MARK PAPER READINESS CHECK
====================================================

Before returning the Question Bank, internally calculate the total possible marks available from all generated questions.

The Question Bank should contain enough valid questions to provide AT LEAST 100 total available marks.

If the generated Question Bank has less than 100 total available marks, continue generating additional questions from uncovered source content until sufficient questions are available, provided the source contains enough assessable content.

The final Question Paper will later select questions from this pool to meet the exact requested total marks.

====================================================
ANTI-DUPLICATION
====================================================

Do not generate several questions that test exactly the same information in nearly identical wording.

However, the same concept may be tested differently when necessary:

- Direct question
- Indirect question
- Application
- Reasoning
- Problem solving

This is acceptable only when it improves assessment coverage.

====================================================
ACADEMIC INTEGRITY
====================================================

Use the uploaded document as the source.

Do not invent textbook facts.

Do not introduce unrelated topics.

Do not assume information that is absent from the source.

For indirect questions, transform and apply concepts that are actually taught in the document.

====================================================
INTERNAL COVERAGE CHECK
====================================================

Before producing the final JSON, internally verify:

1. Did you analyse the document from beginning to end?
2. Did you cover the major content from every section?
3. Did you avoid concentrating questions on only the first part?
4. Did you include important definitions, facts, rules, examples and explanations?
5. Did you use ONLY the selected question types?
6. Did you follow the selected difficulty?
7. Did you follow the selected question mode?
8. Did you avoid unnecessary duplicates?
9. Are the answers correct according to the source?
10. Does each question have an appropriate mark value?

====================================================
OUTPUT FORMAT
====================================================

Return ONLY valid JSON.

Do not use Markdown.

Do not add explanations outside the JSON.

Format:

{
  "questions": [
    {
      "type": "MCQ",
      "question": "Question text",
      "answer": "Correct answer",
      "marks": 1,
      "difficulty": "Medium",
      "bloomLevel": "Understand",
      "chapterTopic": "Specific topic from source",
      "keywords": ["keyword1", "keyword2"],
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "explanation": "Explanation of the answer."
    }
  ]
}

For question types that do not require options, return:

"options": []

For questions without an explanation, return a concise explanation where useful.

IMPORTANT:

Return ONLY the JSON object.
`;

        const allQuestions = [];

for (let i = 0; i < chunks.length; i++) {

    console.log(
    `AI QUESTION GENERATION: ${chunks.length} chunks detected`
);

    const chunk = chunks[i];

    const previousQuestions =
        allQuestions.map(q => q.question);

    const previousQuestionsText =
        previousQuestions.length > 0
            ? previousQuestions
                .slice(-50)
                .map((q, index) =>
                    `${index + 1}. ${q}`
                )
                .join("\n")
            : "No previous questions. This is the first chunk.";

    const chunkPrompt = `
${prompt}

====================================================
DOCUMENT COVERAGE CHUNK
====================================================

You are currently analysing:

Pages ${chunk.startPage} to ${chunk.endPage}
of ${pages.length} total pages.

THIS IS CHUNK ${i + 1} OF ${chunks.length}.

Analyse ONLY the source content supplied below for this chunk.

You must:

1. Read the entire chunk.
2. Identify all meaningful assessable content.
3. Generate questions covering the important content in this chunk.
4. Do not focus only on the beginning of this chunk.
5. Avoid repeating questions already likely to be covered in other chunks.
6. Follow all academic configuration rules above.
7. Use ONLY the selected question types.
8. Do not invent information outside this source content.

====================================================
PREVIOUSLY GENERATED QUESTIONS
====================================================

The following questions were already generated from
earlier document chunks.

Do NOT generate a substantially similar question
unless the new question tests a genuinely different
aspect of the source content.

Previously generated questions:

${previousQuestionsText}

====================================================

SOURCE CONTENT:

${chunk.text}

====================================================
END OF DOCUMENT COVERAGE CHUNK
====================================================
`;

    const response =
        await client.responses.create({

            model: "gpt-5-mini",

            input: chunkPrompt

        });

        console.log(
    `AI CHUNK ${i + 1}/${chunks.length} RESPONSE RECEIVED`
);

console.log(
    `AI CHUNK ${i + 1} OUTPUT LENGTH:`,
    response.output_text
        ? response.output_text.length
        : 0
);

    const chunkOutput =
        response.output_text;

    try {

        const parsedChunk =
            JSON.parse(chunkOutput);

        if (
    parsedChunk &&
    Array.isArray(parsedChunk.questions)
) {

    console.log(
        `AI CHUNK ${i + 1}: ${parsedChunk.questions.length} questions generated`
    );

    allQuestions.push(
        ...parsedChunk.questions
    );

}

    } catch (err) {

    console.error(
        `Invalid AI JSON for chunk ${i + 1}:`,
        err
    );

    console.error(
        `AI OUTPUT FOR CHUNK ${i + 1}:`,
        chunkOutput
    );

    throw new Error(
        `AI returned invalid JSON for document chunk ${i + 1} (Pages ${chunk.startPage}-${chunk.endPage}).`
    );

}

}

console.log(
    `AI GENERATION COMPLETE: ${allQuestions.length} total questions`
);

return JSON.stringify({
    questions: allQuestions
});

    } catch (err) {

        console.error(err);

        throw err;

    }

}

module.exports = {

    testOpenAI,

    generateQuestionBank

};