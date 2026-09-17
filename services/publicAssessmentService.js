/**
 * Gopes Pinnacle Academy
 * Public Child Assessment Service
 *
 * IMPORTANT:
 * - This is a NEW isolated service.
 * - Do NOT modify openAIService.js for this feature.
 * - AI generation will be handled separately by:
 *      services/publicAssessmentAIService.js
 *
 * Responsibilities:
 * 1. Generate unique assessment IDs
 * 2. Validate curriculum/chapter selections
 * 3. Create public assessments
 * 4. Store selected chapter information
 * 5. Prepare assessment question/case-study structures
 * 6. Update MCQ answers and scores
 * 7. Maintain assessment status
 */

const PublicAssessment = require("../models/PublicAssessment");
const AssessmentCurriculum = require("../models/AssessmentCurriculum");


/* ============================================================
   CONFIGURATION
============================================================ */

const DEFAULT_ACADEMIC_YEAR = "2026-27";
const DEFAULT_BOARD = "CBSE";
const DEFAULT_CURRICULUM = "NCERT";


/* ============================================================
   UTILITY FUNCTIONS
============================================================ */

/**
 * Convert student name into the 3-letter assessment prefix.
 *
 * Examples:
 * Arjun        -> ARJ
 * Ravi Kumar   -> RAV
 * A            -> AXX
 * A. Kumar     -> AKU
 */
function generateStudentPrefix(studentName) {

    if (!studentName || typeof studentName !== "string") {
        throw new Error("Student name is required.");
    }

    const cleanedName = studentName
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, " ");

    if (!cleanedName) {
        throw new Error("Invalid student name.");
    }

    const parts = cleanedName
        .split(" ")
        .filter(Boolean);

    let prefix = "";

    if (parts.length >= 3) {

        prefix =
            parts[0].charAt(0) +
            parts[1].charAt(0) +
            parts[2].charAt(0);

    } else if (parts.length === 2) {

        prefix =
            parts[0].charAt(0) +
            parts[0].charAt(1) +
            parts[1].charAt(0);

    } else {

        prefix = parts[0].substring(0, 3);

    }

    prefix = prefix
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");

    while (prefix.length < 3) {
        prefix += "X";
    }

    return prefix.substring(0, 3);
}


/**
 * Generate the next assessment number for a student.
 *
 * Example:
 * ARJ-ASS1
 * ARJ-ASS2
 * ARJ-ASS3
 */
async function generateAssessmentId(studentName) {

    const studentPrefix = generateStudentPrefix(studentName);

    const latestAssessment = await PublicAssessment
        .findOne({
            studentPrefix: studentPrefix
        })
        .sort({
            assessmentNumber: -1
        })
        .select("assessmentNumber assessmentId")
        .lean();

    let nextNumber = 1;

    if (
        latestAssessment &&
        Number.isInteger(latestAssessment.assessmentNumber)
    ) {
        nextNumber = latestAssessment.assessmentNumber + 1;
    }

    let assessmentId = `${studentPrefix}-ASS${nextNumber}`;

    /*
     * Extra safety:
     * If the generated ID already exists, continue increasing
     * until a completely unique ID is found.
     */
    while (
        await PublicAssessment.exists({
            assessmentId: assessmentId
        })
    ) {

        nextNumber++;

        assessmentId = `${studentPrefix}-ASS${nextNumber}`;
    }

    return {
        studentPrefix,
        assessmentNumber: nextNumber,
        assessmentId
    };
}


/**
 * Normalize grade input.
 *
 * Accepts:
 * Grade 8
 * grade 8
 * 8
 *
 * Returns:
 * Grade 8
 */
function normalizeGrade(grade) {

    if (grade === undefined || grade === null) {
        throw new Error("Grade is required.");
    }

    const value = String(grade).trim();

    if (!value) {
        throw new Error("Grade is required.");
    }

    if (/^grade\s+/i.test(value)) {
        return value.replace(/^grade\s+/i, "Grade ");
    }

    if (/^\d+$/.test(value)) {
        return `Grade ${value}`;
    }

    return value;
}


/**
 * Normalize subject.
 */
