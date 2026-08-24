/*
==========================================================
GOPES PINNACLE ACADEMY
MEETING SOCKET
==========================================================

PURPOSE

This module handles:

1. Participant joining
2. Participant identification
3. Classroom capacity
4. Founder / Teacher / Student roles
5. Participant list
6. Participant join notifications
7. Participant leave notifications
8. Generic WebRTC signaling
9. Screen-share signaling
10. Media status
11. Network status
12. Battery status
13. Device information
14. Visibility status
15. Teacher controls
16. Student reconnect handling
17. Teacher / student attendance

CLASSROOM LIMIT

Founder  = 1
Teachers = 2
Students = 10

TOTAL = 13

==========================================================
*/

const meetingMemory =
    require("../core/meetingMemory");

const TeacherSession =
    require("../models/TeacherSession");

const DailyClassDetails =
    require("../models/DailyClassDetails");

const mongoose =
    require("mongoose");


/*
==========================================================
CLASSROOM CAPACITY
==========================================================
*/

const MAX_FOUNDERS = 1;

const MAX_TEACHERS = 2;

const MAX_STUDENTS = 10;

const MAX_PARTICIPANTS =
    MAX_FOUNDERS +
    MAX_TEACHERS +
    MAX_STUDENTS;


/*
==========================================================
VALID ROLES
==========================================================
*/

const VALID_ROLES = [
    "founder",
    "teacher",
    "student"
];


/*
==========================================================
GET ROOM PARTICIPANTS
==========================================================
*/

function getParticipants(room) {

    if (
        !meetingMemory.participants ||
        !meetingMemory.participants[room]
    ) {

        return [];

    }

    return meetingMemory.participants[room];

}


/*
==========================================================
GET ONLINE PARTICIPANTS

Only participants with a valid current socket are counted.
==========================================================
*/

function getOnlineParticipants(room) {

    return getParticipants(room)
        .filter(
            participant =>
                participant &&
                participant.status === "Online"
        );

}


/*
==========================================================
COUNT ROLE
==========================================================
*/

function countRole(room, role) {

    return getOnlineParticipants(room)
        .filter(
            participant =>
                participant.role === role
        )
        .length;

}


/*
==========================================================
BUILD PUBLIC PARTICIPANT DATA

This is what frontend receives.

Private database information is NOT exposed.
==========================================================
*/

function publicParticipant(participant) {

    return {

        socketId:
            participant.socketId,

        userId:
            participant.userId || null,

        studentId:
            participant.studentId || null,

        name:
            participant.name || "Unknown",

        role:
            participant.role,

        joinedAt:
            participant.joinedAt,

        status:
            participant.status || "Online",

        camera:
            participant.camera ?? true,

        mic:
            participant.mic ?? true,

        network:
            participant.network || "Checking",

        battery:
            participant.battery ?? -1,

        charging:
            participant.charging ?? false,

        device:
            participant.device || "Unknown",

        visibility:
            participant.visibility || "Active",

        micLocked:
            participant.micLocked ?? false,

        cameraLocked:
            participant.cameraLocked ?? false,

        micMuted:
            participant.micMuted ?? false,

        cameraStopped:
            participant.cameraStopped ?? false

    };

}


/*
==========================================================
BUILD PARTICIPANT LIST
==========================================================
*/

function buildParticipantList(room) {

    return getOnlineParticipants(room)
        .map(publicParticipant);

}


/*
==========================================================
CHECK CLASSROOM CAPACITY
==========================================================
*/

function checkCapacity(room, role, reconnecting) {

    /*
    ------------------------------------------------------
    RECONNECTING PARTICIPANT

    Reconnection does not consume an additional seat.
    ------------------------------------------------------
    */

    if (reconnecting) {

        return {
            allowed: true
        };

    }


    const total =
        getOnlineParticipants(room).length;


    /*
    ------------------------------------------------------
    TOTAL LIMIT
    ------------------------------------------------------
    */

    if (total >= MAX_PARTICIPANTS) {

        return {

            allowed: false,

            reason:
                "Classroom is full. Maximum 13 participants are allowed."

        };

    }


    /*
    ------------------------------------------------------
    FOUNDER LIMIT
    ------------------------------------------------------
    */

    if (
        role === "founder" &&
        countRole(room, "founder") >= MAX_FOUNDERS
    ) {

        return {

            allowed: false,

            reason:
                "Only 1 Founder can join this classroom."

        };

    }


    /*
    ------------------------------------------------------
    TEACHER LIMIT
    ------------------------------------------------------
    */

    if (
        role === "teacher" &&
        countRole(room, "teacher") >= MAX_TEACHERS
    ) {

        return {

            allowed: false,

            reason:
                "Only 2 Teachers can join this classroom."

        };

    }


    /*
    ------------------------------------------------------
    STUDENT LIMIT
    ------------------------------------------------------
    */

    if (
        role === "student" &&
        countRole(room, "student") >= MAX_STUDENTS
    ) {

        return {

            allowed: false,

            reason:
                "Only 10 Students can join this classroom."

        };

    }


    return {

        allowed: true

    };

}


/*
==========================================================
REGISTER MEETING SOCKET
==========================================================
*/

