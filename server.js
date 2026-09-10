require("dotenv").config();

const express = require("express");
const path = require("path");
const fs = require("fs");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

const discountRoutes =
    require("./routes/discountRoutes");

const Recording =
    require("./models/Recording");

const ClassSummary =
    require("./models/ClassSummary");

const Annotation =
    require("./models/Annotation");

const curiosityRoutes =
    require("./routes/curiosityRoutes");

const aiRoutes =
    require("./routes/aiRoutes");

const registerMeetingSocket =
    require("./socket/meetingSocket");

const meetingMemory =
    require("./core/meetingMemory");


// =========================================================
// FILE STORAGE
// =========================================================

const storageFile = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "uploads/");

    },

    filename: function (req, file, cb) {

        const ext =
            file.originalname.split(".").pop();

        const fileName =
            Date.now() + "." + ext;

        cb(null, fileName);

    }

});

const uploadFile =
    multer({
        storage: storageFile
    });


// =========================================================
// CREATE REQUIRED FOLDERS
// =========================================================

if (!fs.existsSync("recordings")) {

    fs.mkdirSync("recordings");

}

if (!fs.existsSync("uploads")) {

    fs.mkdirSync("uploads");

}


// =========================================================
// MEMORY
// =========================================================

let roomControl = {};

let raisedHands = {};

let boardLock = {};

let boardData = {};

let teacherAttendanceMemory = {};

let annotationActive = {};

let roomParticipants = {};


// =========================================================
// ANNOTATION STUDENT PERMISSION
// =========================================================

let annotationPermission = {};


// =========================================================
// ROUTES
// =========================================================

const studentAttendanceRoutes =
    require("./routes/studentattendanceRoutes");

const founderTimeClashRoutes =
    require("./routes/founderTimeClashRoutes");

const authRoutes =
    require("./routes/authRoutes");

const annotationMaterialRoutes =
    require("./routes/annotationMaterialRoutes");

const teacherSessionRoutes =
    require("./routes/teacherSessionRoutes");

const teacherRoutes =
    require("./routes/teacherRoutes");

const founderRoutes =
    require("./routes/founderRoutes");

const aiClassroomRoutes =
    require("./routes/aiClassroomRoutes");

const aiSpeechRoutes =
    require("./routes/aiSpeechRoutes");

const bankStatementRoutes =
    require("./routes/bankStatementRoutes");

const demoVideoRoutes =
    require("./routes/demoVideoRoutes");

const academyCalendarRoutes =
    require("./routes/academyCalendarRoutes");

const errorReportRoutes =
    require("./routes/errorReportRoutes");

const admissionAccountRoutes =
    require("./routes/admissionAccountRoutes");

const studentRoutes =
    require("./routes/studentRoutes");

const admissionRoutes =
    require("./routes/admissionRoutes");

const admissionParentRoutes =
    require("./routes/admissionParentRoutes");


// =========================================================
// WHATSAPP SERVICE
// =========================================================

const {
    sendWhatsAppMessage
} = require("./services/whatsappService");


// =========================================================
// CRON JOBS
// =========================================================

require("./cron/sessionCron");
require("./cron/attendanceCron");
require("./cron/attendanceAutoExit");


// =========================================================
// EXPRESS APP
// =========================================================

const app = express();


// =========================================================
// STATIC FILES
// =========================================================

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

app.use(
    express.static(__dirname)
);


// =========================================================
// CORS
// =========================================================

app.use(
    cors({

        origin: [

            "https://www.gopespinnacle.com",

            "https://gopespinnacle.com",

            "http://localhost:5500",

            "http://127.0.0.1:5500"

        ],

        credentials: true,

        methods: [

            "GET",
            "POST",
            "PUT",
            "DELETE",
            "OPTIONS"

        ],

        allowedHeaders: [

            "Content-Type",
            "Authorization"

        ]

    })
);

app.options("*", cors());


// =========================================================
// HTTP SERVER
// =========================================================

const server =
    http.createServer(app);


// =========================================================
// SOCKET.IO
// =========================================================

