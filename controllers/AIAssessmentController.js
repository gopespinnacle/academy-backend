const AIAssessment = require("../models/AIAssessment");
const s3 = require("../config/s3");
const pdfExtractor = require("../services/pdfExtractor");
const openAIService = require("../services/openAIService");
const QuestionBank = require("../models/QuestionBank");
const QuestionPaper = require("../models/QuestionPaper");

/*
====================================================
Upload Chapter
====================================================
*/

exports.uploadChapter = async (req, res) => {

    try {

        const {
    className,
    subject,
    chapter,
    teacherId,
    uploadMode,
    questionLevel,
    totalMarks,
    duration,
    questionMode,
    questionTypes
} = req.body;

let selectedQuestionTypes = [];

try {

    selectedQuestionTypes =
        questionTypes
            ? JSON.parse(questionTypes)
            : [];

} catch (err) {

    selectedQuestionTypes = [];

}

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload a PDF file."
            });
        }

        if (!className || !subject || !chapter || !teacherId) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields."
            });
        }

        const latest = await AIAssessment
            .findOne({
                className,
                subject,
                chapter
            })
            .sort({ version: -1 });

        if (latest && uploadMode !== "newVersion") {

            return res.json({

                success: false,

                duplicate: true,

                latestVersion: latest.version,

                assessmentId: latest._id,

                message:
                    "Chapter already exists."

            });

        }

        let version = 1;

        if (latest && uploadMode === "newVersion") {

            version = latest.version + 1;

        }

        const uploaded = await s3.uploadFile(

            req.file,

            "AI/AssessmentChapters"

        );

        const assessment = await AIAssessment.create({

            className,

            subject,

            chapter,

            uploadedFileName:
                req.file.originalname,

            s3Key:
                uploaded.Key,

            s3Url:
                uploaded.Location,

            uploadedBy:
                teacherId,

            version,

            status:
                "Uploaded",

                questionLevel,
totalMarks: Number(totalMarks),
duration,
questionMode,
questionTypes: selectedQuestionTypes

        });

        // ------------------------------------
// Extract PDF Text
// ------------------------------------

const pdfData = await pdfExtractor.extractText(
    req.file.buffer
);

// ------------------------------------
// Generate AI Questions
// ------------------------------------

const aiResponse =
await openAIService.generateQuestionBank({

    pdfText: pdfData.text,

    pdfPages: pdfData.pageTexts,

    className,

    subject,

    chapter,

    questionLevel,

    totalMarks,

    duration,

    questionMode,

    questionTypes: selectedQuestionTypes

});

// ------------------------------------
// Convert JSON
// ------------------------------------

let parsed;

try{

    parsed = JSON.parse(aiResponse);

}catch(err){

    return res.status(500).json({

        success:false,

        message:"AI returned invalid JSON.",

        aiResponse

    });

}

// ------------------------------------
// Save Question Bank
// ------------------------------------

const questionBank =
await QuestionBank.create({

    assessment: assessment._id,

    className,

    subject,

    chapter,

    version,

    generatedBy: teacherId,

    questionLevel,
    totalMarks: Number(totalMarks),
    duration,
    questionMode,
    questionTypes: selectedQuestionTypes,

    questions: parsed.questions || [],

    totalQuestions:
        parsed.questions
            ? parsed.questions.length
            : 0,

    aiModel:"gpt-5-mini"

});

// ------------------------------------
// Link Question Bank
// ------------------------------------

assessment.questionBankId =
questionBank._id;

assessment.status =
"QuestionBankReady";