function normalizeSubject(subject) {

    if (!subject || typeof subject !== "string") {
        throw new Error("Subject is required.");
    }

    const value = subject.trim();

    if (!value) {
        throw new Error("Subject is required.");
    }

    return value;
}


/**
 * Normalize split-up values.
 *
 * Example:
 * "Physics, Chemistry"
 *
 * becomes:
 * ["Physics", "Chemistry"]
 */
function normalizeSplitUps(splitUps) {

    if (splitUps === undefined || splitUps === null) {
        return [];
    }

    let values = [];

    if (Array.isArray(splitUps)) {

        values = splitUps;

    } else if (typeof splitUps === "string") {

        values = splitUps.split(",");

    } else {

        throw new Error("Invalid subject split-up.");
    }

    values = values
        .map(value => String(value).trim())
        .filter(Boolean);

    /*
     * Remove duplicates while preserving order.
     */
    values = [...new Set(values)];

    return values;
}


/**
 * Normalize chapter IDs received from frontend.
 *
 * The frontend may send:
 *
 * ["665...", "666..."]
 *
 * or:
 *
 * [{ curriculumId: "665..." }]
 */
function extractCurriculumIds(selectedChapters) {

    if (!Array.isArray(selectedChapters)) {
        throw new Error("Selected chapters must be an array.");
    }

    const ids = [];

    for (const chapter of selectedChapters) {

        if (typeof chapter === "string") {

            if (chapter.trim()) {
                ids.push(chapter.trim());
            }

        } else if (
            chapter &&
            typeof chapter === "object" &&
            chapter.curriculumId
        ) {

            ids.push(String(chapter.curriculumId).trim());
        }
    }

    return [...new Set(ids)];
}


/* ============================================================
   CURRICULUM VALIDATION
============================================================ */

/**
 * Validate selected chapters against the actual curriculum database.
 *
 * IMPORTANT:
 * We do NOT hardcode chapter names here.
 *
 * AssessmentCurriculum is the source of truth.
 */
async function validateSelectedChapters({
    grade,
    subject,
    splitUps,
    selectedChapters,
    board = DEFAULT_BOARD,
    curriculum = DEFAULT_CURRICULUM,
    academicYear = DEFAULT_ACADEMIC_YEAR
}) {

    const curriculumIds = extractCurriculumIds(selectedChapters);

    if (curriculumIds.length === 0) {
        throw new Error("Please select at least one chapter.");
    }

    /*
     * Build the base curriculum query.
     */
    const baseQuery = {
        board,
        curriculum,
        academicYear,
        grade,
        subject,
        active: true
    };

    /*
     * Fetch selected curriculum records.
     */
    const curriculumRecords = await AssessmentCurriculum
        .find({
            ...baseQuery,
            _id: {
                $in: curriculumIds
            }
        })
        .sort({
            chapterNumber: 1
        })
        .lean();

    /*
     * Ensure every selected chapter actually exists.
     */
    const foundIds = new Set(
        curriculumRecords.map(record =>
            String(record._id)
        )
    );

    const missingIds = curriculumIds.filter(
        id => !foundIds.has(String(id))
    );

    if (missingIds.length > 0) {

        throw new Error(
            "One or more selected chapters are not available in the current curriculum."
        );
    }


    /*
     * Validate split-up.
     *
     * If "All" is selected, all valid curriculum records for
     * the selected chapters are accepted.
     *
     * Otherwise only records belonging to the selected split-ups
     * are accepted.
     */
    let filteredRecords = curriculumRecords;

    if (
        splitUps.length > 0 &&
        !splitUps.some(
            value => value.toLowerCase() === "all"
        )
    ) {

        const normalizedSplitUps = splitUps.map(
            value => value.toLowerCase()
        );

        filteredRecords = curriculumRecords.filter(record => {

            if (!record.splitUp) {
                return false;
            }

            return normalizedSplitUps.includes(
                String(record.splitUp).toLowerCase()
            );
        });

        if (filteredRecords.length === 0) {

            throw new Error(
                "The selected subject split-up does not match the selected chapters."
            );
        }
    }


    /*
     * Convert curriculum records into a clean structure
     * stored inside PublicAssessment.
     */
    const selectedChapterSnapshots = filteredRecords.map(record => ({

        curriculumId: record._id,

        chapterNumber: record.chapterNumber,

        chapterName: record.chapterName,

        splitUp: record.splitUp

    }));


    return {
        curriculumRecords: filteredRecords,
        selectedChapters: selectedChapterSnapshots
    };
}


