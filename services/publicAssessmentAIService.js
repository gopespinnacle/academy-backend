/**
 * Gopes Pinnacle Academy
 *
 * PUBLIC ASSESSMENT AI SERVICE
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * This is a NEW isolated AI service.
 *
 * DO NOT MODIFY:
 *     openAIService.js
 *
 * This service is used ONLY for the public "Your Child
 * Assessment" feature.
 *
 * HARD QUESTION RULES:
 * ------------------------------------------------------------
 * 1. CBSE + NCERT controlled
 * 2. Selected chapters only
 * 3. Selected concepts only
 * 4. Indirect questions
 * 5. Medium-to-hard difficulty
 * 6. Competency/application based
 * 7. Reasoning required
 * 8. No simple textbook recall
 * 9. No random/out-of-syllabus questions
 * 10. MCQ + Case Study only
 * 11. Case studies must require application/reasoning
 * 12. Questions must be suitable for public-board level
 *
 * Parent-facing pages must NEVER mention AI.
 */

const OpenAI = require("openai");

const PublicAssessment = require("../models/PublicAssessment");


/* ============================================================
   OPENAI CLIENT
============================================================ */

/*
 * Uses the existing OPENAI_API_KEY environment variable.
 *
 * This does NOT use openAIService.js.
 */
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});


/* ============================================================
   CONFIGURATION
============================================================ */

const AI_MODEL =
    process.env.PUBLIC_ASSESSMENT_AI_MODEL ||
    "gpt-5.6-luna";


/*
 * Maximum retry attempts when the generated question set
 * violates one of our hard constraints.
 */
const MAX_GENERATION_ATTEMPTS = 3;


/* ============================================================
   HARD QUESTION GENERATION RULES
============================================================ */

/*
 * This is intentionally written as a strict specification.
 *
 * The AI must follow these rules when generating questions.
 */