await assessment.save();

       return res.json({

    success: true,

    message: "Question Bank generated successfully.",

    assessment,

    questionBank,

    questionBankId: questionBank._id,

    totalQuestions: questionBank.totalQuestions

});

    }

    catch (err) {

        console.error(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
====================================================
Get Question Bank
====================================================
*/

exports.getQuestionBank = async (req, res) => {

    try {

        const { id } = req.params;

        const questionBank = await QuestionBank.findById(id);

        if (!questionBank) {

            return res.status(404).json({

                success: false,

                message: "Question Bank not found."

            });

        }

        return res.json({

            success: true,

            questionBank

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
====================================================
Update Question Bank
====================================================
*/

exports.updateQuestionBank = async (req, res) => {

    try {

        const { id } = req.params;

        const { questions } = req.body;

        const questionBank = await QuestionBank.findById(id);

        if (!questionBank) {

            return res.status(404).json({

                success: false,

                message: "Question Bank not found."

            });

        }

        questionBank.questions = questions;

        questionBank.totalQuestions = questions.length;

        await questionBank.save();

        return res.json({

            success: true,

            message: "Question Bank updated successfully.",

            questionBank

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

exports.generateQuestionPaper = async (req, res) => {

    try {

        const { questionBankId } = req.body;

        const QuestionBank =
        require("../models/QuestionBank");

        const questionBank =
        await QuestionBank.findById(questionBankId);

        if (!questionBank) {

            return res.json({

                success: false,

                message: "Question Bank not found."

            });

        }

        return res.json({

            success: true,

            message: "Question Paper Generated Successfully.",

            questionPaper: {

                className: questionBank.className,

                subject: questionBank.subject,

                chapter: questionBank.chapter,

                questions: questionBank.questions

            }

        });

    }
    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

/*
====================================================
Get Latest Question Bank
====================================================
*/

exports.getLatestQuestionBank = async (req, res) => {

    try {

        const {
            className,
            subject,
            chapter
        } = req.query;

        if (!className || !subject || !chapter) {

            return res.status(400).json({

                success: false,

                message: "className, subject and chapter are required."

            });

        }

        const questionBank = await QuestionBank.findOne({

            className,
            subject,
            chapter

        }).sort({

            version: -1

        });

        if (!questionBank) {

            return res.status(404).json({

                success: false,

                message: "Question Bank not found."

            });

        }

        return res.json({

            success: true,

            questionBank

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};
/*
====================================================
Generate Question Paper
====================================================
*/

exports.generateQuestionPaper = async (req, res) => {

    try {

        const {
            questionBankId,
            paperTitle
        } = req.body;

        const questionBank =
            await QuestionBank.findById(questionBankId);

        if (!questionBank) {

            return res.status(404).json({

                success: false,

                message: "Question Bank not found."

            });

        }

        // ------------------------------------
        // PAPER CONFIGURATION
        // ------------------------------------

        const requestedTotalMarks =
            Number(
                questionBank.totalMarks || 25
            );

        const paperDuration =
            questionBank.duration || "40 Minutes";

        const paperDifficulty =
            questionBank.questionLevel || "Medium";

        const selectedTypes =
            Array.isArray(questionBank.questionTypes)
                ? questionBank.questionTypes
                : [];

        // ------------------------------------
        // VALIDATE TOTAL MARKS
        // ------------------------------------

        const allowedMarks = [
            10,
            25,
            50,
            80,
            100
        ];

        if (!allowedMarks.includes(requestedTotalMarks)) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid total marks configuration."

            });

        }

        // ------------------------------------
        // PREPARE QUESTION POOL
        // ------------------------------------

        let availableQuestions =
            Array.isArray(questionBank.questions)
                ? questionBank.questions
                : [];

        if (!availableQuestions.length) {

            return res.status(400).json({

                success: false,

                message:
                    "Question Bank contains no questions."

            });

        }

        // ------------------------------------
        // FILTER BY SELECTED QUESTION TYPES
        // ------------------------------------

        if (selectedTypes.length > 0) {

            availableQuestions =
                availableQuestions.filter(q =>
                    selectedTypes.includes(q.type)
                );

        }

        if (!availableQuestions.length) {

            return res.status(400).json({

                success: false,

                message:
                    "No questions match the selected question types."

            });

        }

        // ------------------------------------
        // PREFER SELECTED DIFFICULTY
        // ------------------------------------

        const preferredQuestions =
            availableQuestions.filter(q =>
                q.difficulty === paperDifficulty
            );

        const otherQuestions =
            availableQuestions.filter(q =>
                q.difficulty !== paperDifficulty
            );

        /*
        Prefer the selected difficulty.

        Other difficulty questions are kept as a
        fallback only when an exact-mark paper cannot
        be formed using the preferred difficulty alone.
        */

        const sortQuestions = (questions) => {

            return [...questions].sort(() => Math.random() - 0.5);

        };

        let candidates =
            sortQuestions(preferredQuestions);

        const fallbackCandidates =
            sortQuestions(otherQuestions);

        // ------------------------------------
        // EXACT-MARK SUBSET FINDER
        // ------------------------------------

        function findExactCombination(
            questions,
            target
        ) {

            const dp =
                new Array(target + 1)
                    .fill(null);

            dp[0] = [];

            for (
                let i = 0;
                i < questions.length;
                i++
            ) {

                const q =
                    questions[i];

                const marks =
                    Number(q.marks || 0);

                if (
                    !Number.isFinite(marks) ||
                    marks <= 0 ||
                    marks > target
                ) {

                    continue;

                }

                for (
                    let sum = target;
                    sum >= marks;
                    sum--
                ) {

                    if (
                        dp[sum] === null &&
                        dp[sum - marks] !== null
                    ) {

                        dp[sum] = [
                            ...dp[sum - marks],
                            i
                        ];

                    }

                }

                if (dp[target] !== null) {
                    break;
                }

            }

            if (dp[target] === null) {
                return null;
            }

            return dp[target].map(
                index => questions[index]
            );

        }

        // ------------------------------------
        // TRY SELECTED DIFFICULTY FIRST
        // ------------------------------------

        let selectedQuestions =
            findExactCombination(
                candidates,
                requestedTotalMarks
            );

        // ------------------------------------
        // FALLBACK:
        // ALL SELECTED TYPES
        // ------------------------------------

        if (!selectedQuestions) {

            candidates =
                sortQuestions(
                    availableQuestions
                );

            selectedQuestions =
                findExactCombination(
                    candidates,
                    requestedTotalMarks
                );

        }

        // ------------------------------------
        // EXACT MARKS CHECK
        // ------------------------------------

        if (!selectedQuestions) {

            return res.status(400).json({

                success: false,

                message:
                    `Unable to create an exact ${requestedTotalMarks}-mark paper from the current Question Bank. Please add more questions with suitable mark values.`

            });

        }

        const calculatedMarks =
            selectedQuestions.reduce(
                (sum, q) =>
                    sum + Number(q.marks || 0),
                0
            );

        if (
            calculatedMarks !==
            requestedTotalMarks
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Question Paper mark calculation failed. No paper was created."

            });

        }

        // ------------------------------------
        // BUILD FINAL PAPER QUESTIONS
        // ------------------------------------

        const finalQuestions =
            selectedQuestions.map(q => ({

                questionId: q._id,

                question: q.question,

                answer: q.answer || "",

                type: q.type,

                options:
                    Array.isArray(q.options)
                        ? q.options
                        : [],

                marks: Number(q.marks || 0),

                difficulty:
                    q.difficulty || paperDifficulty

            }));

        // ------------------------------------
        // CREATE QUESTION PAPER
        // ------------------------------------

        const paper =
            await QuestionPaper.create({

                questionBank:
                    questionBank._id,

                className:
                    questionBank.className,

                subject:
                    questionBank.subject,

                chapter:
                    questionBank.chapter,

                paperTitle:
                    paperTitle ||
                    "Question Paper",

                questionLevel:
                    questionBank.questionLevel ||
                    "Medium",

                questionMode:
                    questionBank.questionMode ||
                    "Direct + Indirect",

                questionTypes:
                    questionBank.questionTypes || [],

                totalMarks:
                    requestedTotalMarks,

                duration:
                    paperDuration,

                difficulty:
                    paperDifficulty,

                questions:
                    finalQuestions,

                createdBy:
                    questionBank.generatedBy

            });

        return res.json({

            success: true,

            message:
                "Question Paper generated successfully.",

            paper

        });

    }
    catch (err) {

        console.error(
            "Generate Question Paper Error:",
            err
        );

        return res.status(500).json({

            success: false,

            message: err.message

        });

    }

};