/* ============================================================
   CREATE ASSESSMENT
============================================================ */

/**
 * Create a new public assessment.
 *
 * This function DOES NOT generate AI questions.
 *
 * Question generation will happen through:
 *
 * services/publicAssessmentAIService.js
 */
async function createAssessment({
    studentName,
    parentName,
    whatsappNumber,
    parentEmail,
    grade,
    subject,
    splitUps,
    selectedChapters,
    board = DEFAULT_BOARD,
    curriculum = DEFAULT_CURRICULUM,
    academicYear = DEFAULT_ACADEMIC_YEAR
}) {

    /*
     * Basic validation.
     */
    if (!studentName || !String(studentName).trim()) {
        throw new Error("Student name is required.");
    }

    if (!parentName || !String(parentName).trim()) {
        throw new Error("Parent name is required.");
    }

    if (!whatsappNumber || !String(whatsappNumber).trim()) {
        throw new Error("WhatsApp number is required.");
    }

    if (!parentEmail || !String(parentEmail).trim()) {
        throw new Error("Parent email is required.");
    }


    const normalizedGrade = normalizeGrade(grade);

    const normalizedSubject = normalizeSubject(subject);

    const normalizedSplitUps = normalizeSplitUps(splitUps);


    /*
     * Validate selected chapters using the database.
     */
    const curriculumData = await validateSelectedChapters({

        grade: normalizedGrade,

        subject: normalizedSubject,

        splitUps: normalizedSplitUps,

        selectedChapters,

        board,

        curriculum,

        academicYear

    });


    /*
     * Generate unique student prefix + assessment number + ID.
     */
    const assessmentIdentity = await generateAssessmentId(
        studentName
    );


    /*
     * Create the assessment document.
     *
     * Questions are intentionally empty at this stage.
     *
     * The AI service will later populate them.
     */
    const assessment = new PublicAssessment({

        studentName: String(studentName).trim(),

        parentName: String(parentName).trim(),

        whatsappNumber: String(whatsappNumber).trim(),

        parentEmail: String(parentEmail).trim().toLowerCase(),

        board,

        curriculum,

        academicYear,

        grade: normalizedGrade,

        subject: normalizedSubject,

        splitUps: normalizedSplitUps,

        selectedChapters: curriculumData.selectedChapters,

        assessmentId: assessmentIdentity.assessmentId,

        assessmentNumber: assessmentIdentity.assessmentNumber,

        studentPrefix: assessmentIdentity.studentPrefix,

        questions: [],

        mcqAnswers: [],

        caseStudies: [],

        scores: {
            mcq: 0,
            caseStudy: 0,
            total: 0,
            max: 0,
            percentage: 0
        },

        status: "CREATED"

    });


    await assessment.save();


    return assessment;
}


/* ============================================================
   GET ASSESSMENT
============================================================ */

/**
 * Find an assessment using its public assessment ID.
 *
 * Example:
 * ARJ-ASS1
 */
async function getAssessmentById(assessmentId) {

    if (!assessmentId || typeof assessmentId !== "string") {
        throw new Error("Assessment ID is required.");
    }

    const assessment = await PublicAssessment
        .findOne({
            assessmentId: assessmentId.trim().toUpperCase()
        })
        .lean();

    if (!assessment) {
        throw new Error("Assessment not found.");
    }

    return assessment;
}


/**
 * Get assessment using MongoDB ObjectId.
 */
async function getAssessmentByObjectId(assessmentObjectId) {

    if (!assessmentObjectId) {
        throw new Error("Assessment ID is required.");
    }

    const assessment = await PublicAssessment
        .findById(assessmentObjectId)
        .lean();

    if (!assessment) {
        throw new Error("Assessment not found.");
    }

    return assessment;
}


