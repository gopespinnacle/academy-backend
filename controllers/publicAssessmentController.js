/**
 * Gopes Pinnacle Academy
 *
 * PUBLIC ASSESSMENT CONTROLLER
 *
 * This controller belongs ONLY to the new
 * "Your Child Assessment" feature.
 *
 * IMPORTANT:
 * ------------------------------------------------------------
 * DO NOT MODIFY:
 *
 * services/openAIService.js
 * models/User.js
 * existing controllers
 * existing routes
 *
 * AI is handled internally by:
 *
 * services/publicAssessmentAIService.js
 *
 * Business logic is handled by:
 *
 * services/publicAssessmentService.js
 *
 * Parent/student-facing responses must NEVER mention AI.
 */


/* ============================================================
   SERVICES
============================================================ */

const publicAssessmentService =
    require("../services/publicAssessmentService");

const publicAssessmentAIService =
    require("../services/publicAssessmentAIService");


/* ============================================================
   HELPER FUNCTIONS
============================================================ */

/**
 * Safely convert a value to a trimmed string.
 */
function cleanString(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}


/**
 * Convert split-up input into an array.
 *
 * Supports:
 *
 * ["Physics", "Chemistry"]
 *
 * or:
 *
 * "Physics,Chemistry"
 */
function normalizeSplitUps(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return [];
    }

    if (Array.isArray(value)) {

        return value
            .map(item => cleanString(item))
            .filter(Boolean);
    }

    return String(value)
        .split(",")
        .map(item => item.trim())
        .filter(Boolean);
}


/**
 * Validate email format.
 */
function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
    );
}


/**
 * Basic WhatsApp/mobile validation.
 *
 * We deliberately do not force a particular country code here,
 * because the public assessment may receive numbers in
 * different valid formats.
 */
function isValidWhatsAppNumber(number) {

    const cleaned =
        String(number || "")
            .replace(/[\s\-().]/g, "");

    return /^\+?[0-9]{8,15}$/.test(
        cleaned
    );
}


/**
 * Extract selected chapter information from the request.
 *
 * Expected preferred format:
 *
 * selectedChapters: [
 *     {
 *         curriculumId: "..."
 *     }
 * ]
 *
 * We also support a simple array of IDs.
 */
function normalizeSelectedChapters(
    selectedChapters
) {

    if (!Array.isArray(selectedChapters)) {
        return [];
    }

    return selectedChapters
        .map(chapter => {

            if (
                typeof chapter === "string"
            ) {

                return {
                    curriculumId:
                        chapter.trim()
                };
            }


            if (
                chapter &&
                typeof chapter === "object"
            ) {

                return {
                    curriculumId:
                        cleanString(
                            chapter.curriculumId
                        )
                };
            }


            return null;
        })
        .filter(
            chapter =>
                chapter &&
                chapter.curriculumId
        );
}


/**
 * Send a consistent success response.
 */
function success(
    res,
    data,
    statusCode = 200
) {

    return res.status(statusCode).json({

        success: true,

        ...data

    });
}


/**
 * Send a consistent error response.
 *
 * We intentionally do not expose internal AI/OpenAI
 * implementation details to the public website.
 */
function failure(
    res,
    error,
    statusCode = 400
) {

    console.error(
        "Public Assessment Controller Error:",
        error
    );


    let message =
        "Unable to process the assessment request.";


    /*
     * Known validation/business errors can safely be
     * returned to the frontend.
     */
    const knownMessages = [

        "Student name is required.",

        "Parent name is required.",

        "WhatsApp number is required.",

        "Parent email is required.",

        "Invalid parent email address.",

        "Invalid WhatsApp number.",

        "Grade is required.",

        "Subject is required.",

        "Please select at least one chapter.",

        "Selected chapters must be provided.",

        "Assessment not found.",

        "One or more selected chapters are not available in the current curriculum.",

        "The selected subject split-up does not match the selected chapters.",

        "Questions cannot be changed after the assessment has been submitted.",

        "Questions cannot be regenerated after assessment submission."

    ];


    if (
        error &&
        knownMessages.includes(
            error.message
        )
    ) {

        message = error.message;

    } else if (
        error &&
        typeof error.message === "string" &&
        (
            error.message.startsWith(
                "Invalid MCQ"
            ) ||
            error.message.startsWith(
                "MCQ"
            ) ||
            error.message.startsWith(
                "Case study"
            ) ||
            error.message.startsWith(
                "Expected "
            ) ||
            error.message.startsWith(
                "Duplicate"
            )
        )
    ) {

        /*
         * These errors are useful internally but should not
         * expose implementation details to a public user.
         */
        message =
            "The assessment could not be prepared correctly. Please try again.";

    } else if (
        error &&
        error.message
    ) {

        /*
         * Safe curriculum/business validation errors.
         */
        const safeErrorPatterns = [

            /required/i,
            /selected chapters/i,
            /curriculum/i,
            /assessment not found/i,
            /subject/i,
            /grade/i

        ];


        if (
            safeErrorPatterns.some(
                pattern =>
                    pattern.test(
                        error.message
                    )
            )
        ) {

            message =
                error.message;
        }
    }


    return res.status(statusCode).json({

        success: false,

        message

    });
}


