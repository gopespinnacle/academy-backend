const mongoose = require("mongoose");
const AssessmentCurriculum = require("../models/AssessmentCurriculum");

const DEFAULT_ACADEMIC_YEAR = "2026-27";

/* =========================================================
   NORMALIZATION HELPERS
========================================================= */

function normalizeString(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}

function normalizeAcademicYear(value) {
    const year = normalizeString(value);
    return year || DEFAULT_ACADEMIC_YEAR;
}

function normalizeGrade(value) {
    const grade = normalizeString(value);

    if (!grade) {
        return "";
    }

    return grade
        .replace(/^class\s*/i, "")
        .replace(/^grade\s*/i, "")
        .trim();
}

function normalizeBoard(value) {
    return normalizeString(value);
}

function normalizeCurriculum(value) {
    return normalizeString(value);
}

function normalizeSubject(value) {
    return normalizeString(value);
}

function normalizeSplitUps(value) {
    if (value === undefined || value === null || value === "") {
        return [];
    }

    if (Array.isArray(value)) {
        return value
            .map(item => normalizeString(item))
            .filter(Boolean);
    }

    return [normalizeString(value)].filter(Boolean);
}

function normalizeChapterIds(value) {
    if (value === undefined || value === null) {
        return [];
    }

    const values = Array.isArray(value) ? value : [value];

    return values
        .map(item => normalizeString(item))
        .filter(Boolean);
}

/* =========================================================
   BASE FILTER
========================================================= */

function buildBaseFilter({
    board,
    curriculum,
    academicYear,
    grade,
    subject
}) {
    const filter = {
        active: true
    };

    const normalizedBoard = normalizeBoard(board);
    const normalizedCurriculum = normalizeCurriculum(curriculum);
    const normalizedAcademicYear = normalizeAcademicYear(academicYear);
    const normalizedGrade = normalizeGrade(grade);
    const normalizedSubject = normalizeSubject(subject);

    if (normalizedBoard) {
        filter.board = normalizedBoard;
    }

    if (normalizedCurriculum) {
        filter.curriculum = normalizedCurriculum;
    }

    if (normalizedAcademicYear) {
        filter.academicYear = normalizedAcademicYear;
    }

    if (normalizedGrade) {
        filter.grade = normalizedGrade;
    }

    if (normalizedSubject) {
        filter.subject = normalizedSubject;
    }

    return filter;
}

/* =========================================================
   TRACKS
   Board + Curriculum + Academic Year
========================================================= */

async function getTracks(options = {}) {
    const filter = {
        active: true
    };

    if (options.academicYear) {
        filter.academicYear = normalizeAcademicYear(options.academicYear);
    }

    if (options.board) {
        filter.board = normalizeBoard(options.board);
    }

    if (options.curriculum) {
        filter.curriculum = normalizeCurriculum(options.curriculum);
    }

    const tracks = await AssessmentCurriculum.aggregate([
        {
            $match: filter
        },
        {
            $group: {
                _id: {
                    board: "$board",
                    curriculum: "$curriculum",
                    academicYear: "$academicYear"
                }
            }
        },
        {
            $project: {
                _id: 0,
                board: "$_id.board",
                curriculum: "$_id.curriculum",
                academicYear: "$_id.academicYear"
            }
        },
        {
            $sort: {
                board: 1,
                curriculum: 1,
                academicYear: -1
            }
        }
    ]);

    return tracks;
}

/* =========================================================
   GRADES
========================================================= */

async function getGrades({
    board,
    curriculum,
    academicYear
}) {
    if (!normalizeBoard(board)) {
        throw new Error("Board is required.");
    }

    if (!normalizeCurriculum(curriculum)) {
        throw new Error("Curriculum is required.");
    }

    const filter = buildBaseFilter({
        board,
        curriculum,
        academicYear
    });

    const grades = await AssessmentCurriculum.distinct(
        "grade",
        filter
    );

    return grades
        .map(normalizeGrade)
        .filter(Boolean)
        .sort((a, b) => {
            const aNumber = parseInt(a, 10);
            const bNumber = parseInt(b, 10);

            if (!Number.isNaN(aNumber) && !Number.isNaN(bNumber)) {
                return aNumber - bNumber;
            }

            return a.localeCompare(b);
        });
}

/* =========================================================
   SUBJECTS
========================================================= */