const HARD_QUESTION_RULES = `

============================================================
GOPES PINNACLE ACADEMY
PUBLIC ASSESSMENT QUESTION STANDARD
============================================================

You are generating an academic diagnostic assessment for
school students.

The assessment is based on:

BOARD:
CBSE

CURRICULUM:
NCERT

LEVEL:
Public Board Examination Level

------------------------------------------------------------
ABSOLUTE QUESTION RULES
------------------------------------------------------------

RULE 1 — INDIRECT QUESTIONS
------------------------------------------------------------

Questions MUST be indirect.

Do NOT simply ask the student to reproduce a definition,
fact, sentence, list or textbook statement.

AVOID:

"What is pressure?"

"Define pressure."

"What is photosynthesis?"

"Name the parts of a cell."

"State the law of reflection."

Instead, create a situation in which the student must use
the concept.

Example style:

"A student presses a drawing pin against a wooden surface.
The same force is applied first through the pointed end and
then through the flat head. Which observation is expected
and what explains the difference?"

The student must identify and apply the underlying concept.

------------------------------------------------------------
RULE 2 — MEDIUM TO HARD
------------------------------------------------------------

Questions MUST be MEDIUM or HARD.

Target distribution:

Approximately:
60–70% MEDIUM
30–40% HARD

Do NOT generate easy recall questions.

Hardness must come from:

- application
- reasoning
- interpretation
- comparison
- multi-step thinking
- identifying cause and effect
- analysing a situation
- applying a concept to an unfamiliar context
- interpreting observations
- analysing data when appropriate

Hardness must NOT come from:

- confusing language
- unnecessarily long sentences
- obscure vocabulary
- tricks unrelated to the curriculum
- ambiguous wording
- information outside NCERT

------------------------------------------------------------
RULE 3 — COMPETENCY BASED
------------------------------------------------------------

Questions MUST test whether the student can USE knowledge.

Prefer:

APPLICATION
REASONING
ANALYSIS
INTERPRETATION
PROBLEM SOLVING
CAUSE AND EFFECT
COMPARISON
PREDICTION
CONCLUSION

Do not make the assessment primarily a memory test.

------------------------------------------------------------
RULE 4 — NCERT CONTROL
------------------------------------------------------------

Every question MUST be supported by the supplied
curriculum/chapter/concept information.

Do NOT introduce:

- unrelated chapters
- university-level knowledge
- advanced terminology
- facts outside the stated curriculum
- concepts not represented in the selected chapters

If a situation is unfamiliar, the underlying science/concept
must still come from the selected NCERT curriculum.

------------------------------------------------------------
RULE 5 — SELECTED CHAPTER CONTROL
------------------------------------------------------------

Every question MUST map to:

1. Selected chapter
2. Selected concept/topic
3. Appropriate competency

Do not generate questions from chapters that the student
did not select.

------------------------------------------------------------
RULE 6 — NO DUPLICATE THINKING
------------------------------------------------------------

Questions must not simply repeat the same question using
different words.

Different questions should test different concepts,
applications or reasoning paths whenever the selected
curriculum permits.

------------------------------------------------------------
RULE 7 — MCQ OPTIONS
------------------------------------------------------------

Each MCQ must contain:

A
B
C
D

Exactly ONE clearly correct answer.

Wrong options must be plausible.

Wrong options should preferably represent realistic
student misconceptions.

Do NOT create:

- two correct options
- two nearly identical options
- obviously silly distractors
- grammatical clues
- length clues
- "all of the above" unless genuinely required
- "none of the above" unless genuinely required

The correct answer must NOT always appear in the same
option position.

------------------------------------------------------------
RULE 8 — MCQ ANSWERABILITY
------------------------------------------------------------

A student who understands the concept should be able to
determine the correct answer.

Do not depend on:

- guessing
- hidden assumptions
- obscure facts
- information not supplied by the curriculum
- ambiguous interpretation

------------------------------------------------------------
RULE 9 — CASE STUDY STANDARD
------------------------------------------------------------

Case Studies MUST be indirect.

A case study should present a meaningful situation such as:

- experiment
- classroom observation
- daily-life situation
- scientific investigation
- environmental situation
- data interpretation
- practical problem
- comparison
- real-world application

The student should have to understand the situation and
apply the selected concepts.

------------------------------------------------------------
RULE 10 — CASE STUDY MULTI-STEP THINKING
------------------------------------------------------------

A Case Study should preferably contain multiple connected
subquestions.

The subquestions should not all ask the same thing.

A good case study can move through:

Observation
    ↓
Concept identification
    ↓
Reasoning
    ↓
Application
    ↓
Conclusion

------------------------------------------------------------
RULE 11 — CASE STUDY MUST NOT BE A DIRECT PARAGRAPH TEST
------------------------------------------------------------

Do NOT write a paragraph and then ask simple questions
whose answers are copied directly from the paragraph.

The case information should require interpretation.

------------------------------------------------------------
RULE 12 — QUESTION DIFFICULTY
------------------------------------------------------------

Each question MUST have:

difficulty:
"MEDIUM"

or:

difficulty:
"HARD"

Do NOT use EASY.

------------------------------------------------------------
RULE 13 — COMPETENCY
------------------------------------------------------------

Each question must identify the main competency.

Allowed competencies include:

APPLICATION
REASONING
ANALYSIS
INTERPRETATION
PROBLEM_SOLVING
CAUSE_EFFECT
COMPARISON
PREDICTION
CONCLUSION

------------------------------------------------------------
RULE 14 — INDIRECTNESS CHECK
------------------------------------------------------------

Before accepting every question, silently ask:

"Could a student answer this correctly simply by memorising
a one-line textbook definition?"

If YES:

REJECT THE QUESTION.

Generate a better question requiring application,
reasoning or interpretation.

------------------------------------------------------------
RULE 15 — EASY QUESTION REJECTION
------------------------------------------------------------

Reject questions that are primarily:

- definition recall
- direct naming
- direct listing
- direct textbook statement
- simple fact recall
- obvious recognition

------------------------------------------------------------
RULE 16 — AMBIGUITY REJECTION
------------------------------------------------------------

Reject any question where:

- more than one answer could reasonably be correct
- the correct answer depends on an unstated assumption
- wording can reasonably be interpreted in two ways
- marks cannot be assigned objectively

------------------------------------------------------------
RULE 17 — CASE STUDY ANSWERS
------------------------------------------------------------

Every Case Study must include an internal model answer.

The model answer must explain the reasoning expected from
a student.

Do not give an unnecessarily long university-level answer.

------------------------------------------------------------
RULE 18 — EXPLANATIONS
------------------------------------------------------------

Every MCQ must have an explanation explaining WHY the
correct answer is correct.

The explanation should focus on the underlying concept.

------------------------------------------------------------
RULE 19 — BOARD EXAM STANDARD
------------------------------------------------------------

Questions should resemble the THINKING DEMAND of strong
CBSE/public-board examination questions.

Do not copy actual examination questions.

Generate ORIGINAL questions.

------------------------------------------------------------
RULE 20 — NO AI DISCLOSURE
------------------------------------------------------------

The generated assessment must not tell the parent or student
that AI generated the questions.

------------------------------------------------------------
FINAL QUALITY GATE
------------------------------------------------------------

Before returning the final JSON, verify internally:

[ ] Every question is from selected curriculum
[ ] Every question maps to a selected chapter
[ ] Every question maps to a concept
[ ] No EASY questions
[ ] Questions are indirect
[ ] Questions require thinking
[ ] Questions are medium or hard
[ ] MCQs have exactly four options
[ ] MCQs have exactly one correct answer
[ ] Distractors are plausible
[ ] No duplicate questions
[ ] Case studies are application based
[ ] Case studies require reasoning
[ ] Case studies contain meaningful subquestions
[ ] No out-of-syllabus information
[ ] Model answers are present
[ ] Marks are present
[ ] Competency is identified

If ANY requirement fails:

REGENERATE THAT QUESTION before returning the response.

============================================================
END OF HARD QUESTION STANDARD
============================================================
`;


