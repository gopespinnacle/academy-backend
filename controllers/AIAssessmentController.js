const AIAssessment = require("../models/AIAssessment");
const s3 = require("../config/s3");
const pdfExtractor = require("../services/pdfExtractor");
const openAIService = require("../services/openAIService");
const QuestionBank = require("../models/QuestionBank");

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
            uploadMode
        } = req.body;

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
                "Uploaded"

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

    className,

    subject,

    chapter

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