/*
===========================================================
GOPES PINNACLE ACADEMY
ANNOTATION MATERIAL MODEL
===========================================================

Purpose:

Stores teacher-created annotation learning materials.

Each material contains:

- Date
- Teacher
- Class
- Subject
- Chapter Number
- Chapter Name
- Topic
- Description
- Multiple annotation pages
- Total pages
- Room
- Created / Updated timestamps

The actual annotation strokes are stored inside pages.
===========================================================
*/

const mongoose =
    require("mongoose");


/*
===========================================================
PAGE SCHEMA
===========================================================
*/

const annotationPageSchema =
    new mongoose.Schema(
        {

            /*
            ------------------------------------------------
            PAGE NUMBER
            ------------------------------------------------
            */

            pageNumber: {

                type: Number,

                required: true

            },


            /*
            ------------------------------------------------
            ANNOTATION STROKES
            ------------------------------------------------

            Each stroke contains:

            type
            color
            width
            points
            ------------------------------------------------
            */

            history: {

                type: Array,

                default: []

            }

        },

        {
            _id: false
        }
    );


/*
===========================================================
ANNOTATION MATERIAL SCHEMA
===========================================================
*/

const annotationMaterialSchema =
    new mongoose.Schema(
        {

            /*
            ------------------------------------------------
            TEACHER
            ------------------------------------------------
            */

            teacher: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: true

            },


            /*
            ------------------------------------------------
            TEACHER NAME
            ------------------------------------------------
            */

            teacherName: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            CLASS
            ------------------------------------------------
            */

            className: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            SUBJECT
            ------------------------------------------------
            */

            subject: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            CHAPTER NUMBER
            ------------------------------------------------
            */

            chapterNo: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            CHAPTER NAME
            ------------------------------------------------
            */

            chapterName: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            TOPIC
            ------------------------------------------------
            */

            topic: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            DESCRIPTION
            ------------------------------------------------
            */

            description: {

                type: String,

                default: "",

                trim: true

            },


            /*
            ------------------------------------------------
            MATERIAL DATE
            ------------------------------------------------
            */

            materialDate: {

                type: Date,

                required: true

            },


            /*
            ------------------------------------------------
            CLASSROOM ROOM
            ------------------------------------------------
            */

            room: {

                type: String,

                required: true,

                trim: true

            },


            /*
            ------------------------------------------------
            ANNOTATION PAGES
            ------------------------------------------------
            */

            pages: {

                type: [
                    annotationPageSchema
                ],

                default: []

            },


            /*
            ------------------------------------------------
            TOTAL PAGES
            ------------------------------------------------
            */

            totalPages: {

                type: Number,

                default: 1,

                min: 1

            }

        },

        {

            timestamps: true

        }
    );


/*
===========================================================
INDEXES
===========================================================
*/

annotationMaterialSchema.index({

    teacher: 1,

    materialDate: -1

});


annotationMaterialSchema.index({

    className: 1,

    materialDate: -1

});


annotationMaterialSchema.index({

    subject: 1,

    materialDate: -1

});


/*
===========================================================
EXPORT
===========================================================
*/

module.exports =
    mongoose.model(
        "AnnotationMaterial",
        annotationMaterialSchema
    );