const io =
    new Server(server, {

        cors: {

            origin: [

                "https://www.gopespinnacle.com",

                "https://gopespinnacle.com"

            ],

            methods: [
                "GET",
                "POST"
            ],

            credentials: true

        },

        transports: [

            "websocket",
            "polling"

        ]

    });


// =========================================================
// VIRTUAL CLASSROOM V2 SOCKET ENGINE
// =========================================================

registerMeetingSocket(io);


// =========================================================
// TEST
// =========================================================

app.get("/", (req, res) => {

    res.send(
        "🚀 Academy ERP Backend Running Successfully"
    );

});


// =========================================================
// BODY PARSER
// =========================================================

app.use(
    express.json({
        limit: "100mb"
    })
);


// =========================================================
// PDF / UPLOAD STATIC FILES
// =========================================================

app.use(
    "/uploads",
    express.static("uploads", {

        setHeaders: (res, filePath) => {

            if (filePath.endsWith(".pdf")) {

                res.setHeader(
                    "Content-Type",
                    "application/pdf"
                );

                res.setHeader(
                    "Content-Disposition",
                    "inline"
                );

            }

        }

    })
);


// =========================================================
// API ROUTES
// =========================================================

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/admission-account",
    admissionAccountRoutes
);

app.use(
    "/api/teacher",
    teacherRoutes
);

app.use(
    "/api/teacher-session",
    teacherSessionRoutes
);

app.use(
    "/api/demo-videos",
    demoVideoRoutes
);

app.use(
    "/api/academy-calendar",
    academyCalendarRoutes
);


// =========================================================
// FOUNDER
// =========================================================

app.use(
    "/api/founder",
    founderRoutes
);

app.use(
    "/api/founder/ai-classroom",
    aiClassroomRoutes
);

app.use(
    "/api/ai",
    aiClassroomRoutes
);

app.use(
    "/api/ai",
    aiSpeechRoutes
);

app.use(
    "/api/founder/bank-statements",
    bankStatementRoutes
);

app.use(
    "/api/founder",
    errorReportRoutes
);

app.use(
    "/api/founder",
    founderTimeClashRoutes
);


// =========================================================
// STUDENT
// =========================================================

app.use(
    "/api/student",
    studentRoutes
);


// =========================================================
// CLASS SESSION
// =========================================================

const classSessionRoutes =
    require("./routes/classSessionRoutes");

app.use(
    "/api/class-session",
    classSessionRoutes
);


// =========================================================
// CURIOSITY / AI
// =========================================================

app.use(
    "/api/curiosity",
    curiosityRoutes
);

app.use(
    "/api/ai",
    aiRoutes
);


// =========================================================
// ANNOTATION MATERIALS
// =========================================================

app.use(
    "/api/annotation-materials",
    annotationMaterialRoutes
);


// =========================================================
// ADMISSION
// =========================================================

app.use(
    "/api",
    admissionRoutes
);

app.use(
    "/api",
    admissionRoutes
);

app.use(
    "/api/admission-parent",
    admissionParentRoutes
);


// =========================================================
// DISCOUNT
// =========================================================

app.use(
    "/discount",
    discountRoutes
);


// =========================================================
// UPLOAD FILE
// =========================================================

app.post(
    "/upload-file",
    uploadFile.single("file"),
    (req, res) => {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message: "No file uploaded"

            });

        }

        const filePath =
            path.join(
                __dirname,
                "uploads",
                req.file.filename
            );

        const fileUrl =
            `https://academy-backend-eatl.onrender.com/uploads/${req.file.filename}`;

        res.setHeader(
            "Content-Type",
            req.file.mimetype
        );

        res.json({

            url: fileUrl

        });

    }
);


// =========================================================
// WHATSAPP TEST
// =========================================================

