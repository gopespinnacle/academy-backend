const AIAssessment = require("../models/AIAssessment");
const s3 = require("../config/s3");
const pdfExtractor = require("../services/pdfExtractor");
const openAIService = require("../services/openAIService");
const QuestionBank = require("../models/QuestionBank");
const QuestionPaper = require("../models/QuestionPaper");

const AIAssessmentAssignment =
    require("../models/AIAssessmentAssignment");

    const AIAssessmentSubmission =
    require("../models/AIAssessmentSubmission");

const jwt =
    require("jsonwebtoken");

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
    questionTypes,
    assignedStudents
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

let selectedStudents = [];

try {

    selectedStudents =
        assignedStudents
            ? JSON.parse(assignedStudents)
            : [];

} catch (err) {

    selectedStudents = [];
}

if (!Array.isArray(selectedStudents) ||
    selectedStudents.length === 0) {

    return res.status(400).json({

        success: false,

        message:
            "Please select at least one student."

    });

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
    paperTitle,
    assignedStudents
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
// PARSE SELECTED STUDENTS
// ------------------------------------

let selectedStudents = [];

try {

    selectedStudents =
        assignedStudents
            ? JSON.parse(assignedStudents)
            : [];

} catch (err) {

    selectedStudents = [];

}

if (
    !Array.isArray(selectedStudents) ||
    selectedStudents.length === 0
) {

    return res.status(400).json({

        success: false,

        message:
            "No students were selected for this question paper."

    });

}

        // ------------------------------------
        // PAPER CONFIGURATION
        // ------------------------------------

        const requestedTotalMarks =
            Number(questionBank.totalMarks || 25);

        const paperDuration =
            questionBank.duration || "40 Minutes";

        const paperDifficulty =
            questionBank.questionLevel || "Medium";

        const selectedTypes =
            Array.isArray(questionBank.questionTypes)
                ? questionBank.questionTypes
                : [];

        // ------------------------------------
        // ALLOWED PAPER MARKS
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
                message: "Invalid total marks configuration."
            });

        }

        // ------------------------------------
        // GET QUESTIONS
        // ------------------------------------

        let availableQuestions =
            Array.isArray(questionBank.questions)
                ? questionBank.questions
                : [];

        if (!availableQuestions.length) {

            return res.status(400).json({
                success: false,
                message: "Question Bank contains no questions."
            });

        }

        // ------------------------------------
// FILTER QUESTION TYPES
// ------------------------------------

if (selectedTypes.length > 0) {

    const normalizeType = (value) => {

        return String(value || "")
            .replace(/\u200B/g, "")
            .replace(/\uFEFF/g, "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "");

    };

    const normalizedSelectedTypes =
        selectedTypes.map(normalizeType);

    const matchedQuestions =
        availableQuestions.filter(q => {

            const questionType =
                normalizeType(q.type);

            return normalizedSelectedTypes.includes(
                questionType
            );

        });

    // ------------------------------------
    // USE MATCHED QUESTIONS WHEN AVAILABLE
    // ------------------------------------

    if (matchedQuestions.length > 0) {

        availableQuestions =
            matchedQuestions;

    }

}

        // ------------------------------------
        // IMPORTANT
        // ONLY 1, 2 AND 5 MARK QUESTIONS
        // ------------------------------------

        availableQuestions =
            availableQuestions.filter(q => {

                const marks = Number(q.marks);

                return (
                    marks === 1 ||
                    marks === 2 ||
                    marks === 5
                );

            });

        if (!availableQuestions.length) {

            return res.status(400).json({
                success: false,
                message:
                    "No valid 1, 2 or 5 mark questions are available."
            });

        }

        // ------------------------------------
        // RANDOMIZE QUESTIONS
        // ------------------------------------

        const shuffledQuestions =
            [...availableQuestions]
                .sort(() => Math.random() - 0.5);

        // ------------------------------------
        // FIND EXACT MARK COMBINATION
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
                    Number(q.marks);

                if (
                    marks !== 1 &&
                    marks !== 2 &&
                    marks !== 5
                ) {
                    continue;
                }

                if (marks > target) {
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
        // CREATE EXACT PAPER
        // ------------------------------------

        const selectedQuestions =
            findExactCombination(
                shuffledQuestions,
                requestedTotalMarks
            );

        // ------------------------------------
        // IF EXACT TOTAL NOT POSSIBLE
        // ------------------------------------

        if (!selectedQuestions) {

            const count1 =
                availableQuestions.filter(
                    q => Number(q.marks) === 1
                ).length;

            const count2 =
                availableQuestions.filter(
                    q => Number(q.marks) === 2
                ).length;

            const count5 =
                availableQuestions.filter(
                    q => Number(q.marks) === 5
                ).length;

            return res.status(400).json({

                success: false,

                message:
                    `Unable to create an exact ${requestedTotalMarks}-mark paper from the current Question Bank.`,

                availableQuestions: {
                    oneMark: count1,
                    twoMark: count2,
                    fiveMark: count5
                },

                required:
                    "The Question Bank must contain enough 1, 2 and/or 5 mark questions."

            });

        }

        // ------------------------------------
        // VERIFY TOTAL MARKS
        // ------------------------------------

        const calculatedMarks =
            selectedQuestions.reduce(
                (sum, q) =>
                    sum + Number(q.marks),
                0
            );

        if (
            calculatedMarks !==
            requestedTotalMarks
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Question Paper mark calculation failed."

            });

        }

        // ------------------------------------
        // BUILD FINAL QUESTIONS
        // ------------------------------------

        const finalQuestions =
            selectedQuestions.map(q => ({

                questionId:
                    q._id,

                question:
                    q.question,

                answer:
                    q.answer || "",

                type:
                    q.type,

                options:
                    Array.isArray(q.options)
                        ? q.options
                        : [],

                marks:
                    Number(q.marks),

                difficulty:
                    q.difficulty ||
                    paperDifficulty

            }));

        // ------------------------------------
        // SAVE QUESTION PAPER
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
                    questionBank.questionTypes ||
                    [],

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

            // ------------------------------------