/* ============================================================
   QUESTION MANAGEMENT
============================================================ */

/**
 * Attach generated questions to an assessment.
 *
 * The AI service will generate the questions.
 * This service only validates and stores them.
 */
async function attachGeneratedQuestions(
    assessmentId,
    questions,
    caseStudies = []
) {

    if (!Array.isArray(questions)) {
        throw new Error("Questions must be an array.");
    }

    if (!Array.isArray(caseStudies)) {
        throw new Error("Case studies must be an array.");
    }


    const assessment = await PublicAssessment.findOne({
        assessmentId: assessmentId.trim().toUpperCase()
    });

    if (!assessment) {
        throw new Error("Assessment not found.");
    }


    /*
     * Prevent accidental replacement after submission.
     */
    const lockedStatuses = [
        "SUBMITTED",
        "UNDER_REVIEW",
        "EVALUATED",
        "FINALIZED"
    ];

    if (lockedStatuses.includes(assessment.status)) {

        throw new Error(
            "Questions cannot be changed after the assessment has been submitted."
        );
    }


    assessment.questions = questions;

    assessment.caseStudies = caseStudies;

    assessment.status = "IN_PROGRESS";


    /*
     * Calculate maximum marks from the generated structure.
     */
    let maximumMarks = 0;

    for (const question of questions) {

        const marks = Number(question.marks);

        if (Number.isFinite(marks) && marks > 0) {
            maximumMarks += marks;
        }
    }


    /*
     * Case studies may contain their own total marks.
     *
     * Avoid double counting if case-study questions are already
     * included in the questions array.
     */
    let caseStudyMaximum = 0;

    for (const caseStudy of caseStudies) {

        const marks = Number(caseStudy.totalMarks);

        if (Number.isFinite(marks) && marks > 0) {
            caseStudyMaximum += marks;
        }
    }


    /*
     * If questions contain case-study marks already, the
     * question total is considered the authoritative total.
     *
     * Otherwise add case-study total marks.
     */
    const hasCaseStudyQuestions = questions.some(
        question =>
            String(question.type || "").toUpperCase() === "CASE_STUDY"
    );

    if (!hasCaseStudyQuestions) {
        maximumMarks += caseStudyMaximum;
    }


    assessment.scores = {
        ...(assessment.scores || {}).toObject
            ? assessment.scores.toObject()
            : assessment.scores,
        mcq: 0,
        caseStudy: 0,
        total: 0,
        max: maximumMarks,
        percentage: 0
    };


    await assessment.save();

    return assessment;
}


/* ============================================================
   MCQ ANSWER SUBMISSION
============================================================ */

/**
 * Save MCQ answers submitted by the student.
 *
 * The expected answer structure is:
 *
 * [
 *   {
 *      questionId: "Q1",
 *      selectedAnswer: "B"
 *   }
 * ]
 */