/* ============================================================
   CURRICULUM CONTEXT BUILDER
============================================================ */

/**
 * Converts curriculum records into a controlled prompt
 * context.
 */
function buildCurriculumContext(assessment) {

    const selectedChapters =
        assessment.selectedChapters || [];


    if (!selectedChapters.length) {

        throw new Error(
            "No selected chapters are available for AI generation."
        );
    }


    return selectedChapters
        .map((chapter, index) => {

            const concepts =
                chapter.concepts ||
                chapter.topics ||
                [];


            let conceptText = "";


            if (Array.isArray(concepts)) {

                conceptText = concepts
                    .map(concept => {

                        if (
                            typeof concept === "string"
                        ) {
                            return concept;
                        }

                        if (
                            concept &&
                            typeof concept === "object"
                        ) {

                            return [
                                concept.name,
                                ...(Array.isArray(concept.topics)
                                    ? concept.topics
                                    : [])
                            ]
                                .filter(Boolean)
                                .join(" → ");
                        }

                        return "";
                    })
                    .filter(Boolean)
                    .join("; ");
            }


            return `
CHAPTER ${index + 1}

Chapter Number:
${chapter.chapterNumber || "Not specified"}

Chapter Name:
${chapter.chapterName || "Not specified"}

Split-Up:
${chapter.splitUp || "Not specified"}

Concepts:
${conceptText || "Use only the concepts represented by this selected chapter."}
`;
        })
        .join("\n");
}


/* ============================================================
   QUESTION COUNTS
============================================================ */

function normalizeQuestionCounts({
    mcqCount = 20,
    caseStudyCount = 2
}) {

    const mcq =
        Math.max(
            1,
            Math.min(
                100,
                Number(mcqCount) || 20
            )
        );


    const caseStudies =
        Math.max(
            1,
            Math.min(
                20,
                Number(caseStudyCount) || 2
            )
        );


    return {
        mcq,
        caseStudies
    };
}