module.exports =
function registerMeetingSocket(io) {


    /*
    ======================================================
    NEW SOCKET CONNECTION
    ======================================================
    */

    io.on(
        "connection",
        (socket) => {


            console.log(
                "=========================================="
            );

            console.log(
                "MEETING SOCKET CONNECTED"
            );

            console.log(
                "Socket ID:",
                socket.id
            );

            console.log(
                "=========================================="
            );


            /*
            ==================================================
            JOIN ROOM
            ==================================================
            */

            socket.on(
                "joinRoom",
                async (data = {}) => {


                    /*
                    --------------------------------------------------
                    READ DATA
                    --------------------------------------------------
                    */

                    const room =
                        typeof data.room === "string"
                            ? data.room.trim()
                            : "";

                    const role =
                        typeof data.role === "string"
                            ? data.role.trim().toLowerCase()
                            : "";

                    const name =
                        typeof data.name === "string"
                            ? data.name.trim()
                            : "";

                    const studentId =
                        data.studentId || null;

                    const periodId =
                        data.periodId || null;

                    const userId =
                        data.userId || null;


                    /*
                    --------------------------------------------------
                    BASIC VALIDATION
                    --------------------------------------------------
                    */

                    if (!room) {

                        socket.emit(
                            "joinRejected",
                            {
                                reason:
                                    "Meeting room is required."
                            }
                        );

                        return;

                    }


                    if (!VALID_ROLES.includes(role)) {

                        socket.emit(
                            "joinRejected",
                            {
                                reason:
                                    "Invalid meeting role."
                            }
                        );

                        return;

                    }


                    if (!name) {

                        socket.emit(
                            "joinRejected",
                            {
                                reason:
                                    "Participant name is required."
                            }
                        );

                        return;

                    }


                    /*
                    --------------------------------------------------
                    LOG JOIN REQUEST
                    --------------------------------------------------
                    */

                    console.log(
                        "=========================================="
                    );

                    console.log(
                        "JOIN ROOM REQUEST"
                    );

                    console.log(
                        "Room:",
                        room
                    );

                    console.log(
                        "Role:",
                        role
                    );

                    console.log(
                        "Name:",
                        name
                    );

                    console.log(
                        "User ID:",
                        userId
                    );

                    console.log(
                        "Student ID:",
                        studentId
                    );

                    console.log(
                        "Period ID:",
                        periodId
                    );

                    console.log(
                        "=========================================="
                    );


                    /*
                    --------------------------------------------------
                    MAKE SURE ROOM ARRAY EXISTS
                    --------------------------------------------------
                    */

                    if (
                        !meetingMemory.participants[room]
                    ) {

                        meetingMemory.participants[room] = [];

                    }


                    /*
                    --------------------------------------------------
                    FIND EXISTING PARTICIPANT

                    Prefer stable ID.

                    Student:
                        studentId

                    Others:
                        userId

                    Fallback:
                        role + name
                    --------------------------------------------------
                    */

                    let existingParticipant = null;


                    if (studentId) {

                        existingParticipant =
                            meetingMemory.participants[room]
                                .find(
                                    participant =>
                                        participant.studentId &&
                                        participant.studentId.toString() ===
                                            studentId.toString()
                                );

                    }


                    if (
                        !existingParticipant &&
                        userId
                    ) {

                        existingParticipant =
                            meetingMemory.participants[room]
                                .find(
                                    participant =>
                                        participant.userId &&
                                        participant.userId.toString() ===
                                            userId.toString()
                                );

                    }


                    if (!existingParticipant) {

                        existingParticipant =
                            meetingMemory.participants[room]
                                .find(
                                    participant =>
                                        participant.role === role &&
                                        participant.name === name
                                );

                    }


                    const reconnecting =
                        !!existingParticipant;


                    /*
                    --------------------------------------------------
                    CHECK CAPACITY
                    --------------------------------------------------
                    */

                    const capacity =
                        checkCapacity(
                            room,
                            role,
                            reconnecting
                        );


                    if (!capacity.allowed) {

                        console.warn(
                            "JOIN REJECTED:",
                            capacity.reason
                        );


                        socket.emit(
                            "joinRejected",
                            {
                                reason:
                                    capacity.reason
                            }
                        );


                        return;

                    }


                    /*
                    --------------------------------------------------
                    JOIN SOCKET.IO ROOM
                    --------------------------------------------------
                    */

                    socket.join(room);

                    socket.room =
                        room;

                    socket.role =
                        role;

                    socket.name =
                        name;

                    socket.studentId =
                        studentId;

                    socket.periodId =
                        periodId;

                    socket.userId =
                        userId;


                    /*
                    --------------------------------------------------
                    SAVE OLD SOCKET ID

                    Used for reconnect notification.
                    --------------------------------------------------
                    */

                    const oldSocketId =
                        existingParticipant
                            ? existingParticipant.socketId
                            : null;


                    /*
                    --------------------------------------------------
                    REGISTER / UPDATE PARTICIPANT
                    --------------------------------------------------
                    */

                    if (!existingParticipant) {


                        meetingMemory.participants[room]
                            .push({

                                socketId:
                                    socket.id,

                                userId:
                                    userId,

                                studentId:
                                    studentId,

                                role:
                                    role,

                                name:
                                    name,

                                joinedAt:
                                    new Date(),

                                status:
                                    "Online",

                                camera:
                                    true,

                                mic:
                                    true,

                                network:
                                    "Checking",

                                battery:
                                    -1,

                                charging:
                                    false,

                                device:
                                    "Unknown",

                                visibility:
                                    "Active",

                                micLocked:
                                    false,

                                cameraLocked:
                                    false,

                                micMuted:
                                    false,

                                cameraStopped:
                                    false

                            });


                    } else {


                        /*
                        --------------------------------------------------
                        RECONNECT

                        Keep the same participant record.
                        Change only the socket identity/state.
                        --------------------------------------------------
                        */

                        existingParticipant.socketId =
                            socket.id;

                        existingParticipant.status =
                            "Online";

                        existingParticipant.name =
                            name;

                        existingParticipant.role =
                            role;

                        existingParticipant.userId =
                            userId;

                        existingParticipant.studentId =
                            studentId;


                        /*
                        Reset temporary connection state.
                        */

                        existingParticipant.network =
                            "Checking";


                        /*
                        Preserve existing camera/mic
                        state if available.
                        */

                        if (
                            existingParticipant.camera === undefined
                        ) {

                            existingParticipant.camera =
                                true;

                        }

                        if (
                            existingParticipant.mic === undefined
                        ) {

                            existingParticipant.mic =
                                true;

                        }


                        /*
                        --------------------------------------------------
                        TELL EXISTING USERS THAT THIS PARTICIPANT
                        GOT A NEW SOCKET ID.
                        --------------------------------------------------
                        */

                        io.to(room).emit(
                            "participantReconnected",
                            {

                                oldSocketId:
                                    oldSocketId,

                                participant:
                                    publicParticipant(
                                        existingParticipant
                                    )

                            }
                        );

                    }

                    /*
==========================================================
DAILY CLASS DETAILS
TEACHER SESSION START
==========================================================

Create ONE DailyClassDetails record when the teacher
starts the class.

Class information is obtained from the existing
PeriodAssignment using periodId.

This keeps DailyClassDetails independent from the
frontend-supplied class information.
==========================================================
*/

if (
    role === "teacher"
) {

    try {

        /*
        --------------------------------------------------
        FIND EXISTING ACTIVE DAILY CLASS SESSION
        --------------------------------------------------
        */

        let dailyClass =
            await DailyClassDetails.findOne({

                room:
                    room,

                status:
                    "Active"

            });


        /*
        --------------------------------------------------
        CREATE NEW SESSION
        --------------------------------------------------
        */

        if (!dailyClass) {

            /*
            ==================================================
            FIND PERIOD / TIMETABLE INFORMATION
            ==================================================
            */

            let periodAssignment =
                null;


            if (
                periodId &&
                mongoose.Types.ObjectId.isValid(
                    periodId
                )
            ) {

                /*
                ------------------------------------------------
                IMPORTANT:

                We already know from the logs that periodId
                points to the timetable/period assignment.

                We will load the actual class information
                from that database record.
                ------------------------------------------------
                */

                const PeriodAssignment =
                    require(
                        "../models/PeriodAssignment"
                    );


                periodAssignment =
                    await PeriodAssignment.findById(
                        periodId
                    );

            }


            /*
            ==================================================
            VALIDATE TIMETABLE DATA
            ==================================================
            */

            if (!periodAssignment) {

                console.error(
                    "DAILY CLASS DETAILS: PERIOD ASSIGNMENT NOT FOUND",
                    periodId
                );

            }


            /*
            --------------------------------------------------
            CLASS INFORMATION
            --------------------------------------------------
            */

            const className =
                periodAssignment
                    ?.className ||
                "";


            const subject =
                periodAssignment
                    ?.subject ||
                "";


            const scheduledStartTime =
                periodAssignment
                    ?.startTime ||
                "";


            const scheduledEndTime =
                periodAssignment
                    ?.endTime ||
                "";


            /*
            --------------------------------------------------
            CLASS NAME IS REQUIRED BY THE MODEL
            --------------------------------------------------

            Do not create an invalid DailyClassDetails
            document.
            --------------------------------------------------
            */

            if (!className) {

                console.error(
                    "DAILY CLASS DETAILS: CLASS NAME NOT FOUND. SESSION NOT CREATED."
                );

            }
            else {

                /*
                ==================================================
                CREATE SESSION
                ==================================================
                */

                const now =
                    new Date();


                /*
                ------------------------------------------------
                UNIQUE SESSION ID
                ------------------------------------------------
                */

                const sessionId =
                    new mongoose.Types.ObjectId()
                        .toString();


                dailyClass =
                    new DailyClassDetails({

                        /*
                        ----------------------------------------
                        SESSION
                        ----------------------------------------
                        */

                        sessionId:
                            sessionId,


                        /*
                        ----------------------------------------
                        EXISTING CLASSROOM ROOM
                        ----------------------------------------
                        */

                        room:
                            room,


                        /*
                        ----------------------------------------
                        CLASS INFORMATION
                        ----------------------------------------
                        */

                        className:
                            className,


                        subject:
                            subject,


                        /*
                        ----------------------------------------
                        DATE
                        ----------------------------------------
                        */

                        date:
                            now,


                        day:
                            periodAssignment
                                ?.day ||
                            now.toLocaleDateString(
                                "en-IN",
                                {
                                    weekday:
                                        "long",

                                    timeZone:
                                        "Asia/Kolkata"
                                }
                            ),


                        /*
                        ----------------------------------------
                        SCHEDULED CLASS TIME
                        ----------------------------------------
                        */

                        scheduledStartTime:
                            scheduledStartTime,


                        scheduledEndTime:
                            scheduledEndTime,


                        /*
                        ----------------------------------------
                        TEACHER SESSION
                        ----------------------------------------
                        */

                        teacher: {

                            teacherId:
                                userId,

                            teacherName:
                                name,

                            joinedAt:
                                now,

                            leftAt:
                                null,

                            disconnectCount:
                                0,

                            connectionEvents:
                                []

                        },


                        /*
                        ----------------------------------------
                        STUDENTS

                        Students will be added when they join.
                        ----------------------------------------
                        */

                        students:
                            [],


                        studentCount:
                            0,


                        /*
                        ----------------------------------------
                        SESSION STATUS
                        ----------------------------------------
                        */

                        status:
                            "Active"

                    });


                await dailyClass.save();


                /*
                ==================================================
                SUCCESS LOG
                ==================================================
                */

                console.log(
                    "================================================"
                );

                console.log(
                    "DAILY CLASS DETAILS: SESSION CREATED"
                );

                console.log(
                    "Session ID:",
                    dailyClass.sessionId
                );

                console.log(
                    "Room:",
                    room
                );

                console.log(
                    "Class:",
                    className
                );

                console.log(
                    "Subject:",
                    subject
                );

                console.log(
                    "Teacher:",
                    name
                );

                console.log(
                    "Teacher Joined:",
                    now.toISOString()
                );

                console.log(
                    "Scheduled:",
                    scheduledStartTime,
                    "-",
                    scheduledEndTime
                );

                console.log(
                    "================================================"
                );

            }

        }
        else {

    /*
    ======================================================
    DAILY CLASS DETAILS
    TEACHER RECONNECT TRACKING
    ======================================================
    */

    try {

        const rejoinedAt =
            new Date();


        /*
        --------------------------------------------------
        ENSURE TEACHER DATA EXISTS
        --------------------------------------------------
        */

        if (
            !dailyClass.teacher
        ) {

            console.warn(
                "DAILY CLASS DETAILS: TEACHER DATA NOT FOUND"
            );

        }
        else {

            /*
            --------------------------------------------------
            ENSURE CONNECTION EVENTS EXISTS
            --------------------------------------------------
            */

            if (
                !Array.isArray(
                    dailyClass.teacher.connectionEvents
                )
            ) {

                dailyClass.teacher.connectionEvents =
                    [];

            }


            /*
            --------------------------------------------------
            FIND LAST DISCONNECT WITHOUT REJOIN TIME
            --------------------------------------------------
            */

            let pendingEvent =
                null;


            for (
                let i =
                    dailyClass.teacher.connectionEvents.length - 1;

                i >= 0;

                i--
            ) {

                const event =
                    dailyClass.teacher.connectionEvents[
                        i
                    ];


                if (
                    event.disconnectedAt &&
                    !event.rejoinedAt
                ) {

                    pendingEvent =
                        event;

                    break;

                }

            }


            /*
            --------------------------------------------------
            UPDATE REJOIN TIME
            --------------------------------------------------
            */

            if (
                pendingEvent
            ) {

                pendingEvent.rejoinedAt =
                    rejoinedAt;


                await dailyClass.save();


                console.log(
                    "================================================"
                );

                console.log(
                    "DAILY CLASS DETAILS: TEACHER REJOINED"
                );

                console.log(
                    "Room:",
                    room
                );

                console.log(
                    "Teacher:",
                    name
                );

                console.log(
                    "Rejoined:",
                    rejoinedAt.toISOString()
                );

                console.log(
                    "================================================"
                );

            }
            else {

                console.log(
                    "DAILY CLASS DETAILS: ACTIVE SESSION ALREADY EXISTS"
                );

                console.log(
                    "DAILY CLASS DETAILS: NO PENDING TEACHER RECONNECT"
                );

            }

        }

    }
    catch (error) {

        console.error(
            "DAILY CLASS DETAILS: TEACHER RECONNECT ERROR:",
            error
        );

    }

}

    }
    catch (error) {

        /*
        --------------------------------------------------
        IMPORTANT

        DailyClassDetails errors must NEVER prevent
        the teacher from entering the meeting.
        --------------------------------------------------
        */

        console.error(
            "DAILY CLASS DETAILS: SESSION CREATE ERROR:",
            error
        );

    }

}

/*
==========================================================
DAILY CLASS DETAILS
STUDENT SESSION START / RECONNECT
==========================================================
*/

if (
    role === "student" &&
    studentId
) {

    try {

        const dailyClass =
            await DailyClassDetails.findOne({

                room:
                    room,

                status:
                    "Active"

            });


        /*
        ==================================================
        ACTIVE SESSION NOT FOUND
        ==================================================
        */

        if (!dailyClass) {

            console.warn(
                "DAILY CLASS DETAILS: ACTIVE SESSION NOT FOUND FOR STUDENT",
                {
                    room,
                    name,
                    studentId
                }
            );

        }
        else {

            /*
            ==================================================
            FIND EXISTING STUDENT
            ==================================================
            */

            let existingStudent =
                dailyClass.students.find(
                    student => {

                        return (
                            String(
                                student.studentId
                            ) ===
                            String(
                                studentId
                            )
                        );

                    }
                );


            /*
            ==================================================
            FIRST TIME STUDENT JOIN
            ==================================================
            */

            if (
                !existingStudent
            ) {

                const now =
                    new Date();


                dailyClass.students.push({

                    studentId:
                        studentId,

                    studentName:
                        name,

                    joinedAt:
                        now,

                    leftAt:
                        null,

                    disconnectCount:
                        0,

                    connectionEvents:
                        []

                });


                /*
                ----------------------------------------------
                UPDATE STUDENT COUNT
                ----------------------------------------------
                */

                dailyClass.studentCount =
                    dailyClass.students.length;


                await dailyClass.save();


                console.log(
                    "================================================"
                );

                console.log(
                    "DAILY CLASS DETAILS: STUDENT JOINED"
                );

                console.log(
                    "Room:",
                    room
                );

                console.log(
                    "Student:",
                    name
                );

                console.log(
                    "Student ID:",
                    studentId
                );

                console.log(
                    "Joined:",
                    now.toISOString()
                );

                console.log(
                    "Total Students:",
                    dailyClass.studentCount
                );

                console.log(
                    "================================================"
                );

            }


            /*
            ==================================================
            STUDENT ALREADY EXISTS
            CHECK FOR PENDING RECONNECT
            ==================================================
            */

            else {

                let pendingEvent =
                    null;


                /*
                ----------------------------------------------
                SEARCH FROM LAST EVENT
                ----------------------------------------------
                */

                if (
                    Array.isArray(
                        existingStudent.connectionEvents
                    )
                ) {

                    for (
                        let i =
                            existingStudent
                                .connectionEvents
                                .length - 1;

                        i >= 0;

                        i--
                    ) {

                        const event =
                            existingStudent
                                .connectionEvents[i];


                        if (
                            event.disconnectedAt &&
                            !event.reconnectedAt
                        ) {

                            pendingEvent =
                                event;

                            break;

                        }

                    }

                }


                /*
                ==================================================
                PENDING DISCONNECT FOUND
                ==================================================
                */

                if (
                    pendingEvent
                ) {

                    const reconnectedAt =
                        new Date();


                    pendingEvent.reconnectedAt =
                        reconnectedAt;


                    await dailyClass.save();


                    console.log(
                        "================================================"
                    );

                    console.log(
                        "DAILY CLASS DETAILS: STUDENT RECONNECTED"
                    );

                    console.log(
                        "Room:",
                        room
                    );

                    console.log(
                        "Student:",
                        existingStudent.studentName
                    );

                    console.log(
                        "Student ID:",
                        studentId
                    );

                    console.log(
                        "Reconnected:",
                        reconnectedAt.toISOString()
                    );

                    console.log(
                        "Total Disconnects:",
                        existingStudent.disconnectCount
                    );

                    console.log(
                        "================================================"
                    );

                }
                else {

                    console.log(
                        "DAILY CLASS DETAILS: STUDENT ALREADY EXISTS - NO PENDING RECONNECT"
                    );

                }

            }

        }

    }
    catch (
        error
    ) {

        console.error(
            "DAILY CLASS DETAILS: STUDENT JOIN / RECONNECT ERROR:",
            error
        );

    }

}


                    /*
                    ==================================================
                    JOIN ACCEPTED
                    ==================================================
                    */

                    socket.emit(
                        "joinAccepted",
                        {

                            room:
                                room,

                            socketId:
                                socket.id,

                            role:
                                role,

                            name:
                                name,

                            reconnecting:
                                reconnecting,

                            maxParticipants:
                                MAX_PARTICIPANTS,

                            maxFounders:
                                MAX_FOUNDERS,

                            maxTeachers:
                                MAX_TEACHERS,

                            maxStudents:
                                MAX_STUDENTS

                        }
                    );


                    /*
                    ==================================================
                    SEND EXISTING PARTICIPANTS TO NEW USER
                    ==================================================

                    Exclude current socket.

                    This works for:

                    Founder
                    Teacher
                    Student
                    ==================================================
                    */

                    const existingParticipants =
                        buildParticipantList(room)
                            .filter(
                                participant =>
                                    participant.socketId !==
                                    socket.id
                            );


                    socket.emit(
                        "participantList",
                        {

                            participants:
                                existingParticipants

                        }
                    );


                    /*
                    ==================================================
                    NOTIFY EVERY OTHER PARTICIPANT
                    ==================================================
                    */

                    if (!reconnecting) {

                        const currentParticipant =
                            meetingMemory.participants[room]
                                .find(
                                    participant =>
                                        participant.socketId ===
                                        socket.id
                                );


                        if (currentParticipant) {

                            socket.to(room).emit(
                                "participantJoined",
                                {

                                    participant:
                                        publicParticipant(
                                            currentParticipant
                                        )

                                }
                            );

                        }

                    } else {

                        /*
                        --------------------------------------------------
                        RECONNECT NOTIFICATION
                        --------------------------------------------------
                        */

                        const currentParticipant =
                            meetingMemory.participants[room]
                                .find(
                                    participant =>
                                        participant.socketId ===
                                        socket.id
                                );


                        if (currentParticipant) {

                            socket.to(room).emit(
                                "participantReconnected",
                                {

                                    oldSocketId:
                                        oldSocketId,

                                    participant:
                                        publicParticipant(
                                            currentParticipant
                                        )

                                }
                            );

                        }

                    }


                    /*
                    ==================================================
                    SEND COMPLETE CURRENT ROOM STATE
                    ==================================================
                    */

                    io.to(room).emit(
                        "roomParticipants",
                        {

                            participants:
                                buildParticipantList(room),

                            counts: {

                                founder:
                                    countRole(
                                        room,
                                        "founder"
                                    ),

                                teachers:
                                    countRole(
                                        room,
                                        "teacher"
                                    ),

                                students:
                                    countRole(
                                        room,
                                        "student"
                                    ),

                                total:
                                    getOnlineParticipants(
                                        room
                                    ).length

                            },

                            capacity: {

                                founders:
                                    MAX_FOUNDERS,

                                teachers:
                                    MAX_TEACHERS,

                                students:
                                    MAX_STUDENTS,

                                total:
                                    MAX_PARTICIPANTS

                            }

                        }
                    );


                    /*
                    ==================================================
                    LOG CURRENT ROOM
                    ==================================================
                    */

                    console.log(
                        "ROOM PARTICIPANTS:",
                        buildParticipantList(room)
                    );


                    /*
                    ==================================================
                    STUDENT ATTENDANCE
                    ==================================================
                    */

                    if (
                        role === "student" &&
                        periodId &&
                        mongoose.Types.ObjectId.isValid(
                            periodId
                        )
                    ) {

                        try {

                            console.log(
                                "Searching TeacherSession:"
                            );

                            console.log({
                                periodId,
                                studentId
                            });


                            const session =
                                await TeacherSession.findOne({

                                    periodId:
                                        new mongoose.Types.ObjectId(
                                            periodId
                                        )

                                });


                            if (session) {


                                const existingStudent =
                                    studentId
                                        ? session.joinedStudents.find(
                                            student =>
                                                student.student &&
                                                student.student
                                                    .toString() ===
                                                    studentId.toString()
                                        )
                                        : null;


                                if (existingStudent) {


                                    const now =
                                        new Date();


                                    if (
                                        existingStudent.leftAt
                                    ) {

                                        const disconnectedSeconds =
                                            Math.floor(
                                                (
                                                    now -
                                                    existingStudent.leftAt
                                                ) / 1000
                                            );


                                        existingStudent.networkDisconnectTime =
                                            (
                                                existingStudent
                                                    .networkDisconnectTime ||
                                                0
                                            ) +
                                            disconnectedSeconds;

                                    }


                                    existingStudent.rejoinedCount =
                                        (
                                            existingStudent
                                                .rejoinedCount ||
                                            0
                                        ) + 1;


                                    existingStudent.isOnline =
                                        true;


                                    existingStudent.joinedAt =
                                        now;


                                    existingStudent.leftAt =
                                        null;


                                } else {


                                    /*
                                    First student join.
                                    */

                                    session.joinedStudents.push({

                                        student:
                                            studentId,

                                        joinedAt:
                                            new Date(),

                                        isOnline:
                                            true

                                    });

                                }


                                await session.save();


                                console.log(
                                    "Student Attendance Updated"
                                );

                            } else {

                                console.log(
                                    "NO SESSION FOUND"
                                );

                            }

                        } catch (error) {

                            console.error(
                                "Student attendance update error:",
                                error
                            );

                        }

                    }


                    /*
                    ==================================================
                    SCREEN SHARE ALREADY ACTIVE
                    ==================================================
                    */

                    if (
                        role !== "teacher" &&
                        meetingMemory.screenShare &&
                        meetingMemory.screenShare[room]
                    ) {

                        socket.emit(
                            "screenAlreadySharing",
                            {

                                teacherSocketId:
                                    meetingMemory
                                        .screenShare[room]
                                        .teacherSocketId

                            }
                        );

                    }

                }
            );


            /*
            ======================================================
            GENERIC WEBRTC OFFER
            ======================================================

            Works for:

            Founder ↔ Teacher
            Founder ↔ Student
            Teacher ↔ Teacher
            Teacher ↔ Student
            Student ↔ Student

            ======================================================
            */

            socket.on(
                "offer",
                (data = {}) => {


                    const targetSocketId =
                        data.targetSocketId;


                    if (!targetSocketId) {

                        console.warn(
                            "Offer missing targetSocketId"
                        );

                        return;

                    }


                    console.log(
                        "SERVER RECEIVED OFFER",
                        socket.id,
                        "->",
                        targetSocketId
                    );


                    io.to(targetSocketId).emit(
                        "offer",
                        {

                            senderSocketId:
                                socket.id,

                            senderRole:
                                socket.role,

                            senderName:
                                socket.name,

                            offer:
                                data.offer

                        }
                    );

                }
            );


            /*
            ======================================================
            ANSWER
            ======================================================
            */

            socket.on(
                "answer",
                (data = {}) => {


                    const targetSocketId =
                        data.targetSocketId ||
                        data.teacherSocketId;


                    if (!targetSocketId) {

                        console.warn(
                            "Answer missing targetSocketId"
                        );

                        return;

                    }


                    io.to(targetSocketId).emit(
                        "answer",
                        {

                            senderSocketId:
                                socket.id,

                            senderRole:
                                socket.role,

                            senderName:
                                socket.name,

                            answer:
                                data.answer

                        }
                    );

                }
            );


            /*
            ======================================================
            STUDENT READY

            Kept for compatibility with existing frontend code.

            ======================================================
            */

            socket.on(
                "studentReady",
                (data = {}) => {


                    if (
                        !data.teacherSocketId
                    ) {

                        return;

                    }


                    io.to(
                        data.teacherSocketId
                    ).emit(
                        "studentReady",
                        {

                            studentSocketId:
                                socket.id

                        }
                    );

                }
            );


            /*
            ======================================================
            ICE CANDIDATE
            ======================================================
            */

            socket.on(
                "ice-candidate",
                (data = {}) => {


                    const targetSocketId =
                        data.targetSocketId;


                    if (!targetSocketId) {

                        console.warn(
                            "ICE missing targetSocketId"
                        );

                        return;

                    }


                    io.to(targetSocketId).emit(
                        "ice-candidate",
                        {

                            senderSocketId:
                                socket.id,

                            candidate:
                                data.candidate

                        }
                    );

                }
            );


            /*
            ======================================================
            SCREEN SHARE
            ======================================================
            */

            socket.on(
                "screen-start",
                ({ room } = {}) => {


                    if (!room) return;


                    /*
                    Only teachers can start screen sharing.
                    */

                    if (
                        socket.role !== "teacher"
                    ) {

                        console.warn(
                            "Non-teacher attempted screen share:",
                            socket.id
                        );

                        return;

                    }


                    /*
                    Only one screen share at a time.
                    */

                    if (
                        meetingMemory.screenShare &&
                        meetingMemory.screenShare[room]
                    ) {

                        socket.emit(
                            "screen-start-rejected",
                            {

                                reason:
                                    "Another teacher is already sharing the screen."

                            }
                        );

                        return;

                    }


                    if (
                        !meetingMemory.screenShare
                    ) {

                        meetingMemory.screenShare = {};

                    }


                    meetingMemory.screenShare[room] = {

                        teacherSocketId:
                            socket.id,

                        startedAt:
                            Date.now()

                    };


                    socket.to(room).emit(
                        "screen-start",
                        {

                            teacherSocketId:
                                socket.id

                        }
                    );

                }
            );


            /*
            ======================================================
            SCREEN STOP
            ======================================================
            */

            socket.on(
                "screen-stop",
                ({ room } = {}) => {


                    if (!room) return;


                    const currentShare =
                        meetingMemory
                            .screenShare &&
                        meetingMemory
                            .screenShare[room];


                    /*
                    Only the teacher who started the
                    screen share can stop it.
                    */

                    if (
                        currentShare &&
                        currentShare.teacherSocketId ===
                            socket.id
                    ) {

                        delete meetingMemory
                            .screenShare[room];


                        socket.to(room).emit(
                            "screen-stop"
                        );

                    }

                }
            );


            /*
            ======================================================
            SCREEN REQUEST
            ======================================================
            */

            socket.on(
                "screen-request",
                ({ teacherSocketId } = {}) => {


                    if (!teacherSocketId) return;


                    io.to(
                        teacherSocketId
                    ).emit(
                        "screen-request",
                        {

                            studentSocketId:
                                socket.id

                        }
                    );

                }
            );


            /*
            ======================================================
            SCREEN OFFER
            ======================================================
            */

            socket.on(
                "screen-offer",
                (data = {}) => {


                    if (
                        !data.studentSocketId
                    ) {

                        return;

                    }


                    io.to(
                        data.studentSocketId
                    ).emit(
                        "screen-offer",
                        {

                            teacherSocketId:
                                socket.id,

                            offer:
                                data.offer

                        }
                    );

                }
            );


            /*
            ======================================================
            SCREEN ANSWER
            ======================================================
            */

            socket.on(
                "screen-answer",
                (data = {}) => {


                    const targetSocketId =
                        data.teacherSocketId ||
                        data.targetSocketId;


                    if (!targetSocketId) {

                        return;

                    }


                    io.to(
                        targetSocketId
                    ).emit(
                        "screen-answer",
                        {

                            studentSocketId:
                                socket.id,

                            answer:
                                data.answer

                        }
                    );

                }
            );


            /*
            ======================================================
            SCREEN ICE
            ======================================================
            */

            socket.on(
                "screen-ice",
                (data = {}) => {


                    if (
                        !data.targetSocketId
                    ) {

                        return;

                    }


                    io.to(
                        data.targetSocketId
                    ).emit(
                        "screen-ice",
                        {

                            senderSocketId:
                                socket.id,

                            candidate:
                                data.candidate

                        }
                    );

                }
            );


            /*
            ======================================================
            MEDIA STATUS
            ======================================================
            */

            socket.on(
                "mediaStatus",
                (data = {}) => {


                    socket.camera =
                        data.camera;

                    socket.mic =
                        data.mic;


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    socket.id
                            );


                    if (participant) {

                        participant.camera =
                            data.camera;

                        participant.mic =
                            data.mic;

                    }


                    socket.to(room).emit(
                        "mediaStatus",
                        {

                            socketId:
                                socket.id,

                            camera:
                                data.camera,

                            mic:
                                data.mic

                        }
                    );

                }
            );


            /*
            ======================================================
            NETWORK STATUS
            ======================================================
            */

            socket.on(
                "networkStatus",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    socket.id
                            );


                    if (participant) {

                        participant.network =
                            data.quality;

                    }


                    socket.to(room).emit(
                        "networkStatus",
                        {

                            socketId:
                                socket.id,

                            quality:
                                data.quality

                        }
                    );

                }
            );


            /*
            ======================================================
            STUDENT RECONNECTING
            ======================================================
            */

            socket.on(
                "studentReconnecting",
                () => {


                    if (!socket.room)
                        return;


                    socket.to(
                        socket.room
                    ).emit(
                        "studentReconnecting",
                        {

                            socketId:
                                socket.id

                        }
                    );

                }
            );


            /*
            ======================================================
            STUDENT RECONNECTED
            ======================================================
            */

            socket.on(
                "studentReconnected",
                () => {


                    if (!socket.room)
                        return;


                    console.log(
                        "Participant Reconnected:",
                        socket.id
                    );


                    socket.to(
                        socket.room
                    ).emit(
                        "studentReconnected",
                        {

                            socketId:
                                socket.id

                        }
                    );

                }
            );


            /*
            ======================================================
            BATTERY STATUS
            ======================================================
            */

            socket.on(
                "batteryStatus",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    socket.id
                            );


                    if (participant) {

                        participant.battery =
                            data.level;

                        participant.charging =
                            data.charging;

                    }


                    socket.to(room).emit(
                        "batteryStatus",
                        {

                            socketId:
                                socket.id,

                            level:
                                data.level,

                            charging:
                                data.charging

                        }
                    );

                }
            );


            /*
            ======================================================
            DEVICE INFO
            ======================================================
            */

            socket.on(
                "deviceInfo",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    socket.id
                            );


                    if (participant) {

                        participant.device =
                            data.device;

                    }


                    socket.to(room).emit(
                        "deviceInfo",
                        {

                            socketId:
                                socket.id,

                            device:
                                data.device

                        }
                    );

                }
            );


            /*
            ======================================================
            VISIBILITY STATUS
            ======================================================
            */

            socket.on(
                "visibilityStatus",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    socket.id
                            );


                    if (participant) {

                        participant.visibility =
                            data.visibility;

                    }


                    socket.to(room).emit(
                        "visibilityStatus",
                        {

                            socketId:
                                socket.id,

                            visibility:
                                data.visibility

                        }
                    );

                }
            );


            /*
            ======================================================
            MUTE STUDENT
            ======================================================
            */

            socket.on(
                "muteStudent",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const student =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    data.socketId &&
                                    p.role ===
                                    "student"
                            );


                    if (!student)
                        return;


                    student.micMuted =
                        !student.micMuted;


                    io.to(
                        data.socketId
                    ).emit(
                        "forceMute",
                        {

                            muted:
                                student.micMuted

                        }
                    );


                    io.to(room).emit(
                        "studentControlUpdated",
                        {

                            socketId:
                                student.socketId,

                            micMuted:
                                student.micMuted

                        }
                    );

                }
            );


            /*
            ======================================================
            LOCK MICROPHONE
            ======================================================
            */

            socket.on(
                "lockMic",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    data.socketId &&
                                    p.role ===
                                    "student"
                            );


                    if (!participant)
                        return;


                    participant.micLocked =
                        !participant.micLocked;


                    io.to(
                        data.socketId
                    ).emit(
                        "forceMute",
                        {

                            muted:
                                participant.micLocked

                        }
                    );


                    io.to(room).emit(
                        "studentControlUpdated",
                        {

                            socketId:
                                participant.socketId,

                            micLocked:
                                participant.micLocked,

                            micMuted:
                                participant.micLocked

                        }
                    );

                }
            );


            /*
            ======================================================
            LOCK CAMERA
            ======================================================
            */

            socket.on(
                "lockCamera",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    data.socketId &&
                                    p.role ===
                                    "student"
                            );


                    if (!participant)
                        return;


                    participant.cameraLocked =
                        !participant.cameraLocked;


                    io.to(
                        data.socketId
                    ).emit(
                        "forceStopCamera",
                        {

                            stopped:
                                participant.cameraLocked

                        }
                    );


                    io.to(room).emit(
                        "studentControlUpdated",
                        {

                            socketId:
                                participant.socketId,

                            cameraLocked:
                                participant.cameraLocked,

                            cameraStopped:
                                participant.cameraLocked

                        }
                    );

                }
            );


            /*
            ======================================================
            STOP CAMERA
            ======================================================
            */

            socket.on(
                "stopCamera",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const student =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    data.socketId &&
                                    p.role ===
                                    "student"
                            );


                    if (!student)
                        return;


                    student.cameraStopped =
                        !student.cameraStopped;


                    io.to(
                        data.socketId
                    ).emit(
                        "forceStopCamera",
                        {

                            stopped:
                                student.cameraStopped

                        }
                    );


                    io.to(room).emit(
                        "studentControlUpdated",
                        {

                            socketId:
                                student.socketId,

                            cameraStopped:
                                student.cameraStopped

                        }
                    );

                }
            );


            /*
            ======================================================
            REMOVE STUDENT
            ======================================================
            */

            socket.on(
                "removeStudent",
                (data = {}) => {


                    const room =
                        socket.room;


                    if (!room) return;


                    const student =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    data.socketId &&
                                    p.role ===
                                    "student"
                            );


                    if (!student)
                        return;


                    io.to(
                        data.socketId
                    ).emit(
                        "removedFromClass"
                    );


                    io.to(room).emit(
                        "userDisconnected",
                        data.socketId
                    );

                }
            );


            /*
            ======================================================
            DISCONNECT
            ======================================================
            */

            socket.on(
                "disconnect",
                async () => {


                    const room =
                        socket.room;

                    const role =
                        socket.role;

                    const studentId =
                        socket.studentId;

                    const periodId =
                        socket.periodId;


                    if (!room)
    return;


/*
======================================================
DAILY CLASS DETAILS
TEACHER DISCONNECT TRACKING
======================================================
*/

if (
    role === "teacher" &&
    socket.userId
) {

    try {

        const disconnectedAt =
            new Date();


        const session =
            await DailyClassDetails.findOne({

                room:
                    room,

                status:
                    "Active"

            });


        if (
            !session
        ) {

            console.warn(
                "DAILY CLASS DETAILS: ACTIVE SESSION NOT FOUND FOR TEACHER DISCONNECT"
            );

        }
        else {

            /*
            ==================================================
            ENSURE TEACHER OBJECT EXISTS
            ==================================================
            */

            if (
                !session.teacher
            ) {

                session.teacher =
                    {};

            }


            /*
            ==================================================
            ENSURE CONNECTION EVENTS EXISTS
            ==================================================
            */

            if (
                !Array.isArray(
                    session.teacher.connectionEvents
                )
            ) {

                session.teacher.connectionEvents =
                    [];

            }


            /*
            ==================================================
            ADD DISCONNECT EVENT
            ==================================================
            */

            session.teacher.connectionEvents.push({

                disconnectedAt:
                    disconnectedAt,

                rejoinedAt:
                    null

            });


            /*
            ==================================================
            INCREASE DISCONNECT COUNT
            ==================================================
            */

            session.teacher.disconnectCount =
                (
                    session.teacher.disconnectCount ||
                    0
                ) + 1;


            /*
            ==================================================
            SAVE
            ==================================================
            */

            await session.save();


            console.log(
                "================================================"
            );

            console.log(
                "DAILY CLASS DETAILS: TEACHER DISCONNECTED"
            );

            console.log(
                "Room:",
                room
            );

            console.log(
                "Teacher:",
                socket.name
            );

            console.log(
                "Disconnected:",
                disconnectedAt.toISOString()
            );

            console.log(
                "Total Disconnects:",
                session.teacher.disconnectCount
            );

            console.log(
                "================================================"
            );

        }

    }
    catch (error) {

        console.error(
            "DAILY CLASS DETAILS: TEACHER DISCONNECT ERROR:",
            error
        );

    }

}

/*
==========================================================
DAILY CLASS DETAILS
STUDENT DISCONNECT TRACKING
==========================================================
*/

if (
    role === "student" &&
    studentId &&
    room
) {

    try {

        const dailyClass =
    await DailyClassDetails.findOne({

        room: room

    }).sort({
        createdAt: -1
    });


        if (
            !dailyClass
        ) {

            console.warn(
    "DAILY CLASS DETAILS: ACTIVE SESSION NOT FOUND FOR STUDENT DISCONNECT",
    {
        room,
        studentId
    }
);
        }
        else {

            const student =
                dailyClass.students.find(
                    item =>
                        String(
                            item.studentId
                        ) ===
                        String(
                            studentId
                        )
                );


            if (
                !student
            ) {

               console.warn(
    "DAILY CLASS DETAILS: STUDENT NOT FOUND IN ACTIVE SESSION",
    {
        room,
        studentId
    }
);

            }
            else {

                const disconnectedAt =
                    new Date();


                /*
                ------------------------------------------
                ENSURE CONNECTION EVENTS ARRAY
                ------------------------------------------
                */

                if (
                    !Array.isArray(
                        student.connectionEvents
                    )
                ) {

                    student.connectionEvents =
                        [];

                }


                /*
                ------------------------------------------
                ADD DISCONNECT EVENT
                ------------------------------------------
                */

                student.connectionEvents.push({

                    disconnectedAt:
                        disconnectedAt,

                    reconnectedAt:
                        null

                });


                /*
                ------------------------------------------
                INCREASE DISCONNECT COUNT
                ------------------------------------------
                */

                student.disconnectCount =
                    (
                        student.disconnectCount ||
                        0
                    ) + 1;


                await dailyClass.save();


                console.log(
                    "================================================"
                );

                console.log(
                    "DAILY CLASS DETAILS: STUDENT DISCONNECTED"
                );

                console.log(
                    "Room:",
                    room
                );

                console.log(
                    "Student:",
                    student.studentName
                );

                console.log(
                    "Student ID:",
                    studentId
                );

                console.log(
                    "Disconnected:",
                    disconnectedAt.toISOString()
                );

                console.log(
                    "Total Disconnects:",
                    student.disconnectCount
                );

                console.log(
                    "================================================"
                );

            }

        }

    }
    catch (
        error
    ) {

        console.error(
            "DAILY CLASS DETAILS: STUDENT DISCONNECT ERROR:",
            error
        );

    }

}


console.log(
    "=========================================="
);

                    console.log(
                        "MEETING PARTICIPANT DISCONNECTED"
                    );

                    console.log(
                        "Socket:",
                        socket.id
                    );

                    console.log(
                        "Role:",
                        role
                    );

                    console.log(
                        "Name:",
                        socket.name
                    );

                    console.log(
                        "Room:",
                        room
                    );

                    console.log(
                        "=========================================="
                    );


                    /*
                    ==================================================
                    MARK PARTICIPANT OFFLINE FIRST
                    ==================================================
                    */

                    const participant =
                        getParticipants(room)
                            .find(
                                p =>
                                    p.socketId ===
                                    socket.id
                            );


                    if (participant) {

                        participant.status =
                            "Offline";

                    }


                    /*
                    ==================================================
                    STUDENT DATABASE ATTENDANCE

                    Preserve existing attendance behavior.
                    ==================================================
                    */

                    if (
                        role === "student" &&
                        studentId &&
                        periodId &&
                        mongoose.Types.ObjectId.isValid(
                            periodId
                        )
                    ) {

                        try {

                            const session =
                                await TeacherSession.findOne({

                                    periodId:
                                        new mongoose.Types.ObjectId(
                                            periodId
                                        )

                                });


                            if (session) {

                                const student =
                                    session.joinedStudents.find(
                                        s =>
                                            s.student &&
                                            s.student
                                                .toString() ===
                                                studentId.toString()
                                    );


                                if (student) {

                                    student.leftAt =
                                        new Date();

                                    student.isOnline =
                                        false;


                                    const currentSessionSeconds =
                                        Math.floor(
                                            (
                                                student.leftAt -
                                                student.joinedAt
                                            ) / 1000
                                        );


                                    student.duration =
                                        (
                                            student.duration ||
                                            0
                                        ) +
                                        currentSessionSeconds;


                                    await session.save();


                                    console.log(
                                        "Student disconnected - attendance updated"
                                    );

                                }

                            }

                        } catch (error) {

                            console.error(
                                "Student disconnect attendance error:",
                                error
                            );

                        }

                    }


                    /*
                    ==================================================
                    NOTIFY ROOM THAT PARTICIPANT IS TEMPORARILY
                    DISCONNECTED.

                    We keep the participant for 15 seconds so a
                    reconnect does not immediately remove the card.
                    ==================================================
                    */

                    socket.to(room).emit(
                        "participantReconnecting",
                        {

                            socketId:
                                socket.id,

                            role:
                                role,

                            name:
                                socket.name

                        }
                    );


                    /*
                    ==================================================
                    15 SECOND RECONNECT WINDOW
                    ==================================================
                    */

                    setTimeout(
                        async () => {


                            if (
                                !meetingMemory.participants[room]
                            ) {

                                return;

                            }


                            /*
                            Find participant by identity,
                            NOT by old socket ID.

                            This is critical for reconnect.
                            */

                            let currentParticipant =
                                null;


                            if (studentId) {

                                currentParticipant =
                                    meetingMemory.participants[room]
                                        .find(
                                            p =>
                                                p.studentId &&
                                                p.studentId.toString() ===
                                                    studentId.toString()
                                        );

                            }


                            if (
                                !currentParticipant &&
                                socket.userId
                            ) {

                                currentParticipant =
                                    meetingMemory.participants[room]
                                        .find(
                                            p =>
                                                p.userId &&
                                                p.userId.toString() ===
                                                    socket.userId.toString()
                                        );

                            }


                            if (!currentParticipant) {

                                currentParticipant =
                                    meetingMemory.participants[room]
                                        .find(
                                            p =>
                                                p.role === role &&
                                                p.name ===
                                                    socket.name
                                        );

                            }


                            /*
                            --------------------------------------------------
                            PARTICIPANT RECONNECTED

                            The participant now has a different socket ID.
                            Do NOT remove them.
                            --------------------------------------------------
                            */

                            if (
                                currentParticipant &&
                                currentParticipant.socketId !==
                                    socket.id &&
                                currentParticipant.status ===
                                    "Online"
                            ) {

                                console.log(
    "Reconnect detected - keeping participant:",
    currentParticipant.name
);

                                /*
==========================================================
DAILY CLASS DETAILS
STUDENT RECONNECT TRACKING
==========================================================
*/

if (
    role === "student" &&
    studentId &&
    room
) {

    try {

        const dailyClass =
    await DailyClassDetails.findOne({

        room: room

    }).sort({
        createdAt: -1
    });

        if (
            !dailyClass
        ) {

            console.warn(
                "DAILY CLASS DETAILS: ACTIVE SESSION NOT FOUND FOR STUDENT RECONNECT",
                {
                    room,
                    name,
                    studentId
                }
            );

        }
        else {

            const student =
                dailyClass.students.find(
                    item =>
                        String(
                            item.studentId
                        ) ===
                        String(
                            studentId
                        )
                );


            if (
                !student
            ) {

                console.warn(
                    "DAILY CLASS DETAILS: STUDENT NOT FOUND FOR RECONNECT",
                    {
                        room,
                        name,
                        studentId
                    }
                );

            }
            else {

                /*
                ------------------------------------------
                ENSURE CONNECTION EVENTS ARRAY
                ------------------------------------------
                */

                if (
                    !Array.isArray(
                        student.connectionEvents
                    )
                ) {

                    student.connectionEvents =
                        [];

                }


                /*
                ------------------------------------------
                FIND LATEST OPEN DISCONNECT EVENT

                We search from the end because the latest
                disconnect must be closed first.
                ------------------------------------------
                */

                let latestOpenEvent =
                    null;


                for (
                    let i =
                        student.connectionEvents.length - 1;

                    i >= 0;

                    i--
                ) {

                    if (
                        student
                            .connectionEvents[i]
                            .disconnectedAt &&

                        !
                        student
                            .connectionEvents[i]
                            .reconnectedAt
                    ) {

                        latestOpenEvent =
                            student
                                .connectionEvents[i];

                        break;

                    }

                }


                /*
                ------------------------------------------
                UPDATE RECONNECT TIME
                ------------------------------------------
                */

                if (
                    latestOpenEvent
                ) {

                    const reconnectedAt =
                        new Date();


                    latestOpenEvent.reconnectedAt =
                        reconnectedAt;


                    await dailyClass.save();


                    console.log(
                        "================================================"
                    );

                    console.log(
                        "DAILY CLASS DETAILS: STUDENT RECONNECTED"
                    );

                    console.log(
                        "Room:",
                        room
                    );

                    console.log(
                        "Student:",
                        student.studentName
                    );

                    console.log(
                        "Student ID:",
                        studentId
                    );

                    console.log(
                        "Disconnected:",
                        latestOpenEvent
                            .disconnectedAt
                            .toISOString()
                    );

                    console.log(
                        "Reconnected:",
                        reconnectedAt
                            .toISOString()
                    );

                    console.log(
                        "================================================"
                    );

                }
                else {

                    console.log(
                        "DAILY CLASS DETAILS: NO PENDING STUDENT RECONNECT"
                    );

                }

            }

        }

    }
    catch (
        error
    ) {

        console.error(
            "DAILY CLASS DETAILS: STUDENT RECONNECT ERROR:",
            error
        );

    }

}

                                return;

                            }


                            /*
--------------------------------------------------
REALLY LEFT
--------------------------------------------------
*/

if (
    meetingMemory.participants[room]
) {

    meetingMemory.participants[room] =
        meetingMemory.participants[room]
            .filter(
                p =>
                    p.socketId !==
                    socket.id
            );

}


/*
--------------------------------------------------
SCREEN SHARE CLEANUP

If the teacher who owned the screen share
has REALLY left the classroom, remove the
screen-share ownership.

This is NOT done during temporary reconnect.
--------------------------------------------------
*/

if (
    role === "teacher" &&
    meetingMemory.screenShare &&
    meetingMemory.screenShare[room] &&
    meetingMemory.screenShare[room].teacherSocketId ===
        socket.id
) {

    delete meetingMemory.screenShare[room];

    console.log(
        "SCREEN SHARE OWNER LEFT - SCREEN SHARE MEMORY CLEARED:",
        room
    );

    io.to(room).emit(
        "screen-stop"
    );

}


                            /*
                            Notify everyone.
                            */

                            io.to(room).emit(
                                "participantLeft",
                                {

                                    socketId:
                                        socket.id,

                                    role:
                                        role,

                                    name:
                                        socket.name

                                }
                            );


                            /*
                            Keep compatibility with old frontend.
                            */

                            io.to(room).emit(
                                "userDisconnected",
                                socket.id
                            );


                            /*
                            --------------------------------------------------
                            IF ROOM IS EMPTY

                            Clean temporary memory.
                            --------------------------------------------------
                            */

                            if (
                                getParticipants(room)
                                    .length === 0
                            ) {

                                delete meetingMemory
                                    .participants[room];


                                if (
                                    meetingMemory.screenShare &&
                                    meetingMemory.screenShare[room]
                                ) {

                                    delete meetingMemory
                                        .screenShare[room];

                                }


                                console.log(
                                    "Empty room cleaned:",
                                    room
                                );

                                return;

                            }


                            /*
                            --------------------------------------------------
                            TEACHER ATTENDANCE

                            Only close the TeacherSession when NO TEACHER
                            remains online in this room.

                            This supports 2 teachers.
                            --------------------------------------------------
                            */

                            if (
                                role === "teacher" &&
                                periodId &&
                                mongoose.Types.ObjectId.isValid(
                                    periodId
                                )
                            ) {


                                const onlineTeachers =
                                    countRole(
                                        room,
                                        "teacher"
                                    );


                                if (
                                    onlineTeachers === 0
                                ) {

                                    try {

                                        const session =
                                            await TeacherSession.findOne({

                                                periodId:
                                                    new mongoose.Types.ObjectId(
                                                        periodId
                                                    )

                                            });


                                        if (session) {

                                            session.teacherLeft =
                                                new Date();

                                            session.classEnded =
                                                new Date();


                                            if (
                                                session.teacherJoined
                                            ) {

                                                session.teacherDuration =
                                                    Math.floor(
                                                        (
                                                            session.teacherLeft -
                                                            session.teacherJoined
                                                        ) / 1000
                                                    );

                                                session.actualClassDuration =
                                                    session.teacherDuration;

                                            }


                                            await session.save();


                                            console.log(
                                                "All teachers left - Teacher Session Closed"
                                            );

                                        }

                                    } catch (error) {

                                        console.error(
                                            "Teacher session close error:",
                                            error
                                        );

                                    }

                                } else {

                                    console.log(
                                        "One or more teachers still online. Session remains active."
                                    );

                                }

                            }

                        },
                        15000
                    );

                }
            );

        }
    );

};