// ASSIGN QUESTION PAPER TO SELECTED STUDENTS
// ------------------------------------

const assignments =
    selectedStudents.map(student => ({

        questionPaper:
            paper._id,

        questionBank:
            questionBank._id,

        teacher:
            questionBank.generatedBy,

        student:
            student.userId,

        studentName:
            student.studentName,

        studentId:
            student.studentId,

        className:
            questionBank.className,

        subject:
            questionBank.subject,

        chapter:
            questionBank.chapter,

        status:
            "Assigned"

    }));


if (assignments.length > 0) {

    await AIAssessmentAssignment.insertMany(
        assignments
    );

}

        return res.json({

    success: true,

    message:
        "Question Paper generated and assigned successfully.",

    paper,

    assignedStudents:
        selectedStudents

});

    }
    catch (err) {

        console.error(
            "Generate Question Paper Error:",
            err
        );

        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};


/*
====================================================
STUDENT ASSESSMENT SHEET
GET ALL ASSESSMENTS FOR LOGGED-IN STUDENT
====================================================
*/

exports.getStudentAssessments =
async (req, res) => {

    try {

        /*
        --------------------------------------------
        GET TOKEN
        --------------------------------------------
        */

        const token =
            req.headers.authorization
                ?.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is required."

            });

        }


        /*
        --------------------------------------------
        VERIFY TOKEN
        --------------------------------------------
        */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const studentUserId =
            decoded.id;


        if (!studentUserId) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid student authentication."

            });

        }


        /*
        --------------------------------------------
        FIND ONLY THIS STUDENT'S ASSIGNMENTS
        --------------------------------------------
        */

        const assignments =
    await AIAssessmentAssignment
        .find({
            student:
                studentUserId
        })
        .populate(
            "questionPaper"
        )
        .populate(
            "teacher",
            "name teacherName"
        )
        .sort({
            assignedAt: -1
        });


        /*
        --------------------------------------------
        GET SUBMISSIONS
        --------------------------------------------
        */

        const assignmentIds =
            assignments.map(
                assignment =>
                    assignment._id
            );


        const submissions =
            await AIAssessmentSubmission
                .find({
                    assignment: {
                        $in:
                            assignmentIds
                    }
                })
                .sort({
                    createdAt: -1
                });


        /*
        --------------------------------------------
        CONVERT SUBMISSIONS TO QUICK LOOKUP
        --------------------------------------------
        */

        const submissionMap =
            new Map();


        submissions.forEach(
            submission => {

                submissionMap.set(
                    String(
                        submission.assignment
                    ),
                    submission
                );

            }
        );


        /*
        --------------------------------------------
        PREPARE RESPONSE
        --------------------------------------------
        */

        const data =
            assignments.map(
                assignment => {

                    const submission =
                        submissionMap.get(
                            String(
                                assignment._id
                            )
                        );


                    let answerStatus =
                        "Not Submitted";


                    if (submission) {

                        answerStatus =
                            submission.status ===
                            "Corrected"

                                ? "Corrected"

                                : "Submitted";

                    }


                    return {

                        _id:
                            assignment._id,

                        questionPaperId:
                            assignment.questionPaper
                                ? assignment.questionPaper._id
                                : assignment.questionPaper,

                        questionBankId:
                            assignment.questionBank,

                        student:
                            assignment.student,

                        studentName:
                            assignment.studentName,

                        studentId:
                            assignment.studentId,

                        className:
                            assignment.className,

                        subject:
                            assignment.subject,

                        chapter:
                            assignment.chapter,

                        teacher:
    assignment.teacher,

teacherName:
    assignment.teacher
        ? (
            assignment.teacher.name ||
            assignment.teacher.teacherName ||
            ""
        )
        : "",

                        status:
                            assignment.status,

                        assignedAt:
                            assignment.assignedAt,

                        createdAt:
                            assignment.createdAt,

                        answerStatus,

                        submissionId:
                            submission
                                ? submission._id
                                : null

                    };

                }
            );


        return res.json({

            success:
                true,

            data

        });

    }
    catch (err) {

        console.error(
            "Get Student Assessments Error:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};

/*
====================================================
STUDENT VIEW PARTICULAR ASSESSMENT
====================================================
*/

exports.getStudentAssessment =
async (req, res) => {

    try {

        /*
        --------------------------------------------
        GET TOKEN
        --------------------------------------------
        */

        const token =
            req.headers.authorization
                ?.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is required."

            });

        }


        /*
        --------------------------------------------
        VERIFY TOKEN
        --------------------------------------------
        */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const studentUserId =
            decoded.id;


        /*
        --------------------------------------------
        FIND ASSIGNMENT
        --------------------------------------------
        */

        const assignment =
            await AIAssessmentAssignment
                .findOne({

                    _id:
                        req.params.assignmentId,

                    student:
                        studentUserId

                })
                .populate(
                    "questionPaper"
                );


        if (!assignment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found or not assigned to this student."

            });

        }


        /*
        --------------------------------------------
        RETURN PAPER
        --------------------------------------------
        */

        return res.json({

            success:
                true,

            assignment,

            paper:
                assignment.questionPaper

        });

    }
    catch (err) {

        console.error(
            "Get Student Assessment Error:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};

/*
====================================================
STUDENT SUBMIT ANSWERS
MULTIPLE FILES
====================================================
*/

exports.submitStudentAnswers =
async (req, res) => {

    try {

        /*
        --------------------------------------------
        GET TOKEN
        --------------------------------------------
        */

        const token =
            req.headers.authorization
                ?.split(" ")[1];


        if (!token) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication token is required."

            });

        }


        /*
        --------------------------------------------
        VERIFY TOKEN
        --------------------------------------------
        */

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        const studentUserId =
            decoded.id;


        /*
        --------------------------------------------
        CHECK FILES
        --------------------------------------------
        */

        if (
            !req.files ||
            req.files.length === 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please select at least one answer file."

            });

        }


        /*
        --------------------------------------------
        FIND ONLY THIS STUDENT'S ASSIGNMENT
        --------------------------------------------
        */

        const assignment =
            await AIAssessmentAssignment
                .findOne({

                    _id:
                        req.params.assignmentId,

                    student:
                        studentUserId

                });


        if (!assignment) {

            return res.status(404).json({

                success: false,

                message:
                    "Assessment not found or not assigned to this student."

            });

        }


        /*
        --------------------------------------------
        PREVENT DUPLICATE SUBMISSION
        --------------------------------------------
        */

        const existingSubmission =
            await AIAssessmentSubmission
                .findOne({

                    assignment:
                        assignment._id

                });


        if (existingSubmission) {

            return res.status(400).json({

                success: false,

                message:
                    "Answers have already been submitted for this assessment."

            });

        }


        /*
        --------------------------------------------
        UPLOAD ALL ANSWER FILES TO S3
        --------------------------------------------
        */

        const uploadedFiles = [];


        for (
            const file of req.files
        ) {

            const uploaded =
                await s3.uploadFile(

                    file,

                    "AI/AssessmentAnswers"

                );


            uploadedFiles.push({

                fileName:
                    file.originalname,

                fileUrl:
                    uploaded.Location,

                uploadedAt:
                    new Date()

            });

        }


        /*
        --------------------------------------------
        CREATE SUBMISSION
        --------------------------------------------
        */

        const submission =
            await AIAssessmentSubmission.create({

                assignment:
                    assignment._id,

                questionPaper:
                    assignment.questionPaper,

                student:
                    assignment.student,

                studentName:
                    assignment.studentName,

                studentId:
                    assignment.studentId,

                answerFiles:
                    uploadedFiles,

                status:
                    "Submitted",

                submittedAt:
                    new Date()

            });


        /*
        --------------------------------------------
        UPDATE ASSIGNMENT
        --------------------------------------------
        */

        assignment.status =
            "Submitted";

        assignment.submittedAt =
            new Date();

        await assignment.save();


        /*
        --------------------------------------------
        RESPONSE
        --------------------------------------------
        */

        return res.json({

            success:
                true,

            message:
                "Answers submitted successfully.",

            submission

        });

    }
    catch (err) {

        console.error(
            "Submit Student Answers Error:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                err.message

        });

    }

};