/* ============================================================
   AI PROMPT
============================================================ */

function buildGenerationPrompt({
    assessment,
    mcqCount,
    caseStudyCount
}) {

    const curriculumContext =
        buildCurriculumContext(assessment);


    return `
You are the internal academic question-generation system
for Gopes Pinnacle Academy.

Generate an ORIGINAL diagnostic assessment.

IMPORTANT:
The student and parent must never be told that AI was used.

============================================================
ASSESSMENT INFORMATION
============================================================

Board:
${assessment.board || "CBSE"}

Curriculum:
${assessment.curriculum || "NCERT"}

Academic Year:
${assessment.academicYear || "2026-27"}

Grade:
${assessment.grade}

Subject:
${assessment.subject}

Selected Split-Ups:
${(assessment.splitUps || []).join(", ")}

Selected Chapters:
${curriculumContext}

============================================================
REQUIRED QUESTION COUNTS
============================================================

MCQs:
${mcqCount}

Case Studies:
${caseStudyCount}

============================================================
QUESTION QUALITY
============================================================

${HARD_QUESTION_RULES}

============================================================
IMPORTANT GENERATION INSTRUCTION
============================================================

Do not generate the easiest possible questions.

Generate questions that make a capable student THINK.

The assessment is intended to identify:

- conceptual gaps
- application gaps
- reasoning gaps
- misconception patterns
- weak understanding of selected concepts

Therefore, avoid direct textbook recall.

Use unfamiliar but age-appropriate situations.

The student should recognize the underlying NCERT concept
only after analysing the situation.

============================================================
OUTPUT
============================================================

Return ONLY valid JSON.

Do not include markdown.

Do not include commentary before or after the JSON.

The JSON must follow the exact structure supplied by the
system.
`;
}


/* ============================================================
   JSON SCHEMA
============================================================ */

/*
 * The schema makes the expected output explicit.
 *
 * The application still performs additional validation below.
 */
