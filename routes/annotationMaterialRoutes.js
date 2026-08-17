/*
===========================================================
GOPES PINNACLE ACADEMY
ANNOTATION MATERIAL ROUTES
===========================================================

Purpose:

Permanent learning materials created from
teacher annotation sessions.

Routes:

POST   /api/annotation-materials
PUT    /api/annotation-materials/:id
GET    /api/annotation-materials/teacher/:teacherId
GET    /api/annotation-materials/student/:studentId
GET    /api/annotation-materials/founder
GET    /api/annotation-materials/:id
===========================================================
*/

const express =
    require("express");

const router =
    express.Router();

const mongoose =
    require("mongoose");


const AnnotationMaterial =
    require(
        "../models/AnnotationMaterial"
    );

const User =
    require(
        "../models/User"
    );


/*
===========================================================
CREATE MATERIAL
===========================================================
*/

router.post(
    "/",
    async (req, res) => {

        try {

            const {

                teacher,
                teacherName,
                className,
                subject,

                chapterNo,
                chapterName,

                topic,
                description,

                materialDate,
                room,

                pages

            } = req.body;


            /*
            ------------------------------------------------
            REQUIRED FIELDS
            ------------------------------------------------
            */

            if (
                !teacher ||
                !teacherName ||
                !className ||
                !subject ||
                !chapterNo ||
                !chapterName ||
                !topic ||
                !materialDate ||
                !room
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Required material details are missing"

                });

            }


            /*
            ------------------------------------------------
            VALIDATE PAGES
            ------------------------------------------------
            */

            const safePages =
                Array.isArray(pages)
                    ? pages
                    : [];


            /*
            ------------------------------------------------
            CREATE PAGE NUMBERS
            ------------------------------------------------
            */

            const formattedPages =
                safePages.map(
                    (page, index) => ({

                        pageNumber:
                            index + 1,

                        history:
                            Array.isArray(
                                page
                            )
                                ? page
                                : (
                                    page &&
                                    Array.isArray(
                                        page.history
                                    )
                                        ? page.history
                                        : []
                                )

                    })
                );


            /*
            ------------------------------------------------
            CREATE MATERIAL
            ------------------------------------------------
            */

            const material =
                await AnnotationMaterial.create({

                    teacher,

                    teacherName,

                    className,

                    subject,

                    chapterNo,

                    chapterName,

                    topic,

                    description:
                        description || "",

                    materialDate,

                    room,

                    pages:
                        formattedPages,

                    totalPages:
                        Math.max(
                            formattedPages.length,
                            1
                        )

                });


            return res.status(201).json({

                success: true,

                message:
                    "Learning material created successfully",

                material

            });

        }
        catch (error) {

            console.error(
                "ANNOTATION MATERIAL CREATE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to create learning material"

            });

        }

    }
);


/*
===========================================================
UPDATE MATERIAL
===========================================================
*/

router.put(
    "/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid material ID"

                });

            }


            const {

                chapterNo,
                chapterName,

                topic,
                description,

                materialDate,

                pages

            } = req.body;


            /*
            ------------------------------------------------
            FORMAT PAGES
            ------------------------------------------------
            */

            const safePages =
                Array.isArray(pages)
                    ? pages
                    : [];


            const formattedPages =
                safePages.map(
                    (page, index) => ({

                        pageNumber:
                            index + 1,

                        history:
                            Array.isArray(
                                page
                            )
                                ? page
                                : (
                                    page &&
                                    Array.isArray(
                                        page.history
                                    )
                                        ? page.history
                                        : []
                                )

                    })
                );


            /*
            ------------------------------------------------
            UPDATE
            ------------------------------------------------
            */

            const material =
                await AnnotationMaterial.findByIdAndUpdate(

                    id,

                    {

                        ...(chapterNo !== undefined && {
                            chapterNo
                        }),

                        ...(chapterName !== undefined && {
                            chapterName
                        }),

                        ...(topic !== undefined && {
                            topic
                        }),

                        ...(description !== undefined && {
                            description
                        }),

                        ...(materialDate !== undefined && {
                            materialDate
                        }),

                        pages:
                            formattedPages,

                        totalPages:
                            Math.max(
                                formattedPages.length,
                                1
                            )

                    },

                    {
                        new: true,

                        runValidators: true

                    }

                );


            if (!material) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Learning material not found"

                });

            }


            return res.json({

                success: true,

                message:
                    "Learning material updated successfully",

                material

            });

        }
        catch (error) {

            console.error(
                "ANNOTATION MATERIAL UPDATE ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to update learning material"

            });

        }

    }
);


