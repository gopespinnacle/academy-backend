const assessmentCurriculumService = require("../services/assessmentCurriculumService");

/**
 * ---------------------------------------------------------
 * GET SUPPORTED CURRICULUM TRACKS
 * ---------------------------------------------------------
 *
 * GET
 * /api/assessment-curriculum/tracks
 *
 * Example response:
 *
 * [
 *   {
 *     board: "CBSE",
 *     curriculum: "NCERT",
 *     academicYear: "2026-27",
 *     label: "CBSE / NCERT"
 *   },
 *   {
 *     board: "Tamil Nadu State Board",
 *     curriculum: "Samacheer Kalvi",
 *     academicYear: "2026-27",
 *     label: "Tamil Nadu State Board / Samacheer Kalvi"
 *   }
 * ]
 */

exports.getTracks = async (req, res) => {
    try {
        const tracks =
            await assessmentCurriculumService.getTracks();

        return res.json({
            success: true,
            tracks
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT CURRICULUM TRACKS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load curriculum tracks"
        });
    }
};

/**
 * ---------------------------------------------------------
 * GET GRADES
 * ---------------------------------------------------------
 *
 * Query:
 *
 * ?board=CBSE
 * &curriculum=NCERT
 * &academicYear=2026-27
 */

exports.getGrades = async (req, res) => {
    try {
        const {
            board,
            curriculum,
            academicYear
        } = req.query;

        const grades =
            await assessmentCurriculumService.getGrades({
                board,
                curriculum,
                academicYear
            });

        return res.json({
            success: true,
            board,
            curriculum,
            academicYear:
                academicYear ||
                assessmentCurriculumService.DEFAULT_ACADEMIC_YEAR,
            grades
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT GRADES ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ---------------------------------------------------------
 * GET SUBJECTS
 * ---------------------------------------------------------
 *
 * Query:
 *
 * ?board=CBSE
 * &curriculum=NCERT
 * &academicYear=2026-27
 * &grade=3
 */

exports.getSubjects = async (req, res) => {
    try {
        const {
            board,
            curriculum,
            academicYear,
            grade
        } = req.query;

        const subjects =
            await assessmentCurriculumService.getSubjects({
                board,
                curriculum,
                academicYear,
                grade
            });

        return res.json({
            success: true,
            board,
            curriculum,
            academicYear:
                academicYear ||
                assessmentCurriculumService.DEFAULT_ACADEMIC_YEAR,
            grade,
            subjects
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT SUBJECTS ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ---------------------------------------------------------
 * GET SPLIT-UPS
 * ---------------------------------------------------------
 *
 * Query:
 *
 * ?board=Tamil%20Nadu%20State%20Board
 * &curriculum=Samacheer%20Kalvi
 * &academicYear=2026-27
 * &grade=3
 * &subject=Tamil
 */

exports.getSplitUps = async (req, res) => {
    try {
        const {
            board,
            curriculum,
            academicYear,
            grade,
            subject
        } = req.query;

        const splitUps =
            await assessmentCurriculumService.getSplitUps({
                board,
                curriculum,
                academicYear,
                grade,
                subject
            });

        return res.json({
            success: true,
            board,
            curriculum,
            academicYear:
                academicYear ||
                assessmentCurriculumService.DEFAULT_ACADEMIC_YEAR,
            grade,
            subject,
            splitUps
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT SPLIT-UPS ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ---------------------------------------------------------
 * GET CHAPTERS
 * ---------------------------------------------------------
 *
 * Query:
 *
 * ?board=CBSE
 * &curriculum=NCERT
 * &academicYear=2026-27
 * &grade=3
 * &subject=Environmental%20Studies
 * &splitUps=Unit%201
 *
 * Multiple split-ups can also be supplied:
 *
 * &splitUps=Term%201,Term%202
 */

exports.getChapters = async (req, res) => {
    try {
        const {
            board,
            curriculum,
            academicYear,
            grade,
            subject,
            splitUps
        } = req.query;

        const chapters =
            await assessmentCurriculumService.getChapters({
                board,
                curriculum,
                academicYear,
                grade,
                subject,
                splitUps
            });

        return res.json({
            success: true,
            board,
            curriculum,
            academicYear:
                academicYear ||
                assessmentCurriculumService.DEFAULT_ACADEMIC_YEAR,
            grade,
            subject,
            splitUps: Array.isArray(splitUps)
                ? splitUps
                : splitUps
                    ? String(splitUps)
                        .split(",")
                        .map(item => item.trim())
                        .filter(Boolean)
                    : [],
            chapters
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT CHAPTERS ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ---------------------------------------------------------
 * POST CHAPTER DETAILS
 * ---------------------------------------------------------
 *
 * Body:
 *
 * {
 *   "board": "Tamil Nadu State Board",
 *   "curriculum": "Samacheer Kalvi",
 *   "academicYear": "2026-27",
 *   "grade": "3",
 *   "subject": "Tamil",
 *   "chapterIds": [
 *      "..."
 *   ]
 * }
 */

exports.getChapterDetails = async (req, res) => {
    try {
        const {
            board,
            curriculum,
            academicYear,
            grade,
            subject,
            chapterIds
        } = req.body;

        const chapters =
            await assessmentCurriculumService.getChapterDetails({
                board,
                curriculum,
                academicYear,
                grade,
                subject,
                chapterIds
            });

        return res.json({
            success: true,
            board,
            curriculum,
            academicYear:
                academicYear ||
                assessmentCurriculumService.DEFAULT_ACADEMIC_YEAR,
            grade,
            subject,
            chapters
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT CHAPTER DETAILS ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * ---------------------------------------------------------
 * GET CURRICULUM SUMMARY
 * ---------------------------------------------------------
 *
 * Useful for founder/admin testing.
 *
 * Query:
 *
 * ?board=CBSE
 * &curriculum=NCERT
 * &academicYear=2026-27
 * &grade=3
 *
 * Optional:
 *
 * &subject=Environmental%20Studies
 */

exports.getCurriculumSummary = async (req, res) => {
    try {
        const {
            board,
            curriculum,
            academicYear,
            grade,
            subject
        } = req.query;

        const summary =
            await assessmentCurriculumService.getCurriculumSummary({
                board,
                curriculum,
                academicYear,
                grade,
                subject
            });

        return res.json({
            success: true,
            summary
        });
    } catch (error) {
        console.error(
            "GET ASSESSMENT CURRICULUM SUMMARY ERROR:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};