const ASSESSMENT_SCHEMA = {

    type: "object",

    additionalProperties: false,

    properties: {

        questions: {

            type: "array",

            items: {

                type: "object",

                additionalProperties: false,

                properties: {

                    questionId: {
                        type: "string"
                    },

                    number: {
                        type: "integer"
                    },

                    type: {
                        type: "string",
                        enum: [
                            "MCQ"
                        ]
                    },

                    question: {
                        type: "string"
                    },

                    options: {

                        type: "object",

                        additionalProperties: false,

                        properties: {

                            A: {
                                type: "string"
                            },

                            B: {
                                type: "string"
                            },

                            C: {
                                type: "string"
                            },

                            D: {
                                type: "string"
                            }

                        },

                        required: [
                            "A",
                            "B",
                            "C",
                            "D"
                        ]
                    },

                    correctAnswer: {
                        type: "string",
                        enum: [
                            "A",
                            "B",
                            "C",
                            "D"
                        ]
                    },

                    modelAnswer: {
                        type: "string"
                    },

                    curriculumId: {
                        type: "string"
                    },

                    chapterNumber: {
                        type: "string"
                    },

                    chapterName: {
                        type: "string"
                    },

                    concept: {
                        type: "string"
                    },

                    topic: {
                        type: "string"
                    },

                    subtopic: {
                        type: "string"
                    },

                    difficulty: {
                        type: "string",
                        enum: [
                            "MEDIUM",
                            "HARD"
                        ]
                    },

                    competency: {
                        type: "string",
                        enum: [
                            "APPLICATION",
                            "REASONING",
                            "ANALYSIS",
                            "INTERPRETATION",
                            "PROBLEM_SOLVING",
                            "CAUSE_EFFECT",
                            "COMPARISON",
                            "PREDICTION",
                            "CONCLUSION"
                        ]
                    },

                    marks: {
                        type: "number"
                    },

                    explanation: {
                        type: "string"
                    }

                },

                required: [
                    "questionId",
                    "number",
                    "type",
                    "question",
                    "options",
                    "correctAnswer",
                    "modelAnswer",
                    "curriculumId",
                    "chapterNumber",
                    "chapterName",
                    "concept",
                    "topic",
                    "subtopic",
                    "difficulty",
                    "competency",
                    "marks",
                    "explanation"
                ]
            }
        },

        caseStudies: {

            type: "array",

            items: {

                type: "object",

                additionalProperties: false,

                properties: {

                    caseStudyId: {
                        type: "string"
                    },

                    title: {
                        type: "string"
                    },

                    scenario: {
                        type: "string"
                    },

                    curriculumId: {
                        type: "string"
                    },

                    chapterNumber: {
                        type: "string"
                    },

                    chapterName: {
                        type: "string"
                    },

                    concept: {
                        type: "string"
                    },

                    difficulty: {
                        type: "string",
                        enum: [
                            "MEDIUM",
                            "HARD"
                        ]
                    },

                    competency: {
                        type: "string",
                        enum: [
                            "APPLICATION",
                            "REASONING",
                            "ANALYSIS",
                            "INTERPRETATION",
                            "PROBLEM_SOLVING",
                            "CAUSE_EFFECT",
                            "COMPARISON",
                            "PREDICTION",
                            "CONCLUSION"
                        ]
                    },

                    questions: {

                        type: "array",

                        items: {

                            type: "object",

                            additionalProperties: false,

                            properties: {

                                questionId: {
                                    type: "string"
                                },

                                questionNumber: {
                                    type: "integer"
                                },

                                question: {
                                    type: "string"
                                },

                                modelAnswer: {
                                    type: "string"
                                },

                                marks: {
                                    type: "number"
                                },

                                competency: {
                                    type: "string",
                                    enum: [
                                        "APPLICATION",
                                        "REASONING",
                                        "ANALYSIS",
                                        "INTERPRETATION",
                                        "PROBLEM_SOLVING",
                                        "CAUSE_EFFECT",
                                        "COMPARISON",
                                        "PREDICTION",
                                        "CONCLUSION"
                                    ]
                                }

                            },

                            required: [
                                "questionId",
                                "questionNumber",
                                "question",
                                "modelAnswer",
                                "marks",
                                "competency"
                            ]
                        }
                    },

                    totalMarks: {
                        type: "number"
                    }

                },

                required: [
                    "caseStudyId",
                    "title",
                    "scenario",
                    "curriculumId",
                    "chapterNumber",
                    "chapterName",
                    "concept",
                    "difficulty",
                    "competency",
                    "questions",
                    "totalMarks"
                ]
            }
        }

    },

    required: [
        "questions",
        "caseStudies"
    ]
};


/* ============================================================
   RESPONSE EXTRACTION
============================================================ */

function extractResponseText(response) {

    if (!response) {
        return "";
    }


    /*
     * Current Responses API convenience output.
     */
    if (
        typeof response.output_text === "string" &&
        response.output_text.trim()
    ) {

        return response.output_text.trim();
    }


    /*
     * Fallback parser.
     */
    if (Array.isArray(response.output)) {

        const textParts = [];

        for (const outputItem of response.output) {

            if (!Array.isArray(outputItem.content)) {
                continue;
            }

            for (const contentItem of outputItem.content) {

                if (
                    contentItem &&
                    typeof contentItem.text === "string"
                ) {

                    textParts.push(
                        contentItem.text
                    );
                }
            }
        }

        return textParts.join("\n").trim();
    }


    return "";
}


/* ============================================================
   JSON PARSER
============================================================ */

function parseJSONResponse(text) {

    if (!text) {

        throw new Error(
            "AI returned an empty response."
        );
    }


    /*
     * First attempt:
     * response should already be JSON.
     */
    try {

        return JSON.parse(text);

    } catch (error) {

        /*
         * Second attempt:
         * remove accidental markdown code fences.
         */
        const cleaned = text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();


        try {

            return JSON.parse(cleaned);

        } catch (secondError) {

            throw new Error(
                "AI returned invalid JSON."
            );
        }
    }
}


