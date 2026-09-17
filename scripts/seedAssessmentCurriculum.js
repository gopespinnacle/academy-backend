require("dotenv").config();

const mongoose = require("mongoose");

const AssessmentCurriculum = require("../models/AssessmentCurriculum");

const curriculumData = require("./assessmentCurriculumData");


/* =========================================================
   CONFIGURATION
========================================================= */

const DEFAULT_ACADEMIC_YEAR = "2026-27";


/* =========================================================
   READ MASTER DATA
========================================================= */

function loadMasterData() {

    if (!curriculumData) {
        throw new Error(
            "assessmentCurriculumData.js could not be loaded."
        );
    }


    /*
    Expected structure:

    {
        records: [...],
        curriculumTracks: [...],
        supportedGrades: [...],
        curriculumRecord: function,
        validateMasterData: function
    }
    */

    const records = curriculumData.records;

    if (!Array.isArray(records)) {
        throw new Error(
            "assessmentCurriculumData.records must be an array."
        );
    }


    return records;
}


/* =========================================================
   VALIDATE MASTER DATA
========================================================= */

function validateMasterData(records) {

    if (
        typeof curriculumData.validateMasterData !==
        "function"
    ) {
        throw new Error(
            "validateMasterData() was not found in assessmentCurriculumData.js."
        );
    }


    /*
    First run the validation supplied by the master
    curriculum data file.
    */

    curriculumData.validateMasterData(records);


    /*
    Additional seed-level validation.
    */

    const errors = [];


    records.forEach((record, index) => {

        const recordNumber = index + 1;


        /* ---------------------------------------------
           Grade
        --------------------------------------------- */

        const grade = Number(record.grade);

        if (
            Number.isNaN(grade) ||
            grade < 3 ||
            grade > 12
        ) {

            errors.push(
                `Record ${recordNumber}: grade must be between 3 and 12.`
            );

        }


        /* ---------------------------------------------
           Academic Year
        --------------------------------------------- */

        if (
            !record.academicYear ||
            String(record.academicYear).trim() === ""
        ) {

            errors.push(
                `Record ${recordNumber}: academicYear is required.`
            );

        }


        /* ---------------------------------------------
           Board
        --------------------------------------------- */

        if (
            !record.board ||
            String(record.board).trim() === ""
        ) {

            errors.push(
                `Record ${recordNumber}: board is required.`
            );

        }


        /* ---------------------------------------------
           Curriculum
        --------------------------------------------- */

        if (
            !record.curriculum ||
            String(record.curriculum).trim() === ""
        ) {

            errors.push(
                `Record ${recordNumber}: curriculum is required.`
            );

        }


        /* ---------------------------------------------
           Subject
        --------------------------------------------- */

        if (
            !record.subject ||
            String(record.subject).trim() === ""
        ) {

            errors.push(
                `Record ${recordNumber}: subject is required.`
            );

        }


        /* ---------------------------------------------
           Chapter
        --------------------------------------------- */

        if (
            !record.chapterName ||
            String(record.chapterName).trim() === ""
        ) {

            errors.push(
                `Record ${recordNumber}: chapterName is required.`
            );

        }


        /* ---------------------------------------------
           Concepts
        --------------------------------------------- */

        if (
            record.concepts !== undefined &&
            !Array.isArray(record.concepts)
        ) {

            errors.push(
                `Record ${recordNumber}: concepts must be an array.`
            );

        }

    });


    if (errors.length > 0) {

        throw new Error(
            "\nMASTER CURRICULUM VALIDATION FAILED:\n\n" +
            errors.join("\n")
        );

    }


    return true;
}


/* =========================================================
   NORMALIZE STRING
========================================================= */

function normalizeString(value) {

    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}


/* =========================================================
   NORMALIZE RECORD
========================================================= */