/* ============================================================
   CREATE PUBLIC ASSESSMENT
============================================================ */

/**
 * POST /public-assessment/create
 *
 * Creates the assessment shell.
 *
 * This endpoint:
 *
 * 1. Receives parent/student information
 * 2. Receives grade + subject + split-up
 * 3. Receives selected curriculum chapter IDs
 * 4. Validates chapters
 * 5. Generates server-side assessment ID
 * 6. Creates PublicAssessment
 *
 * AI question generation is deliberately kept separate.
 */
exports.createAssessment =
    async function createAssessment(
        req,
        res
    ) {

        try {

            const {

                studentName,

                parentName,

                whatsappNumber,

                parentEmail,

                grade,

                subject,

                splitUps,

                selectedChapters,

                board,

                curriculum,

                academicYear

            } = req.body || {};


            /* ------------------------------------------------
               BASIC VALIDATION
            ------------------------------------------------ */

            const cleanStudentName =
                cleanString(studentName);

            const cleanParentName =
                cleanString(parentName);

            const cleanWhatsApp =
                cleanString(whatsappNumber);

            const cleanParentEmail =
                cleanString(parentEmail)
                    .toLowerCase();

            const cleanGrade =
                cleanString(grade);

            const cleanSubject =
                cleanString(subject);


            if (!cleanStudentName) {

                return failure(
                    res,
                    new Error(
                        "Student name is required."
                    )
                );
            }


            if (!cleanParentName) {

                return failure(
                    res,
                    new Error(
                        "Parent name is required."
                    )
                );
            }


            if (!cleanWhatsApp) {

                return failure(
                    res,
                    new Error(
                        "WhatsApp number is required."
                    )
                );
            }


            if (
                !isValidWhatsAppNumber(
                    cleanWhatsApp
                )
            ) {

                return failure(
                    res,
                    new Error(
                        "Invalid WhatsApp number."
                    )
                );
            }


            if (!cleanParentEmail) {

                return failure(
                    res,
                    new Error(
                        "Parent email is required."
                    )
                );
            }


            if (
                !isValidEmail(
                    cleanParentEmail
                )
            ) {

                return failure(
                    res,
                    new Error(
                        "Invalid parent email address."
                    )
                );
            }


            if (!cleanGrade) {

                return failure(
                    res,
                    new Error(
                        "Grade is required."
                    )
                );
            }


            if (!cleanSubject) {

                return failure(
                    res,
                    new Error(
                        "Subject is required."
                    )
                );
            }


            /* ------------------------------------------------
               NORMALIZE SPLIT-UPS
            ------------------------------------------------ */

            const normalizedSplitUps =
                normalizeSplitUps(
                    splitUps
                );


            /* ------------------------------------------------
               NORMALIZE SELECTED CHAPTERS
            ------------------------------------------------ */

            const normalizedChapters =
                normalizeSelectedChapters(
                    selectedChapters
                );


            if (
                normalizedChapters.length === 0
            ) {

                return failure(
                    res,
                    new Error(
                        "Please select at least one chapter."
                    )
                );
            }


            /* ------------------------------------------------
               CREATE ASSESSMENT
            ------------------------------------------------ */

            const assessment =
                await publicAssessmentService
                    .createAssessment({

                        studentName:
                            cleanStudentName,

                        parentName:
                            cleanParentName,

                        whatsappNumber:
                            cleanWhatsApp,

                        parentEmail:
                            cleanParentEmail,

                        grade:
                            cleanGrade,

                        subject:
                            cleanSubject,

                        splitUps:
                            normalizedSplitUps,

                        selectedChapters:
                            normalizedChapters,

                        board:
                            cleanString(board) ||
                            "CBSE",

                        curriculum:
                            cleanString(curriculum) ||
                            "NCERT",

                        academicYear:
                            cleanString(academicYear) ||
                            "2026-27"

                    });


            /* ------------------------------------------------
               PUBLIC RESPONSE
            ------------------------------------------------ */

            return success(
                res,
                {

                    message:
                        "Assessment created successfully.",

                    assessment: {

                        id:
                            assessment._id,

                        assessmentId:
                            assessment.assessmentId,

                        studentName:
                            assessment.studentName,

                        grade:
                            assessment.grade,

                        subject:
                            assessment.subject,

                        splitUps:
                            assessment.splitUps,

                        selectedChapters:
                            assessment.selectedChapters,

                        status:
                            assessment.status

                    }

                },
                201
            );


        } catch (error) {

            return failure(
                res,
                error,
                400
            );
        }
    };