/* ============================================================
   BASIC QUESTION QUALITY VALIDATION
============================================================ */

/**
 * These checks are deliberately conservative.
 *
 * They do NOT attempt to understand the entire academic
 * quality of a question programmatically.
 *
 * They catch obvious violations before storing questions.
 */
function validateGeneratedQuestions(
    questions,
    expectedCount
) {

    if (!Array.isArray(questions)) {

        throw new Error(
            "AI did not return a valid question array."
        );
    }


    if (questions.length !== expectedCount) {

        throw new Error(
            `Expected ${expectedCount} MCQs but received ${questions.length}.`
        );
    }


    const ids = new Set();


    for (const question of questions) {

        if (!question.questionId) {
            throw new Error(
                "MCQ questionId is missing."
            );
        }


        if (ids.has(question.questionId)) {

            throw new Error(
                `Duplicate question ID: ${question.questionId}`
            );
        }

        ids.add(question.questionId);


        /*
         * Hard difficulty rule.
         */
        if (
            !["MEDIUM", "HARD"].includes(
                question.difficulty
            )
        ) {

            throw new Error(
                `Invalid difficulty for ${question.questionId}.`
            );
        }


        /*
         * Exactly four options.
         */
        if (
            !question.options ||
            typeof question.options !== "object"
        ) {

            throw new Error(
                `Missing options for ${question.questionId}.`
            );
        }


        const optionKeys =
            Object.keys(question.options).sort();


        const expectedKeys = [
            "A",
            "B",
            "C",
            "D"
        ];


        if (
            optionKeys.length !== 4 ||
            optionKeys.some(
                (key, index) =>
                    key !== expectedKeys[index]
            )
        ) {

            throw new Error(
                `MCQ ${question.questionId} must have exactly A, B, C and D options.`
            );
        }


        /*
         * Exactly one correct option.
         */
        if (
            !["A", "B", "C", "D"].includes(
                question.correctAnswer
            )
        ) {

            throw new Error(
                `Invalid correct answer for ${question.questionId}.`
            );
        }


        /*
         * Question must contain meaningful text.
         */
        if (
            typeof question.question !== "string" ||
            question.question.trim().length < 20
        ) {

            throw new Error(
                `Question ${question.questionId} is too short or invalid.`
            );
        }


        /*
         * Curriculum mapping is mandatory.
         */
        if (
            !question.curriculumId ||
            !question.chapterName ||
            !question.concept
        ) {

            throw new Error(
                `Question ${question.questionId} has incomplete curriculum mapping.`
            );
        }


        /*
         * Explanation is mandatory.
         */
        if (
            !question.explanation ||
            String(question.explanation).trim().length < 10
        ) {

            throw new Error(
                `Question ${question.questionId} is missing a proper explanation.`
            );
        }
    }


    return true;
}


/* ============================================================
   CASE STUDY VALIDATION
============================================================ */