async function getSubjects({
    board,
    curriculum,
    academicYear,
    grade
}) {
    if (!normalizeBoard(board)) {
        throw new Error("Board is required.");
    }

    if (!normalizeCurriculum(curriculum)) {
        throw new Error("Curriculum is required.");
    }

    if (!normalizeGrade(grade)) {
        throw new Error("Grade is required.");
    }

    const filter = buildBaseFilter({
        board,
        curriculum,
        academicYear,
        grade
    });

    const subjects = await AssessmentCurriculum.distinct(
        "subject",
        filter
    );

    return subjects
        .map(normalizeSubject)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b));
}

/* =========================================================
   SPLIT-UPS
   Example:
   Term 1 / Term 2
   Unit 1 / Unit 2
   Semester 1 / Semester 2
   etc.

   The service does NOT assume any particular structure.
========================================================= */

async function getSplitUps({
    board,
    curriculum,
    academicYear,
    grade,
    subject
}) {
    if (!normalizeBoard(board)) {
        throw new Error("Board is required.");
    }

    if (!normalizeCurriculum(curriculum)) {
        throw new Error("Curriculum is required.");
    }

    if (!normalizeGrade(grade)) {
        throw new Error("Grade is required.");
    }

    if (!normalizeSubject(subject)) {
        throw new Error("Subject is required.");
    }

    const filter = buildBaseFilter({
        board,
        curriculum,
        academicYear,
        grade,
        subject
    });

    const records = await AssessmentCurriculum.find(
        filter
    )
        .select("splitUp")
        .lean();

    const splitUps = new Set();

    for (const record of records) {
        if (Array.isArray(record.splitUp)) {
            record.splitUp.forEach(item => {
                const value = normalizeString(item);

                if (value) {
                    splitUps.add(value);
                }
            });
        } else {
            const value = normalizeString(record.splitUp);

            if (value) {
                splitUps.add(value);
            }
        }
    }

    return Array.from(splitUps).sort((a, b) =>
        a.localeCompare(b, undefined, {
            numeric: true,
            sensitivity: "base"
        })
    );
}

/* =========================================================
   CHAPTERS
========================================================= */

async function getChapters({
    board,
    curriculum,
    academicYear,
    grade,
    subject,
    splitUps
}) {
    if (!normalizeBoard(board)) {
        throw new Error("Board is required.");
    }

    if (!normalizeCurriculum(curriculum)) {
        throw new Error("Curriculum is required.");
    }

    if (!normalizeGrade(grade)) {
        throw new Error("Grade is required.");
    }

    if (!normalizeSubject(subject)) {
        throw new Error("Subject is required.");
    }

    const normalizedSplitUps = normalizeSplitUps(splitUps);

    const filter = buildBaseFilter({
        board,
        curriculum,
        academicYear,
        grade,
        subject
    });

    /*
    =========================================================
    SPLIT-UP MATCHING

    Treat these as equivalent:
        -  Hyphen
        –  En dash
        —  Em dash

    This prevents curriculum lookup failures caused by
    different dash characters in browser/UI/database values.
    =========================================================
    */

    if (normalizedSplitUps.length > 0) {

        const splitUpRegexes = normalizedSplitUps.map(value => {

    const parts = normalizeString(value).split(/[-–—]/);

    const escapedParts = parts.map(part =>
        part.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&"
        )
    );

    const dashNormalized =
        escapedParts.join("[-–—]");

    return new RegExp(
        `^${dashNormalized}$`,
        "i"
    );
});

        filter.$or = [
            {
                splitUp: {
                    $in: splitUpRegexes
                }
            },
            {
                splitUp: {
                    $elemMatch: {
                        $in: splitUpRegexes
                    }
                }
            }
        ];
    }

    const chapters = await AssessmentCurriculum.find(filter)
        .select(
            "_id board curriculum academicYear grade subject splitUp chapterNumber chapterName concepts active"
        )
        .sort({
            chapterNumber: 1,
            chapterName: 1
        })
        .lean();

    return chapters;
}

/* =========================================================
   CHAPTER DETAILS
========================================================= */

async function getChapterDetails({
    board,
    curriculum,
    academicYear,
    grade,
    subject,
    chapterIds
}) {
    if (!normalizeBoard(board)) {
        throw new Error("Board is required.");
    }

    if (!normalizeCurriculum(curriculum)) {
        throw new Error("Curriculum is required.");
    }

    if (!normalizeGrade(grade)) {
        throw new Error("Grade is required.");
    }

    if (!normalizeSubject(subject)) {
        throw new Error("Subject is required.");
    }

    const ids = normalizeChapterIds(chapterIds);

    if (ids.length === 0) {
        throw new Error("At least one chapter ID is required.");
    }

    const invalidIds = ids.filter(
        id => !mongoose.Types.ObjectId.isValid(id)
    );

    if (invalidIds.length > 0) {
        throw new Error(
            `Invalid chapter ID: ${invalidIds[0]}`
        );
    }

    const filter = buildBaseFilter({
        board,
        curriculum,
        academicYear,
        grade,
        subject
    });

    filter._id = {
        $in: ids.map(id => new mongoose.Types.ObjectId(id))
    };

    const chapters = await AssessmentCurriculum.find(filter)
        .sort({
            chapterNumber: 1,
            chapterName: 1
        })
        .lean();

    return chapters;
}