/* ============================================================
   GENERATE ASSESSMENT QUESTIONS
============================================================ */

/**
 * POST /public-assessment/:assessmentId/generate
 *
 * Generates:
 *
 * MCQs
 * +
 * Case Studies
 *
 * using the NEW isolated AI service.
 *
 * The public user is NOT told that AI is involved.
 */
exports.generateQuestions =
    async function generateQuestions(
        req,
        res
    ) {

        try {

            const assessmentId =
                cleanString(
                    req.params.assessmentId
                );


            if (!assessmentId) {

                return failure(
                    res,
                    new Error(
                        "Assessment ID is required."
                    )
                );
            }


            /*
             * Optional counts.
             *
             * Defaults:
             * 20 MCQs
             * 2 Case Studies
             */
            const mcqCount =
                req.body &&
                req.body.mcqCount !== undefined
                    ? Number(
                        req.body.mcqCount
                    )
                    : 20;


            const caseStudyCount =
                req.body &&
                req.body.caseStudyCount !== undefined
                    ? Number(
                        req.body.caseStudyCount
                    )
                    : 2;


            if (
                !Number.isInteger(
                    mcqCount
                ) ||
                mcqCount < 1 ||
                mcqCount > 100
            ) {

                return failure(
                    res,
                    new Error(
                        "Invalid MCQ count."
                    )
                );
            }


            if (
                !Number.isInteger(
                    caseStudyCount
                ) ||
                caseStudyCount < 1 ||
                caseStudyCount > 20
            ) {

                return failure(
                    res,
                    new Error(
                        "Invalid case study count."
                    )
                );
            }


            /*
             * Generate and save.
             *
             * The AI service itself performs the hard
             * question-quality validation.
             */
            const assessment =
                await publicAssessmentAIService
                    .generateAndSaveAssessmentQuestions({

                        assessmentId,

                        mcqCount,

                        caseStudyCount

                    });


            /*
             * Return only the assessment content needed
             * by the student-facing page.
             *
             * Internal implementation details are omitted.
             */
            return success(
                res,
                {

                    message:
                        "Your assessment is ready.",

                    assessment: {

                        id:
                            assessment._id,

                        assessmentId:
                            assessment.assessmentId,

                        studentName:
                            assessment.studentName,

                        grade:
                            assessment.grade,

                        subject:
                            assessment.subject,

                        splitUps:
                            assessment.splitUps,

                        selectedChapters:
                            assessment.selectedChapters,

                        questions:
                            assessment.questions,

                        caseStudies:
                            assessment.caseStudies,

                        scores:
                            assessment.scores,

                        status:
                            assessment.status

                    }

                }
            );


        } catch (error) {

            /*
             * Do not expose OpenAI/API errors to the
             * parent/student.
             */
            console.error(
                "Assessment question generation failed:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "We could not prepare the assessment at this moment. Please try again."

            });
        }
    };


/* ============================================================
   GET ASSESSMENT
============================================================ */

/**
 * GET /public-assessment/:assessmentId
 *
 * Used when the student returns to an assessment.
 */