function normalizeRecord(record) {

    return {

        board:
            normalizeString(record.board),

        curriculum:
            normalizeString(record.curriculum),

        academicYear:
            normalizeString(
                record.academicYear
            ) ||
            DEFAULT_ACADEMIC_YEAR,

        grade:
            normalizeString(record.grade)
                .replace(/^class\s*/i, "")
                .replace(/^grade\s*/i, "")
                .trim(),

        subject:
            normalizeString(record.subject),

        splitUp:
            Array.isArray(record.splitUp)
                ? record.splitUp
                    .map(normalizeString)
                    .filter(Boolean)
                : normalizeString(
                    record.splitUp
                ),

        chapterNumber:
            record.chapterNumber !==
                undefined &&
            record.chapterNumber !==
                null &&
            record.chapterNumber !== ""
                ? Number(
                    record.chapterNumber
                )
                : null,

        chapterName:
            normalizeString(
                record.chapterName
            ),

        concepts:
            Array.isArray(
                record.concepts
            )
                ? record.concepts
                : [],

        active:
            record.active === undefined
                ? true
                : Boolean(record.active)

    };
}


/* =========================================================
   CREATE UNIQUE KEY
========================================================= */

function createRecordKey(record) {

    const splitUp =
        Array.isArray(record.splitUp)
            ? record.splitUp.join("|")
            : record.splitUp;


    return [

        record.board,

        record.curriculum,

        record.academicYear,

        record.grade,

        record.subject,

        splitUp,

        record.chapterNumber !== null
            ? record.chapterNumber
            : "",

        record.chapterName

    ]
        .map(value =>
            normalizeString(value)
                .toLowerCase()
        )
        .join("::");
}


/* =========================================================
   CHECK DUPLICATES
========================================================= */

function checkDuplicates(records) {

    const seen = new Set();

    const duplicates = [];


    records.forEach((record, index) => {

        const key =
            createRecordKey(record);


        if (seen.has(key)) {

            duplicates.push(
                `Duplicate record at position ${
                    index + 1
                }: ${record.board} → ${record.curriculum} → Grade ${record.grade} → ${record.subject} → ${record.chapterName}`
            );

        }


        seen.add(key);

    });


    if (duplicates.length > 0) {

        throw new Error(
            "\nDUPLICATE CURRICULUM RECORDS FOUND:\n\n" +
            duplicates.join("\n")
        );

    }


    return true;
}


/* =========================================================
   DISPLAY COVERAGE
========================================================= */

function displayCoverage(records) {

    const coverage = new Map();


    records.forEach(record => {

        const trackKey = [
            record.board,
            record.curriculum,
            record.academicYear
        ].join(" → ");


        if (!coverage.has(trackKey)) {

            coverage.set(
                trackKey,
                {
                    grades: new Set(),
                    subjects: new Set(),
                    chapters: 0
                }
            );

        }


        const item =
            coverage.get(trackKey);


        item.grades.add(
            record.grade
        );

        item.subjects.add(
            record.subject
        );

        item.chapters++;

    });


    console.log("");
    console.log(
        "=============================================="
    );
    console.log(
        "CURRICULUM COVERAGE"
    );
    console.log(
        "=============================================="
    );


    if (coverage.size === 0) {

        console.log(
            "No curriculum records currently loaded."
        );

    }


    for (
        const [track, data]
        of coverage.entries()
    ) {

        const grades =
            Array.from(
                data.grades
            ).sort((a, b) => {

                const aNumber =
                    Number(a);

                const bNumber =
                    Number(b);


                if (
                    !Number.isNaN(aNumber) &&
                    !Number.isNaN(bNumber)
                ) {
                    return (
                        aNumber -
                        bNumber
                    );
                }


                return String(a)
                    .localeCompare(
                        String(b)
                    );

            });


        console.log("");
        console.log(track);

        console.log(
            `Grades   : ${grades.join(", ")}`
        );

        console.log(
            `Subjects : ${data.subjects.size}`
        );

        console.log(
            `Chapters : ${data.chapters}`
        );

    }


    console.log("");
    console.log(
        "=============================================="
    );

    console.log(
        `TOTAL RECORDS: ${records.length}`
    );

    console.log(
        "=============================================="
    );

    console.log("");

}


/* =========================================================
   SEED DATABASE
========================================================= */