app.get(
    "/test-whatsapp",
    async (req, res) => {

        const axios =
            require("axios");

        try {

            await axios.post(

                `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,

                {

                    messaging_product:
                        "whatsapp",

                    to:
                        "919566911472",

                    type:
                        "text",

                    text: {

                        body:
                            "🔥 Test message working!"

                    }

                },

                {

                    headers: {

                        Authorization:
                            `Bearer ${process.env.WHATSAPP_TOKEN}`,

                        "Content-Type":
                            "application/json"

                    }

                }

            );

            res.send(
                "✅ WhatsApp sent"
            );

        }
        catch (err) {

            console.log(
                err.response?.data ||
                err.message
            );

            res.send(
                "❌ Failed"
            );

        }

    }
);


// =========================================================
// WHATSAPP SERVICE TEST
// =========================================================

app.get(
    "/test-whatsapp-service",
    async (req, res) => {

        const result =
            await sendWhatsAppMessage(

                "919566911472",

                "🎉 WhatsApp Service is working from Gopes Pinnacle Academy Backend!"

            );

        if (result.success) {

            return res.json({

                success: true,

                message:
                    "WhatsApp message sent successfully",

                data:
                    result.data

            });

        }

        return res.status(500).json({

            success: false,

            message:
                "WhatsApp message failed",

            error:
                result.error

        });

    }
);


// =========================================================
// WEBHOOK
// =========================================================

const webhookRoutes =
    require("./routes/webhook");

app.use(
    "/api",
    webhookRoutes
);


// =========================================================
// STUDENT ATTENDANCE
// =========================================================

app.use(
    "/api/student-attendance",
    studentAttendanceRoutes
);


// =========================================================
// PERIOD ASSIGNMENTS
// =========================================================

const PeriodAssignment =
    require("./models/PeriodAssignment");

const LessonPlan =
    require("./models/LessonPlan");

const Homework =
    require("./models/Homework");


app.get(
    "/api/founder/periodassignments",
    async (req, res) => {

        try {

            const data =
                await PeriodAssignment
                    .find()
                    .populate(
                        "teacher",
                        "name"
                    )
                    .populate(
                        "assignments.student",
                        "name"
                    );

            res.json({
                data
            });

        }
        catch (err) {

            console.log(err);

            res.status(500).json({

                message:
                    "Error fetching periods"

            });

        }

    }
);


// =========================================================
// DELETE PERIOD ASSIGNMENT
// =========================================================

app.delete(
    "/api/founder/periodassignments/:id",
    async (req, res) => {

        try {

            const periodId =
                req.params.id;

            console.log(
                "=========================================="
            );

            console.log(
                "FOUNDER DELETE PERIOD"
            );

            console.log(
                "PERIOD ID:",
                periodId
            );

            console.log(
                "=========================================="
            );


            // ==================================================
            // 1. FIND PERIOD
            // ==================================================

            const period =
                await PeriodAssignment.findById(
                    periodId
                );


            if (!period) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Period not found."

                });

            }


            // ==================================================
            // 2. FIND LESSON PLANS
            // ==================================================

            const lessonPlans =
                await LessonPlan.find({

                    periodId:
                        period._id

                }).select("_id");


            const lessonPlanIds =
                lessonPlans.map(
                    plan => plan._id
                );


            console.log(
                "LESSON PLANS FOUND:",
                lessonPlanIds.length
            );


            // ==================================================
            // 3. DELETE HOMEWORK
            // ==================================================

            if (
                lessonPlanIds.length > 0
            ) {

                const homeworkDeleteResult =
                    await Homework.deleteMany({

                        lessonPlan: {

                            $in:
                                lessonPlanIds

                        }

                    });


                console.log(
                    "HOMEWORK RECORDS DELETED:",
                    homeworkDeleteResult.deletedCount
                );

            }


            // ==================================================
            // 4. DELETE LESSON PLANS
            // ==================================================

            const lessonPlanDeleteResult =
                await LessonPlan.deleteMany({

                    periodId:
                        period._id

                });


            console.log(
                "LESSON PLANS DELETED:",
                lessonPlanDeleteResult.deletedCount
            );


            // ==================================================
            // 5. DELETE PERIOD
            // ==================================================

            await PeriodAssignment.findByIdAndDelete(
                period._id
            );


            console.log(
                "PERIOD ASSIGNMENT DELETED:",
                period._id
            );


            // ==================================================
            // 6. SUCCESS
            // ==================================================

            res.json({

                success: true,

                message:
                    "Period, lesson plans and homework deleted successfully."

            });

        }
        catch (err) {

            console.error(
                "FOUNDER PERIOD DELETE ERROR:",
                err
            );

            res.status(500).json({

                success: false,

                message:
                    "Failed to delete period and related homework.",

                error:
                    err.message

            });

        }

    }
);


// =========================================================
// SOCKET.IO — EXISTING CLASSROOM FEATURES
// =========================================================

io.on(
    "connection",
    (socket) => {


        // ==================================================
        // DRAW
        // ==================================================

        socket.on(
            "draw",
            (data) => {

                if (
                    !boardData[data.room]
                ) {

                    boardData[data.room] = [];

                }

                boardData[data.room].push(
                    data
                );

                socket
                    .to(data.room)
                    .emit(
                        "draw",
                        data
                    );

            }
        );


        // ==================================================
        // SCREEN DRAW
        // ==================================================

        socket.on(
            "screenDraw",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "screenDraw",
                        data
                    );

            }
        );


        // ==================================================
        // EMOJI REACTION
        // ==================================================

        socket.on(
            "emojiReaction",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "emojiReaction",
                        data
                    );

            }
        );


        // ==================================================
        // TEXT DRAW
        // ==================================================

        socket.on(
            "textDraw",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "textDraw",
                        data
                    );

            }
        );


        // ==================================================
        // CANVAS TYPE SYNC
        // ==================================================

        socket.on(
            "canvasTypeChanged",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "canvasTypeChanged",
                        {

                            type:
                                data.type

                        }
                    );

            }
        );


        // ==================================================
        // FILE SHARE
        // ==================================================

        socket.on(
            "fileShare",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "fileShare",
                        data
                    );

            }
        );


        // ==================================================
        // LOAD PDF
        // ==================================================

        socket.on(
            "loadPDF",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "loadPDF",
                        data
                    );

            }
        );


        // ==================================================
        // CLEAR
        // ==================================================

        socket.on(
            "clear",
            (room) => {

                boardData[room] = [];

                socket
                    .to(room)
                    .emit(
                        "clear"
                    );

            }
        );


        // ==================================================
        // PAGE CHANGE
        // ==================================================

        socket.on(
            "pageChange",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "pageChanged",
                        {

                            page:
                                data.page

                        }
                    );

            }
        );


        // ==================================================
        // GIVE CONTROL
        // ==================================================

        socket.on(
            "giveControl",
            async (data) => {

                roomControl[data.room] =
                    data.studentId;

                io
                    .to(data.room)
                    .emit(
                        "controlChanged",
                        {

                            studentId:
                                data.studentId

                        }
                    );

            }
        );


        // ==================================================
        // LOCK BOARD
        // ==================================================

        socket.on(
            "lockBoard",
            (room) => {

                boardLock[room] =
                    true;

                io
                    .to(room)
                    .emit(
                        "boardLocked",
                        true
                    );

            }
        );


        // ==================================================
        // UNLOCK BOARD
        // ==================================================

        socket.on(
            "unlockBoard",
            (room) => {

                boardLock[room] =
                    false;

                io
                    .to(room)
                    .emit(
                        "boardLocked",
                        false
                    );

            }
        );


        // ==================================================
        // PDF SYNC
        // ==================================================

        socket.on(
            "pdfUpload",
            (data) => {

                socket
                    .to(data.room)
                    .emit(
                        "pdfReceive",
                        {

                            pdfData:
                                data.pdfData

                        }
                    );

            }
        );


        // ==================================================
        // RAISE HAND
        // ==================================================

        socket.on(
            "raiseHand",
            (data) => {

                if (
                    !raisedHands[data.room]
                ) {

                    raisedHands[data.room] =
                        [];

                }

                if (
                    !raisedHands[data.room]
                        .some(
                            s =>
                                s.studentId ===
                                data.studentId
                        )
                ) {

                    raisedHands[data.room].push({

                        studentId:
                            data.studentId,

                        name:
                            data.name

                    });

                }

                io
                    .to(data.room)
                    .emit(
                        "handList",
                        raisedHands[data.room]
                    );

            }
        );


        // ==================================================
        // LOWER HAND
        // ==================================================

        socket.on(
            "lowerHand",
            (data) => {

                if (
                    raisedHands[data.room]
                ) {

                    raisedHands[data.room] =
                        raisedHands[data.room]
                            .filter(
                                s =>
                                    s.studentId !==
                                    data.studentId
                            );

                }

                io
                    .to(data.room)
                    .emit(
                        "handList",
                        raisedHands[data.room] || []
                    );

            }
        );


        // ==================================================
        // ANNOTATION START
        // ==================================================

        socket.on(
            "annotationStart",
            (data) => {

                try {

                    if (
                        !data ||
                        !data.room
                    ) {

                        return;

                    }

                    annotationActive[data.room] =
                        true;

                    annotationPermission[data.room] =
                        null;

                    io
                        .to(data.room)
                        .emit(
                            "annotationStarted",
                            {

                                room:
                                    data.room

                            }
                        );

                    console.log(
                        "ANNOTATION V1: STARTED",
                        data.room
                    );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION V1: START ERROR",
                        err
                    );

                }

            }
        );


        // ==================================================
        // ANNOTATION STOP
        // ==================================================

        socket.on(
            "annotationStop",
            (data) => {

                try {

                    if (
                        !data ||
                        !data.room
                    ) {

                        return;

                    }

                    annotationActive[data.room] =
                        false;

                    annotationPermission[data.room] =
                        null;

                    io
                        .to(data.room)
                        .emit(
                            "annotationStopped",
                            {

                                room:
                                    data.room

                            }
                        );

                    console.log(
                        "ANNOTATION V1: STOPPED",
                        data.room
                    );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION V1: STOP ERROR",
                        err
                    );

                }

            }
        );


        // ==================================================
        // ANNOTATION STATUS
        // ==================================================

        socket.on(
            "annotationStatus",
            (room) => {

                try {

                    if (!room) {

                        return;

                    }

                    socket.emit(
                        "annotationStatus",
                        {

                            room:
                                room,

                            active:
                                annotationActive[room] === true

                        }
                    );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION V1: STATUS ERROR",
                        err
                    );

                }

            }
        );


        // ==================================================
        // ANNOTATION GIVE PERMISSION
        // ==================================================

        socket.on(
            "annotationGivePermission",
            (data) => {

                try {

                    if (
                        !data ||
                        !data.room ||
                        !data.studentSocketId
                    ) {

                        return;

                    }

                    if (
                        socket.role !==
                        "teacher"
                    ) {

                        console.log(
                            "ANNOTATION PERMISSION DENIED: NOT TEACHER",
                            socket.id
                        );

                        return;

                    }

                    const student =
                        roomParticipants[data.room]
                            ?.find(
                                p =>
                                    p.socketId ===
                                    data.studentSocketId &&
                                    p.role ===
                                    "student"
                            );

                    if (!student) {

                        console.log(
                            "ANNOTATION PERMISSION DENIED: STUDENT NOT FOUND",
                            data.studentSocketId
                        );

                        return;

                    }

                    annotationPermission[data.room] =
                        data.studentSocketId;

                    io
                        .to(data.room)
                        .emit(
                            "annotationPermissionChanged",
                            {

                                room:
                                    data.room,

                                studentSocketId:
                                    data.studentSocketId

                            }
                        );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION PERMISSION GRANT ERROR:",
                        err
                    );

                }

            }
        );


        // ==================================================
        // ANNOTATION REVOKE PERMISSION
        // ==================================================

        socket.on(
            "annotationRevokePermission",
            (data) => {

                try {

                    if (
                        !data ||
                        !data.room
                    ) {

                        return;

                    }

                    if (
                        socket.role !==
                        "teacher"
                    ) {

                        console.log(
                            "ANNOTATION PERMISSION REVOKE DENIED: NOT TEACHER",
                            socket.id
                        );

                        return;

                    }

                    annotationPermission[data.room] =
                        null;

                    io
                        .to(data.room)
                        .emit(
                            "annotationPermissionChanged",
                            {

                                room:
                                    data.room,

                                studentSocketId:
                                    null

                            }
                        );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION PERMISSION REVOKE ERROR:",
                        err
                    );

                }

            }
        );


        // ==================================================
        // SAVE ANNOTATION
        // ==================================================

        socket.on(
            "annotationSave",
            async (data) => {

                try {

                    if (
                        !data ||
                        !data.room ||
                        !data.annotationKey
                    ) {

                        return;

                    }

                    await Annotation.findOneAndUpdate(

                        {

                            room:
                                data.annotationKey

                        },

                        {

                            room:
                                data.annotationKey,

                            data:
                                data.data

                        },

                        {

                            upsert:
                                true,

                            new:
                                true,

                            setDefaultsOnInsert:
                                true

                        }

                    );

                    socket
                        .to(data.room)
                        .emit(
                            "annotationUpdated",
                            {

                                room:
                                    data.room,

                                annotationKey:
                                    data.annotationKey,

                                data:
                                    data.data

                            }
                        );

                    console.log(
                        "ANNOTATION V1: SAVED",
                        data.annotationKey
                    );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION V1: SAVE ERROR",
                        err
                    );

                }

            }
        );


        // ==================================================
        // LOAD ANNOTATION
        // ==================================================

        socket.on(
            "annotationLoad",
            async (request) => {

                try {

                    if (
                        !request ||
                        !request.room ||
                        !request.annotationKey
                    ) {

                        return;

                    }

                    const annotation =
                        await Annotation.findOne({

                            room:
                                request.annotationKey

                        });

                    socket.emit(
                        "annotationLoaded",
                        {

                            room:
                                request.room,

                            annotationKey:
                                request.annotationKey,

                            data:
                                annotation
                                    ? annotation.data
                                    : null

                        }
                    );

                    console.log(
                        "ANNOTATION V1: LOADED",
                        request.annotationKey
                    );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION V1: LOAD ERROR",
                        err
                    );

                }

            }
        );


        // ==================================================
        // CLEAR ANNOTATION
        // ==================================================

        socket.on(
            "annotationClear",
            async (room) => {

                try {

                    if (!room) {

                        return;

                    }

                    await Annotation.findOneAndUpdate(

                        {

                            room:
                                room

                        },

                        {

                            room:
                                room,

                            data:
                                null

                        },

                        {

                            upsert:
                                true

                        }

                    );

                    io
                        .to(room)
                        .emit(
                            "annotationCleared"
                        );

                    console.log(
                        "ANNOTATION V1: CLEARED",
                        room
                    );

                }
                catch (err) {

                    console.log(
                        "ANNOTATION V1: CLEAR ERROR",
                        err
                    );

                }

            }
        );

    }
);


// =========================================================
// RECORDING STORAGE
// =========================================================

const storage =
    multer.diskStorage({

        destination:
            function (req, file, cb) {

                cb(
                    null,
                    "recordings/"
                );

            },

        filename:
            function (req, file, cb) {

                const uniqueName =
                    Date.now() + ".webm";

                cb(
                    null,
                    uniqueName
                );

            }

    });

const upload =
    multer({
        storage
    });


// =========================================================
// RECORDINGS STATIC
// =========================================================

app.use(
    "/recordings",
    express.static("recordings")
);


// =========================================================
// UPLOAD RECORDING
// =========================================================

app.post(
    "/api/upload-recording",
    upload.single("video"),
    async (req, res) => {

        try {

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "No file uploaded"

                });

            }

            const {
                className,
                subject,
                teacherId
            } = req.body;

            const fileUrl =
                `https://academy-backend-eatl.onrender.com/recordings/${req.file.filename}`;


            await Recording.create({

                className,

                subject,

                teacherId,

                videoUrl:
                    fileUrl

            });


            res.json({

                message:
                    "Uploaded",

                url:
                    fileUrl

            });

        }
        catch (err) {

            console.log(
                "RECORDING UPLOAD ERROR:",
                err
            );

            res.status(500).json({

                message:
                    "Recording upload failed"

            });

        }

    }
);


// =========================================================
// GET RECORDINGS
// =========================================================

app.get(
    "/api/recordings/:className",
    async (req, res) => {

        const token =
            req.headers.authorization
                ?.split(" ")[1];

        if (!token) {

            return res.status(401).json({

                message:
                    "No token"

            });

        }

        try {

            const decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

            if (
                decoded.role !==
                "student"
            ) {

                return res.status(403).json({

                    message:
                        "Access denied"

                });

            }

            const {
                subject
            } = req.query;

            let filter = {

                className:
                    req.params.className

            };

            if (subject) {

                filter.subject =
                    subject;

            }

            const data =
                await Recording
                    .find(filter)
                    .sort({
                        createdAt: -1
                    });

            res.json({
                data
            });

        }
        catch (err) {

            res.status(401).json({

                message:
                    "Invalid token"

            });

        }

    }
);


// =========================================================
// CLASS SUMMARY
// =========================================================

app.post(
    "/api/save-class-summary",
    async (req, res) => {

        try {

            const {

                sessionId,

                room,

                className,

                date,

                day,

                periodStart,

                periodEnd,

                subject,

                teacherId,

                teacherName,

                students,

                teacherInTime,

                teacherOutTime,

                homework,

                classSummary

            } = req.body;


            const inTime =
                teacherInTime;

            const outTime =
                teacherOutTime;


            const totalMinutes =
                Math.floor(

                    (
                        new Date(outTime) -
                        new Date(inTime)
                    )
                    /
                    1000
                    /
                    60

                );


            const summary =
                await ClassSummary.create({

                    sessionId,

                    className,

                    date,

                    day,

                    periodStart,

                    periodEnd,

                    subject,

                    teacherId,

                    teacherName,

                    students,

                    teacherInTime:
                        inTime,

                    teacherOutTime:
                        outTime,

                    totalMinutes,

                    homework,

                    classSummary,

                    homeworkStatus:
                        "Pending",

                    status:
                        "Completed"

                });


            delete teacherAttendanceMemory[room];


            res.json({

                success:
                    true,

                data:
                    summary

            });

        }
        catch (err) {

            console.log(err);

            res.status(500).json({

                success:
                    false,

                message:
                    "Error saving summary"

            });

        }

    }
);


// =========================================================
// GET MEETING TIME
// =========================================================

app.get(
    "/api/get-meeting-time",
    async (req, res) => {

        const room =
            req.query.room;

        const data =
            teacherAttendanceMemory[room];


        if (!data) {

            return res.json({

                inTime:
                    "-",

                outTime:
                    "-"

            });

        }


        res.json({

            inTime:
                new Date(
                    data.inTime
                ).toLocaleTimeString(),

            outTime:
                new Date()
                    .toLocaleTimeString()

        });

    }
);


// =========================================================
// DATABASE
// =========================================================

mongoose
    .connect(
        process.env.MONGO_URI
    )
    .then(
        () =>
            console.log(
                "✅ MongoDB Connected"
            )
    )
    .catch(
        err =>
            console.log(
                "❌ MongoDB Error:",
                err
            )
    );


// =========================================================
// HOMEWORK
// =========================================================

const homeworkRoutes =
    require("./routes/homeworkRoutes");

const aiAssessmentRoutes =
    require("./routes/aiAssessmentRoutes");


app.use(
    "/api",
    homeworkRoutes
);

app.use(
    "/api/ai-assessment",
    aiAssessmentRoutes
);


// =========================================================
// SERVER START
// =========================================================

const PORT =
    process.env.PORT || 5000;


server.listen(
    PORT,
    () => {

        console.log(
            `🔥 Server running on port ${PORT}`
        );

    }
);