async function submitMCQAnswers(
    assessmentId,
    answers
) {

    if (!Array.isArray(answers)) {
        throw new Error("MCQ answers must be an array.");
    }


    const assessment = await PublicAssessment.findOne({
        assessmentId: assessmentId.trim().toUpperCase()
    });

    if (!assessment) {
        throw new Error("Assessment not found.");
    }


    const allowedStatuses = [
        "IN_PROGRESS",
        "MCQ_COMPLETED"
    ];

    if (!allowedStatuses.includes(assessment.status)) {

        throw new Error(
            "MCQ answers cannot be submitted at this stage."
        );
    }


    /*
     * Build a map of valid question IDs.
     */
    const questionMap = new Map();

    for (const question of assessment.questions || []) {

        if (
            question.questionId &&
            String(question.type).toUpperCase() === "MCQ"
        ) {

            questionMap.set(
                String(question.questionId),
                question
            );
        }
    }


    /*
     * Validate every submitted answer.
     */
    const cleanAnswers = [];

    for (const answer of answers) {

        if (!answer || !answer.questionId) {
            continue;
        }

        const question = questionMap.get(
            String(answer.questionId)
        );

        if (!question) {
            throw new Error(
                `Invalid MCQ question: ${answer.questionId}`
            );
        }

        cleanAnswers.push({

            questionId: String(answer.questionId),

            selectedAnswer:
                answer.selectedAnswer !== undefined &&
                answer.selectedAnswer !== null
                    ? String(answer.selectedAnswer)
                    : ""

        });
    }


    /*
     * Automatically calculate MCQ score.
     */
    let mcqScore = 0;

    for (const answer of cleanAnswers) {

        const question = questionMap.get(
            answer.questionId
        );

        if (!question) {
            continue;
        }

        const selected =
            String(answer.selectedAnswer || "")
                .trim()
                .toLowerCase();

        const correct =
            String(question.correctAnswer || "")
                .trim()
                .toLowerCase();

        if (
            selected &&
            correct &&
            selected === correct
        ) {

            mcqScore += Number(question.marks) || 0;
        }
    }


    /*
     * Determine whether case studies exist.
     */
    const hasCaseStudies =
        Array.isArray(assessment.caseStudies) &&
        assessment.caseStudies.length > 0;


    assessment.mcqAnswers = cleanAnswers;


    assessment.scores.mcq = mcqScore;


    /*
     * If case study evaluation is still required,
     * the final score is NOT calculated yet.
     */
    if (hasCaseStudies) {

        assessment.status = "CASE_STUDY_PENDING";

    } else {

        const maxMarks = Number(
            assessment.scores.max || 0
        );

        const totalScore = mcqScore;

        assessment.scores.total = totalScore;

        assessment.scores.percentage =
            maxMarks > 0
                ? Number(
                    ((totalScore / maxMarks) * 100)
                        .toFixed(2)
                )
                : 0;

        assessment.status = "SUBMITTED";
    }


    await assessment.save();

    return assessment;
}


/* ============================================================
   CASE STUDY DOCUMENT LINKING
============================================================ */

/**
 * Attach uploaded documents to a particular case study.
 *
 * This is important because each document must remain linked
 * to the exact assessment + exact case study.
 */
async function attachCaseStudyDocuments({
    assessmentId,
    caseStudyId,
    documentIds
}) {

    if (!assessmentId) {
        throw new Error("Assessment ID is required.");
    }

    if (!caseStudyId) {
        throw new Error("Case Study ID is required.");
    }

    if (!Array.isArray(documentIds) || documentIds.length === 0) {

        throw new Error(
            "At least one document is required."
        );
    }


    const assessment = await PublicAssessment.findOne({
        assessmentId: assessmentId.trim().toUpperCase()
    });

    if (!assessment) {
        throw new Error("Assessment not found.");
    }


    const caseStudy = assessment.caseStudies.find(
        item =>
            String(item.caseStudyId) ===
            String(caseStudyId)
    );


    if (!caseStudy) {

        throw new Error(
            "Case study does not belong to this assessment."
        );
    }


    /*
     * Store only unique document IDs.
     */
    caseStudy.documentIds = [
        ...new Set(
            documentIds.map(id => String(id))
        )
    ];


    caseStudy.uploaded = true;


    /*
     * If every case study has uploaded documents,
     * assessment can move toward submission.
     */
    const allUploaded =
        assessment.caseStudies.length > 0 &&
        assessment.caseStudies.every(
            item =>
                item.uploaded === true &&
                Array.isArray(item.documentIds) &&
                item.documentIds.length > 0
        );


    if (allUploaded) {

        assessment.status = "SUBMITTED";

    } else {

        assessment.status = "CASE_STUDY_PENDING";
    }


    await assessment.save();

    return assessment;
}


/* ============================================================
   CASE STUDY MARKS
============================================================ */

/**
 * Store teacher-evaluated marks for one case study.
 *
 * Final score is NOT finalized here unless all case studies
 * have been evaluated.
 */