async function seedCurriculum(records) {

    let inserted = 0;

    let updated = 0;


    for (
        const record
        of records
    ) {

        /*
        We identify the same curriculum chapter using
        the complete curriculum hierarchy.
        */

        const filter = {

            board:
                record.board,

            curriculum:
                record.curriculum,

            academicYear:
                record.academicYear,

            grade:
                record.grade,

            subject:
                record.subject,

            chapterName:
                record.chapterName

        };


        /*
        If chapterNumber exists, include it in the
        identity as well.
        */

        if (
            record.chapterNumber !==
                null &&
            record.chapterNumber !==
                undefined
        ) {

            filter.chapterNumber =
                record.chapterNumber;

        }


        /*
        splitUp may be either a string or an array
        depending on the curriculum.
        */

        if (
            Array.isArray(
                record.splitUp
            )
        ) {

            filter.splitUp =
                record.splitUp;

        } else {

            filter.splitUp =
                record.splitUp;

        }


        const existing =
            await AssessmentCurriculum
                .findOne(filter)
                .select("_id");


        if (existing) {

            await AssessmentCurriculum
                .updateOne(
                    {
                        _id:
                            existing._id
                    },
                    {
                        $set: record
                    }
                );


            updated++;

        } else {

            await AssessmentCurriculum
                .create(record);


            inserted++;

        }

    }


    return {
        inserted,
        updated,
        total:
            inserted + updated
    };

}


/* =========================================================
   DATABASE CONNECTION
========================================================= */

async function connectDatabase() {

    const mongoUri =
        process.env.MONGODB_URI ||
        process.env.MONGO_URI;


    if (!mongoUri) {

        throw new Error(
            "MongoDB connection string not found. Please set MONGODB_URI or MONGO_URI."
        );

    }


    await mongoose.connect(
        mongoUri
    );


    console.log(
        "MongoDB connected."
    );

}


/* =========================================================
   MAIN
========================================================= */

async function main() {

    try {

        console.log("");
        console.log(
            "=============================================="
        );
        console.log(
            "GOPES PINNACLE ACADEMY"
        );
        console.log(
            "ASSESSMENT CURRICULUM SEED"
        );
        console.log(
            "=============================================="
        );
        console.log("");


        /*
        Load master data.
        */

        const rawRecords =
            loadMasterData();


        console.log(
            `Loaded ${rawRecords.length} master curriculum records.`
        );


        /*
        Validate BEFORE connecting to MongoDB.
        */

        validateMasterData(
            rawRecords
        );


        /*
        Normalize records.
        */

        const records =
            rawRecords.map(
                normalizeRecord
            );


        /*
        Check duplicates BEFORE touching database.
        */

        checkDuplicates(
            records
        );


        /*
        Display what is about to be processed.
        */

        displayCoverage(
            records
        );


        /*
        Stop safely if there is no data.
        */

        if (records.length === 0) {

            console.log(
                "No records to seed."
            );

            console.log(
                "Database was NOT modified."
            );

            process.exit(0);

        }


        /*
        Connect to MongoDB.
        */

        await connectDatabase();


        /*
        Seed.
        */

        const result =
            await seedCurriculum(
                records
            );


        console.log("");
        console.log(
            "=============================================="
        );
        console.log(
            "CURRICULUM SEED COMPLETED"
        );
        console.log(
            "=============================================="
        );

        console.log(
            `Inserted : ${result.inserted}`
        );

        console.log(
            `Updated  : ${result.updated}`
        );

        console.log(
            `Total    : ${result.total}`
        );

        console.log(
            "=============================================="
        );
        console.log("");


        await mongoose.disconnect();


        console.log(
            "MongoDB connection closed."
        );


        process.exit(0);

    } catch (error) {

        console.error("");
        console.error(
            "=============================================="
        );
        console.error(
            "CURRICULUM SEED FAILED"
        );
        console.error(
            "=============================================="
        );

        console.error(
            error.message
        );

        console.error(
            "=============================================="
        );
        console.error("");


        try {

            await mongoose.disconnect();

        } catch (_) {
            // Ignore disconnect errors.
        }


        process.exit(1);

    }

}


/* =========================================================
   START
========================================================= */

main();