function validateGeneratedCaseStudies(
    caseStudies,
    expectedCount
) {

    if (!Array.isArray(caseStudies)) {

        throw new Error(
            "AI did not return valid case studies."
        );
    }


    if (caseStudies.length !== expectedCount) {

        throw new Error(
            `Expected ${expectedCount} case studies but received ${caseStudies.length}.`
        );
    }


    const caseStudyIds = new Set();


    for (const caseStudy of caseStudies) {

        if (!caseStudy.caseStudyId) {

            throw new Error(
                "Case study ID is missing."
            );
        }


        if (
            caseStudyIds.has(
                caseStudy.caseStudyId
            )
        ) {

            throw new Error(
                `Duplicate case study ID: ${caseStudy.caseStudyId}`
            );
        }


        caseStudyIds.add(
            caseStudy.caseStudyId
        );


        if (
            !["MEDIUM", "HARD"].includes(
                caseStudy.difficulty
            )
        ) {

            throw new Error(
                `Invalid case study difficulty: ${caseStudy.caseStudyId}`
            );
        }


        if (
            !caseStudy.scenario ||
            String(caseStudy.scenario).trim().length < 50
        ) {

            throw new Error(
                `Case study ${caseStudy.caseStudyId} does not contain a meaningful scenario.`
            );
        }


        if (
            !caseStudy.curriculumId ||
            !caseStudy.chapterName ||
            !caseStudy.concept
        ) {

            throw new Error(
                `Case study ${caseStudy.caseStudyId} has incomplete curriculum mapping.`
            );
        }


        if (
            !Array.isArray(caseStudy.questions) ||
            caseStudy.questions.length < 2
        ) {

            throw new Error(
                `Case study ${caseStudy.caseStudyId} must contain at least two subquestions.`
            );
        }


        let calculatedMarks = 0;


        for (const question of caseStudy.questions) {

            if (!question.questionId) {

                throw new Error(
                    `Case study ${caseStudy.caseStudyId} has a subquestion without an ID.`
                );
            }


            if (
                !question.question ||
                String(question.question).trim().length < 15
            ) {

                throw new Error(
                    `Case study ${caseStudy.caseStudyId} contains an invalid subquestion.`
                );
            }


            if (
                !question.modelAnswer ||
                String(question.modelAnswer).trim().length < 10
            ) {

                throw new Error(
                    `Case study ${caseStudy.caseStudyId} contains a missing model answer.`
                );
            }


            const marks =
                Number(question.marks);


            if (
                !Number.isFinite(marks) ||
                marks <= 0
            ) {

                throw new Error(
                    `Invalid marks in case study ${caseStudy.caseStudyId}.`
                );
            }


            calculatedMarks += marks;
        }


        /*
         * Verify the total.
         */
        if (
            Math.abs(
                calculatedMarks -
                Number(caseStudy.totalMarks)
            ) > 0.001
        ) {

            throw new Error(
                `Case study ${caseStudy.caseStudyId} has an incorrect totalMarks value.`
            );
        }
    }


    return true;
}


/* ============================================================
   VALIDATE CURRICULUM MAPPING
============================================================ */

function validateCurriculumMapping(
    assessment,
    generatedData
) {

    const selectedIds = new Set(
        (assessment.selectedChapters || [])
            .map(chapter =>
                String(chapter.curriculumId)
            )
    );


    /*
     * Validate MCQs.
     */
    for (const question of generatedData.questions) {

        if (
            !selectedIds.has(
                String(question.curriculumId)
            )
        ) {

            throw new Error(
                `MCQ ${question.questionId} references a chapter that was not selected.`
            );
        }
    }


    /*
     * Validate Case Studies.
     */
    for (const caseStudy of generatedData.caseStudies) {

        if (
            !selectedIds.has(
                String(caseStudy.curriculumId)
            )
        ) {

            throw new Error(
                `Case study ${caseStudy.caseStudyId} references a chapter that was not selected.`
            );
        }
    }


    return true;
}


/* ============================================================
   GENERATE QUESTIONS
============================================================ */

/**
 * Generate MCQs + Case Studies for an assessment.
 *
 * IMPORTANT:
 * This function does NOT expose AI to the parent/student.
 */