/* =========================================================
   VALIDATE SELECTED CHAPTERS
========================================================= */

async function validateSelectedChapters({
    board,
    curriculum,
    academicYear,
    grade,
    subject,
    splitUps,
    chapterIds
}) {
    const ids = normalizeChapterIds(chapterIds);

    if (ids.length === 0) {
        throw new Error(
            "At least one chapter must be selected."
        );
    }

    const chapters = await getChapterDetails({
        board,
        curriculum,
        academicYear,
        grade,
        subject,
        chapterIds: ids
    });

    if (chapters.length !== ids.length) {
        const foundIds = new Set(
            chapters.map(chapter =>
                String(chapter._id)
            )
        );

        const missingIds = ids.filter(
            id => !foundIds.has(String(id))
        );

        throw new Error(
            `One or more selected chapters are not available for the selected curriculum: ${missingIds.join(", ")}`
        );
    }

    const normalizedSplitUps = normalizeSplitUps(splitUps);

    if (normalizedSplitUps.length > 0) {
        const invalidChapters = chapters.filter(chapter => {
            const chapterSplitUps = Array.isArray(
                chapter.splitUp
            )
                ? chapter.splitUp.map(normalizeString)
                : [normalizeString(chapter.splitUp)];

            return !normalizedSplitUps.some(splitUp =>
                chapterSplitUps.includes(splitUp)
            );
        });

        if (invalidChapters.length > 0) {
            throw new Error(
                "One or more selected chapters do not belong to the selected split-up."
            );
        }
    }

    return {
        valid: true,
        chapters
    };
}

/* =========================================================
   CURRICULUM SUMMARY
========================================================= */

async function getCurriculumSummary({
    board,
    curriculum,
    academicYear,
    grade,
    subject
}) {
    if (!normalizeBoard(board)) {
        throw new Error("Board is required.");
    }

    if (!normalizeCurriculum(curriculum)) {
        throw new Error("Curriculum is required.");
    }

    const filter = buildBaseFilter({
        board,
        curriculum,
        academicYear,
        grade,
        subject
    });

    const [
        grades,
        subjects,
        splitUps,
        chapterCount
    ] = await Promise.all([
        AssessmentCurriculum.distinct(
            "grade",
            filter
        ),

        AssessmentCurriculum.distinct(
            "subject",
            filter
        ),

        AssessmentCurriculum.distinct(
            "splitUp",
            filter
        ),

        AssessmentCurriculum.countDocuments(filter)
    ]);

    return {
        board: normalizeBoard(board),
        curriculum: normalizeCurriculum(curriculum),
        academicYear: normalizeAcademicYear(academicYear),
        grade: normalizeGrade(grade) || null,
        subject: normalizeSubject(subject) || null,

        grades: grades
            .map(normalizeGrade)
            .filter(Boolean)
            .sort((a, b) => {
                const aNumber = parseInt(a, 10);
                const bNumber = parseInt(b, 10);

                if (
                    !Number.isNaN(aNumber) &&
                    !Number.isNaN(bNumber)
                ) {
                    return aNumber - bNumber;
                }

                return a.localeCompare(b);
            }),

        subjects: subjects
            .map(normalizeSubject)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b)),

        splitUps: splitUps
            .flatMap(value =>
                Array.isArray(value) ? value : [value]
            )
            .map(normalizeString)
            .filter(Boolean)
            .filter(
                (value, index, array) =>
                    array.indexOf(value) === index
            )
            .sort((a, b) => a.localeCompare(b)),

        chapterCount
    };
}

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
    DEFAULT_ACADEMIC_YEAR,

    normalizeString,
    normalizeAcademicYear,
    normalizeGrade,
    normalizeBoard,
    normalizeCurriculum,
    normalizeSubject,
    normalizeSplitUps,
    normalizeChapterIds,

    buildBaseFilter,

    getTracks,
    getGrades,
    getSubjects,
    getSplitUps,
    getChapters,
    getChapterDetails,

    validateSelectedChapters,
    getCurriculumSummary
};