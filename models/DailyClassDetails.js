/*
===========================================================
GOPES PINNACLE ACADEMY
DAILY CLASS DETAILS MODEL
===========================================================

This model stores the complete live-class session history.

IMPORTANT:

This is NOT ClassSummary.

This model independently records:

Teacher:
- Joined time
- Leave time
- Disconnects
- Reconnects

Students:
- Joined time
- Leave time
- Disconnects
- Reconnects

One document = ONE CLASS SESSION.

===========================================================
*/

const mongoose = require("mongoose");


/*
===========================================================
CONNECTION EVENT
===========================================================

One disconnect + reconnect pair.

Example:

Disconnected:
10:18:42

Reconnected:
10:19:07
===========================================================
*/

const connectionEventSchema =
    new mongoose.Schema(

        {

            disconnectedAt: {

                type: Date,

                default: null

            },


            reconnectedAt: {

                type: Date,

                default: null

            }

        },

        {
            _id: false
        }

    );


/*
===========================================================
TEACHER SESSION
===========================================================
*/

const teacherSessionSchema =
    new mongoose.Schema(

        {

            teacherId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                default: null

            },


            teacherName: {

                type: String,

                default: ""

            },


            /*
            -----------------------------------------------
            JOINED
            -----------------------------------------------
            */

            joinedAt: {

                type: Date,

                default: null

            },


            /*
            -----------------------------------------------
            LEFT
            -----------------------------------------------
            */

            leftAt: {

                type: Date,

                default: null

            },


            /*
            -----------------------------------------------
            DISCONNECT COUNT
            -----------------------------------------------
            */

            disconnectCount: {

                type: Number,

                default: 0

            },


            /*
            -----------------------------------------------
            DISCONNECT / RECONNECT HISTORY
            -----------------------------------------------
            */

            connectionEvents: {

                type:
                    [connectionEventSchema],

                default: []

            }

        },

        {
            _id: false
        }

    );


/*
===========================================================
STUDENT SESSION
===========================================================
*/

const studentSessionSchema =
    new mongoose.Schema(

        {

            studentId: {

                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                default: null

            },


            studentName: {

                type: String,

                default: ""

            },


            /*
            -----------------------------------------------
            JOINED
            -----------------------------------------------
            */

            joinedAt: {

                type: Date,

                default: null

            },


            /*
            -----------------------------------------------
            LEFT
            -----------------------------------------------
            */

            leftAt: {

                type: Date,

                default: null

            },


            /*
            -----------------------------------------------
            DISCONNECT COUNT
            -----------------------------------------------
            */

            disconnectCount: {

                type: Number,

                default: 0

            },


            /*
            -----------------------------------------------
            DISCONNECT / RECONNECT HISTORY
            -----------------------------------------------
            */

            connectionEvents: {

                type:
                    [connectionEventSchema],

                default: []

            }

        },

        {
            _id: false
        }

    );


/*
===========================================================
DAILY CLASS DETAILS
===========================================================
*/

const dailyClassDetailsSchema =
    new mongoose.Schema(

        {

            /*
            =================================================
            CLASS SESSION ID
            =================================================

            Unique ID for this particular meeting session.

            Example:

            8c9f1c8e-....
            */

            sessionId: {

                type: String,

                required: true,

                unique: true,

                index: true

            },


            /*
            =================================================
            CLASSROOM ROOM
            =================================================

            Existing meeting room.

            We keep this because it connects the record
            to the existing virtual classroom.
            */

            room: {

                type: String,

                required: true,

                index: true

            },


            /*
            =================================================
            CLASS INFORMATION
            =================================================
            */

            className: {

                type: String,

                required: true,

                index: true

            },


            subject: {

                type: String,

                default: ""

            },


            /*
            =================================================
            DATE
            =================================================
            */

            date: {

                type: Date,

                required: true,

                index: true

            },


            /*
            =================================================
            DAY
            =================================================

            Example:

            Wednesday
            */

            day: {

                type: String,

                default: "",

                index: true

            },


            /*
            =================================================
            SCHEDULED CLASS TIMING
            =================================================
            */

            scheduledStartTime: {

                type: String,

                default: ""

            },


            scheduledEndTime: {

                type: String,

                default: ""

            },


            /*
            =================================================
            TEACHER
            =================================================
            */

            teacher: {

                type:
                    teacherSessionSchema,

                default: null

            },


            /*
            =================================================
            STUDENTS
            =================================================

            Supports:

            1 student
            2 students
            3 students
            4 students

            and future expansion.
            */

            students: {

                type:
                    [studentSessionSchema],

                default: []

            },


            /*
            =================================================
            TOTAL STUDENT COUNT
            =================================================
            */

            studentCount: {

                type: Number,

                default: 0

            },


            /*
            =================================================
            SESSION STATUS
            =================================================

            Active:
                Meeting currently running

            Completed:
                Teacher has left

            Incomplete:
                Meeting ended unexpectedly
            */

            status: {

    type: String,

    enum: [

        "Active",
        "Completed",
        "Incomplete"

    ],

    default: "Active",

    index: true

},


/*
===========================================================
ACTUAL MEETING END TIME
===========================================================

This is the real time the classroom was ended.

Example:

2026-08-31T18:55:32.000Z
===========================================================
*/

endedAt: {

    type: Date,

    default: null,

    index: true

},


/*
===========================================================
MEETING END REASON
===========================================================

Examples:

Teacher ended meeting
Meeting ended unexpectedly
System ended meeting
===========================================================
*/

endReason: {

    type: String,

    default: ""

}

        },

        {

            timestamps: true

        }

    );


/*
===========================================================
EXPORT
===========================================================
*/

module.exports =
    mongoose.model(
        "DailyClassDetails",
        dailyClassDetailsSchema
    );