async function saveCaseStudyMarks({
    assessmentId,
    caseStudyId,
    marksObtained,
    teacherFeedback
}) {

    const assessment = await PublicAssessment.findOne({
        assessmentId: assessmentId.trim().toUpperCase()
    });

    if (!assessment) {
        throw new Error("Assessment not found.");
    }


    const caseStudy = assessment.caseStudies.find(
        item =>
            String(item.caseStudyId) ===
            String(caseStudyId)
    );


    if (!caseStudy) {

        throw new Error(
            "Case study does not belong to this assessment."
        );
    }


    const obtained = Number(marksObtained);

    const maximum = Number(
        caseStudy.totalMarks || 0
    );


    if (!Number.isFinite(obtained)) {
        throw new Error("Invalid marks obtained.");
    }


    if (obtained < 0 || obtained > maximum) {

        throw new Error(
            `Marks must be between 0 and ${maximum}.`
        );
    }


    caseStudy.marksObtained = obtained;


    if (
        teacherFeedback !== undefined &&
        teacherFeedback !== null
    ) {

        caseStudy.teacherFeedback =
            String(teacherFeedback).trim();
    }


    assessment.status = "UNDER_REVIEW";


    await assessment.save();

    return assessment;
}


/* ============================================================
   FINAL SCORE
============================================================ */

/**
 * Calculate final assessment score after all case studies
 * have been evaluated.
 */
async function finalizeAssessment(assessmentId) {

    const assessment = await PublicAssessment.findOne({
        assessmentId: assessmentId.trim().toUpperCase()
    });

    if (!assessment) {
        throw new Error("Assessment not found.");
    }


    /*
     * Check case-study evaluation.
     */
    let caseStudyScore = 0;

    let caseStudiesPending = false;


    for (const caseStudy of assessment.caseStudies || []) {

        const maximum =
            Number(caseStudy.totalMarks || 0);

        const obtained =
            Number(caseStudy.marksObtained);


        if (
            !Number.isFinite(obtained) ||
            obtained < 0 ||
            obtained > maximum
        ) {

            caseStudiesPending = true;

        } else {

            caseStudyScore += obtained;
        }
    }


    if (caseStudiesPending) {

        throw new Error(
            "All case studies must be evaluated before finalizing the assessment."
        );
    }


    const mcqScore =
        Number(assessment.scores?.mcq || 0);


    const totalScore =
        mcqScore + caseStudyScore;


    const maxMarks =
        Number(assessment.scores?.max || 0);


    const percentage =
        maxMarks > 0
            ? Number(
                ((totalScore / maxMarks) * 100)
                    .toFixed(2)
            )
            : 0;


    assessment.scores.mcq = mcqScore;

    assessment.scores.caseStudy = caseStudyScore;

    assessment.scores.total = totalScore;

    assessment.scores.max = maxMarks;

    assessment.scores.percentage = percentage;


    assessment.status = "FINALIZED";


    await assessment.save();

    return assessment;
}


/* ============================================================
   STATUS HELPERS
============================================================ */

/**
 * Move assessment to a specific status.
 *
 * This is intentionally restricted so a caller cannot
 * arbitrarily write an invalid status.
 */
async function updateAssessmentStatus(
    assessmentId,
    newStatus
) {

    const validStatuses = [
        "CREATED",
        "IN_PROGRESS",
        "MCQ_COMPLETED",
        "CASE_STUDY_PENDING",
        "SUBMITTED",
        "UNDER_REVIEW",
        "EVALUATED",
        "FINALIZED"
    ];


    if (!validStatuses.includes(newStatus)) {

        throw new Error(
            `Invalid assessment status: ${newStatus}`
        );
    }


    const assessment = await PublicAssessment.findOne({
        assessmentId: assessmentId.trim().toUpperCase()
    });


    if (!assessment) {
        throw new Error("Assessment not found.");
    }


    assessment.status = newStatus;


    await assessment.save();

    return assessment;
}


/* ============================================================
   EXPORTS
============================================================ */

module.exports = {

    generateStudentPrefix,

    generateAssessmentId,

    normalizeGrade,

    normalizeSubject,

    normalizeSplitUps,

    validateSelectedChapters,

    createAssessment,

    getAssessmentById,

    getAssessmentByObjectId,

    attachGeneratedQuestions,

    submitMCQAnswers,

    attachCaseStudyDocuments,

    saveCaseStudyMarks,

    finalizeAssessment,

    updateAssessmentStatus

};