/*
===========================================================
GET TEACHER MATERIALS
===========================================================
*/

router.get(
    "/teacher/:teacherId",
    async (req, res) => {

        try {

            const {
                teacherId
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    teacherId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid teacher ID"

                });

            }


            const materials =
                await AnnotationMaterial.find({

                    teacher:
                        teacherId

                })
                .sort({
                    materialDate: -1,
                    createdAt: -1
                });


            return res.json({

                success: true,

                materials

            });

        }
        catch (error) {

            console.error(
                "ANNOTATION MATERIAL TEACHER LIST ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load teacher materials"

            });

        }

    }
);


/*
===========================================================
GET STUDENT MATERIALS
===========================================================
*/

router.get(
    "/student/:studentId",
    async (req, res) => {

        try {

            const {
                studentId
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    studentId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid student ID"

                });

            }


            /*
            ------------------------------------------------
            GET STUDENT
            ------------------------------------------------
            */

            const student =
                await User.findById(
                    studentId
                );


            if (!student) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Student not found"

                });

            }


            /*
            ------------------------------------------------
            STUDENT CLASS
            ------------------------------------------------

            We use the student's class to determine
            which learning materials can be viewed.
            ------------------------------------------------
            */

           let studentClass =
    student.className ||
    student.class ||
    student.grade;


/*
=========================================================
NORMALIZE STUDENT GRADE
=========================================================
*/

if (
    studentClass &&
    /^\d+$/.test(
        String(studentClass).trim()
    )
) {

    studentClass =
        `Grade-${String(
            studentClass
        ).trim()}`;

}


console.log(
    "ANNOTATION MATERIALS: STUDENT CLASS",
    studentClass
);


            if (!studentClass) {

                return res.json({

                    success: true,

                    materials: []

                });

            }


            const materials =
                await AnnotationMaterial.find({

                    className:
                        studentClass

                })
                .sort({

                    materialDate: -1,

                    createdAt: -1

                });


            return res.json({

                success: true,

                materials

            });

        }
        catch (error) {

            console.error(
                "ANNOTATION MATERIAL STUDENT LIST ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load student materials"

            });

        }

    }
);


/*
===========================================================
GET ALL MATERIALS — FOUNDER
===========================================================
*/

router.get(
    "/founder",
    async (req, res) => {

        try {

            const materials =
                await AnnotationMaterial.find({})
                .sort({

                    materialDate: -1,

                    createdAt: -1

                });


            return res.json({

                success: true,

                materials

            });

        }
        catch (error) {

            console.error(
                "ANNOTATION MATERIAL FOUNDER LIST ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load learning materials"

            });

        }

    }
);


/*
===========================================================
VIEW ONE MATERIAL
===========================================================
*/

router.get(
    "/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            if (
                !mongoose.Types.ObjectId.isValid(
                    id
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid material ID"

                });

            }


            const material =
                await AnnotationMaterial.findById(
                    id
                );


            if (!material) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Learning material not found"

                });

            }


            return res.json({

                success: true,

                material

            });

        }
        catch (error) {

            console.error(
                "ANNOTATION MATERIAL VIEW ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Failed to load learning material"

            });

        }

    }
);


/*
===========================================================
EXPORT
===========================================================
*/

module.exports =
    router;