exports.getAssessment =
    async function getAssessment(
        req,
        res
    ) {

        try {

            const assessmentId =
                cleanString(
                    req.params.assessmentId
                );


            if (!assessmentId) {

                return failure(
                    res,
                    new Error(
                        "Assessment ID is required."
                    )
                );
            }


            const assessment =
                await publicAssessmentService
                    .getAssessmentById(
                        assessmentId
                    );


            return success(
                res,
                {

                    assessment

                }
            );


        } catch (error) {

            return failure(
                res,
                error,
                404
            );
        }
    };


/* ============================================================
   SUBMIT MCQ ANSWERS
============================================================ */

/**
 * POST /public-assessment/:assessmentId/mcq
 *
 * Receives MCQ answers from the student.
 *
 * MCQs are automatically evaluated.
 */
exports.submitMCQ =
    async function submitMCQ(
        req,
        res
    ) {

        try {

            const assessmentId =
                cleanString(
                    req.params.assessmentId
                );


            if (!assessmentId) {

                return failure(
                    res,
                    new Error(
                        "Assessment ID is required."
                    )
                );
            }


            const answers =
                req.body &&
                Array.isArray(
                    req.body.answers
                )
                    ? req.body.answers
                    : [];


            if (!answers.length) {

                return failure(
                    res,
                    new Error(
                        "MCQ answers must be provided."
                    )
                );
            }


            const assessment =
                await publicAssessmentService
                    .submitMCQAnswers(
                        assessmentId,
                        answers
                    );


            /*
             * IMPORTANT:
             *
             * If Case Studies exist, do NOT expose a final
             * score yet.
             *
             * Teacher evaluation is still required.
             */
            const hasCaseStudies =
                Array.isArray(
                    assessment.caseStudies
                ) &&
                assessment.caseStudies.length > 0;


            if (hasCaseStudies) {

                return success(
                    res,
                    {

                        message:
                            "Your answers have been submitted successfully. The remaining written responses will be reviewed by our academic team.",

                        assessment: {

                            assessmentId:
                                assessment.assessmentId,

                            status:
                                assessment.status,

                            mcqCompleted:
                                true,

                            caseStudyPending:
                                true

                        }

                    }
                );
            }


            /*
             * If there are no case studies, MCQ itself is the
             * complete assessment.
             */
            return success(
                res,
                {

                    message:
                        "Your assessment has been submitted successfully.",

                    assessment: {

                        assessmentId:
                            assessment.assessmentId,

                        status:
                            assessment.status,

                        mcqCompleted:
                            true

                    }

                }
            );


        } catch (error) {

            return failure(
                res,
                error,
                400
            );
        }
    };


/* ============================================================
   ATTACH CASE STUDY DOCUMENTS
============================================================ */

/**
 * POST /public-assessment/:assessmentId/case-study/:caseStudyId/documents
 *
 * The actual file upload/storage will be handled by the
 * assessment document layer.
 *
 * Once document IDs have been created, this endpoint links
 * those exact documents to the exact case study.
 */
exports.attachCaseStudyDocuments =
    async function attachCaseStudyDocuments(
        req,
        res
    ) {

        try {

            const assessmentId =
                cleanString(
                    req.params.assessmentId
                );


            const caseStudyId =
                cleanString(
                    req.params.caseStudyId
                );


            if (!assessmentId) {

                return failure(
                    res,
                    new Error(
                        "Assessment ID is required."
                    )
                );
            }


            if (!caseStudyId) {

                return failure(
                    res,
                    new Error(
                        "Case Study ID is required."
                    )
                );
            }


            const documentIds =
                req.body &&
                Array.isArray(
                    req.body.documentIds
                )
                    ? req.body.documentIds
                    : [];


            if (!documentIds.length) {

                return failure(
                    res,
                    new Error(
                        "At least one document is required."
                    )
                );
            }


            const assessment =
                await publicAssessmentService
                    .attachCaseStudyDocuments({

                        assessmentId,

                        caseStudyId,

                        documentIds

                    });


            return success(
                res,
                {

                    message:
                        "Your written answer document has been linked successfully.",

                    assessment: {

                        assessmentId:
                            assessment.assessmentId,

                        status:
                            assessment.status,

                        caseStudies:
                            assessment.caseStudies

                    }

                }
            );


        } catch (error) {

            return failure(
                res,
                error,
                400
            );
        }
    };


/* ============================================================
   SUBMIT COMPLETE ASSESSMENT
============================================================ */

/**
 * POST /public-assessment/:assessmentId/submit
 *
 * This is the final student submission endpoint.
 *
 * The controller checks whether all required case-study
 * documents have been attached.
 */