async function generateAssessmentQuestions({
    assessmentId,
    mcqCount = 20,
    caseStudyCount = 2
}) {

    if (!assessmentId) {

        throw new Error(
            "Assessment ID is required."
        );
    }


    const assessment =
        await PublicAssessment.findOne({
            assessmentId:
                String(assessmentId)
                    .trim()
                    .toUpperCase()
        });


    if (!assessment) {

        throw new Error(
            "Assessment not found."
        );
    }


    /*
     * Never generate questions for a finalized/submitted
     * assessment.
     */
    const lockedStatuses = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "EVALUATED",
        "FINALIZED"
    ];


    if (
        lockedStatuses.includes(
            assessment.status
        )
    ) {

        throw new Error(
            "Questions cannot be regenerated after assessment submission."
        );
    }


    const counts =
        normalizeQuestionCounts({
            mcqCount,
            caseStudyCount
        });


    const prompt =
        buildGenerationPrompt({
            assessment,
            mcqCount: counts.mcq,
            caseStudyCount: counts.caseStudies
        });


    let lastError = null;


    /*
     * Retry if generated output fails validation.
     */
    for (
        let attempt = 1;
        attempt <= MAX_GENERATION_ATTEMPTS;
        attempt++
    ) {

        try {

            const response =
                await openai.responses.create({

                    model: AI_MODEL,

                    input: [

                        {
                            role: "system",

                            content: [
                                {
                                    type: "input_text",

                                    text:
                                        HARD_QUESTION_RULES
                                }
                            ]
                        },

                        {
                            role: "user",

                            content: [
                                {
                                    type: "input_text",

                                    text: prompt
                                }
                            ]
                        }

                    ],

                    text: {

                        format: {

                            type: "json_schema",

                            name:
                                "gopes_pinnacle_assessment",

                            strict: true,

                            schema:
                                ASSESSMENT_SCHEMA
                        }
                    }

                });


            const responseText =
                extractResponseText(response);


            const generatedData =
                parseJSONResponse(responseText);


            /*
             * Programmatic quality checks.
             */
            validateGeneratedQuestions(
                generatedData.questions,
                counts.mcq
            );


            validateGeneratedCaseStudies(
                generatedData.caseStudies,
                counts.caseStudies
            );


            validateCurriculumMapping(
                assessment,
                generatedData
            );


            /*
             * Success.
             */
            return generatedData;

        } catch (error) {

            lastError = error;

            console.error(
                `Public Assessment AI generation attempt ${attempt} failed:`,
                error.message
            );
        }
    }


    /*
     * All attempts failed.
     */
    throw new Error(
        `Unable to generate a valid assessment after ${MAX_GENERATION_ATTEMPTS} attempts. ${
            lastError?.message || ""
        }`
    );
}


/* ============================================================
   SAVE GENERATED QUESTIONS
============================================================ */

/**
 * Generate and immediately store the questions in
 * PublicAssessment.
 */
async function generateAndSaveAssessmentQuestions({
    assessmentId,
    mcqCount = 20,
    caseStudyCount = 2
}) {

    const generatedData =
        await generateAssessmentQuestions({
            assessmentId,
            mcqCount,
            caseStudyCount
        });


    const assessment =
        await PublicAssessment.findOne({
            assessmentId:
                String(assessmentId)
                    .trim()
                    .toUpperCase()
        });


    if (!assessment) {

        throw new Error(
            "Assessment not found."
        );
    }


    /*
     * Attach generated questions.
     */
    assessment.questions =
        generatedData.questions;


    assessment.caseStudies =
        generatedData.caseStudies;


    /*
     * Calculate maximum marks.
     */
    let maximumMarks = 0;


    for (
        const question
        of generatedData.questions
    ) {

        maximumMarks +=
            Number(question.marks) || 0;
    }


    for (
        const caseStudy
        of generatedData.caseStudies
    ) {

        /*
         * Case study marks are separate from MCQ marks.
         */
        maximumMarks +=
            Number(caseStudy.totalMarks) || 0;
    }


    assessment.scores = {

        mcq: 0,

        caseStudy: 0,

        total: 0,

        max: maximumMarks,

        percentage: 0

    };


    assessment.status =
        "IN_PROGRESS";


    await assessment.save();


    return assessment;
}


/* ============================================================
   REGENERATE SINGLE QUESTION
============================================================ */

/**
 * This function is intentionally NOT implemented yet.
 *
 * We will add controlled single-question regeneration later
 * if required.
 *
 * This prevents accidentally replacing an entire assessment
 * when only one question needs correction.
 */


/* ============================================================
   EXPORTS
============================================================ */

module.exports = {

    generateAssessmentQuestions,

    generateAndSaveAssessmentQuestions,

    buildCurriculumContext,

    validateGeneratedQuestions,

    validateGeneratedCaseStudies

};