exports.submitAssessment =
    async function submitAssessment(
        req,
        res
    ) {

        try {

            const assessmentId =
                cleanString(
                    req.params.assessmentId
                );


            if (!assessmentId) {

                return failure(
                    res,
                    new Error(
                        "Assessment ID is required."
                    )
                );
            }


            const assessment =
                await publicAssessmentService
                    .getAssessmentById(
                        assessmentId
                    );


            /*
             * Ensure MCQs have been answered.
             */
            const mcqQuestions =
                (assessment.questions || [])
                    .filter(
                        question =>
                            String(
                                question.type
                            ).toUpperCase() === "MCQ"
                    );


            const submittedMCQAnswers =
                assessment.mcqAnswers || [];


            if (
                mcqQuestions.length > 0 &&
                submittedMCQAnswers.length === 0
            ) {

                return failure(
                    res,
                    new Error(
                        "Please complete the MCQ section before submitting the assessment."
                    )
                );
            }


            /*
             * Check Case Study documents.
             */
            const caseStudies =
                assessment.caseStudies || [];


            for (
                const caseStudy
                of caseStudies
            ) {

                const documents =
                    caseStudy.documentIds || [];


                if (
                    !documents.length
                ) {

                    return failure(
                        res,
                        new Error(
                            "Please upload the written answer for every case study before submitting."
                        )
                    );
                }
            }


            /*
             * Move assessment into submitted state.
             */
            const submittedAssessment =
                await publicAssessmentService
                    .updateAssessmentStatus(
                        assessmentId,
                        "SUBMITTED"
                    );


            /*
             * IMPORTANT:
             *
             * No final score is shown here when Case Studies
             * require teacher evaluation.
             */
            const requiresTeacherEvaluation =
                caseStudies.length > 0;


            return success(
                res,
                {

                    message:
                        requiresTeacherEvaluation

                            ? "Your assessment has been submitted successfully. Our expert academic team will analyse the assessment and identify the areas where your child should concentrate more."

                            : "Your assessment has been submitted successfully. Our expert academic team will analyse the assessment and identify the areas where your child should concentrate more.",

                    assessment: {

                        assessmentId:
                            submittedAssessment.assessmentId,

                        status:
                            submittedAssessment.status,

                        requiresTeacherEvaluation

                    }

                }
            );


        } catch (error) {

            return failure(
                res,
                error,
                400
            );
        }
    };


/* ============================================================
   PUBLIC ASSESSMENT STATUS
============================================================ */

/**
 * GET /public-assessment/:assessmentId/status
 *
 * Used by the public result/status page.
 *
 * Before teacher evaluation:
 *     Do NOT expose final score.
 *
 * After finalization:
 *     Score can be displayed.
 */
exports.getAssessmentStatus =
    async function getAssessmentStatus(
        req,
        res
    ) {

        try {

            const assessmentId =
                cleanString(
                    req.params.assessmentId
                );


            const assessment =
                await publicAssessmentService
                    .getAssessmentById(
                        assessmentId
                    );


            const finalized =
                assessment.status ===
                "FINALIZED";


            const response = {

                assessmentId:
                    assessment.assessmentId,

                studentName:
                    assessment.studentName,

                grade:
                    assessment.grade,

                subject:
                    assessment.subject,

                status:
                    assessment.status,

                finalized

            };


            /*
             * Only expose scores after finalization.
             */
            if (finalized) {

                response.scores = {

                    mcq:
                        assessment.scores?.mcq || 0,

                    caseStudy:
                        assessment.scores?.caseStudy || 0,

                    total:
                        assessment.scores?.total || 0,

                    max:
                        assessment.scores?.max || 0,

                    percentage:
                        assessment.scores?.percentage || 0

                };
            }


            return success(
                res,
                {

                    assessment: response

                }
            );


        } catch (error) {

            return failure(
                res,
                error,
                404
            );
        }
    };


/* ============================================================
   EXPORT SUMMARY
============================================================ */

/*
 * Exported controller methods:
 *
 * createAssessment
 * generateQuestions
 * getAssessment
 * submitMCQ
 * attachCaseStudyDocuments
 * submitAssessment
 * getAssessmentStatus
 *
 * These will later be connected to:
 *
 * routes/publicAssessmentRoutes.js
 *
 * Nothing else in the existing academy routing system
 * needs to be modified at this stage.
 */