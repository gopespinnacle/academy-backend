require("dotenv").config();
const discountRoutes =
require("./routes/discountRoutes");
const jwt = require("jsonwebtoken");
const Recording = require("./models/Recording");
const ClassSummary = require("./models/ClassSummary");
const Annotation =
    require("./models/Annotation");
const multer = require("multer");
const curiosityRoutes = require("./routes/curiosityRoutes");
const aiRoutes = require("./routes/aiRoutes");

// ✅ FIX: KEEP FILE EXTENSION
const storageFile = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/");
    },
    filename: function(req, file, cb){
        const ext = file.originalname.split(".").pop(); // get extension
        const fileName = Date.now() + "." + ext; // keep extension
        cb(null, fileName);
    }
});

const uploadFile = multer({ storage: storageFile });
const path = require("path");
const fs = require("fs");

// 🔥 CREATE recordings FOLDER IF NOT EXISTS
if (!fs.existsSync("recordings")) {
    fs.mkdirSync("recordings");
}

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const registerMeetingSocket = require("./socket/meetingSocket");
const meetingMemory = require("./core/meetingMemory");
let roomControl = {};
let raisedHands = {};
let boardLock = {};
let boardData = {}; // 🔥 STORE DRAWINGS
let teacherAttendanceMemory = {};
let annotationActive = {};

let roomParticipants = {};

/* =========================================================
   ANNOTATION STUDENT PERMISSION
   Stores the socket ID of the student currently allowed
   to annotate in each room.
   ========================================================= */

let annotationPermission = {};
// ROUTES
const studentAttendanceRoutes = require("./routes/studentattendanceRoutes");
const founderTimeClashRoutes = require("./routes/founderTimeClashRoutes");
const authRoutes = require("./routes/authRoutes");
const annotationMaterialRoutes =
    require(
        "./routes/annotationMaterialRoutes"
    );
const teacherSessionRoutes = require("./routes/teacherSessionRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const founderRoutes = require("./routes/founderRoutes");
const aiClassroomRoutes =
    require("./routes/aiClassroomRoutes");

const bankStatementRoutes =
require("./routes/bankStatementRoutes");
const demoVideoRoutes = require("./routes/demoVideoRoutes");
const academyCalendarRoutes = require("./routes/academyCalendarRoutes");
const errorReportRoutes = require("./routes/errorReportRoutes");
const admissionAccountRoutes =
require("./routes/admissionAccountRoutes");
const studentRoutes = require("./routes/studentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const admissionParentRoutes =
require("./routes/admissionParentRoutes");
/* ================= WHATSAPP SERVICE ================= */

const {
    sendWhatsAppMessage
} = require("./services/whatsappService");
// CRON JOBS
require("./cron/sessionCron");
require("./cron/attendanceCron");
require("./cron/attendanceAutoExit");
const app = express();
app.use(express.static(__dirname));
app.use(cors({

    origin: [

        "https://www.gopespinnacle.com",

        "https://gopespinnacle.com",

        "http://localhost:5500",

        "http://127.0.0.1:5500"

    ],

    credentials:true,

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

}));
app.options("*", cors());
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: [
            "https://www.gopespinnacle.com",
            "https://gopespinnacle.com"
        ],
        methods: ["GET","POST"],
        credentials:true
    },

    transports:[
        "websocket",
        "polling"
    ]

});

/*
============================================================
Virtual Classroom V2 Socket Engine
============================================================
*/

registerMeetingSocket(io);

/* ================= TEST ================= */
app.get("/", (req, res) => {
    res.send("🚀 Academy ERP Backend Running Successfully");
});

/* ================= Close TEST ================= */

app.use(express.json());
app.use("/uploads", express.static("uploads", {
    setHeaders: (res, filePath) => {

        if (filePath.endsWith(".pdf")) {
            res.setHeader("Content-Type", "application/pdf");

            // 🔥 VERY IMPORTANT LINE
            res.setHeader("Content-Disposition", "inline");
        }
    }
}));

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use(
    "/api/admission-account",
    admissionAccountRoutes
);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher-session", teacherSessionRoutes);
app.use("/api/demo-videos", demoVideoRoutes);
app.use("/api/academy-calendar", academyCalendarRoutes);

// ✅ FIRST load MAIN routes
app.use("/api/founder", founderRoutes);
app.use(
    "/api/founder/ai-classroom",
    aiClassroomRoutes
);


app.use(
    "/api/founder/bank-statements",
    bankStatementRoutes
);

app.use("/api/founder", errorReportRoutes);

// ✅ THEN load additional routes
app.use("/api/founder", founderTimeClashRoutes);

app.use("/api/student", studentRoutes);

const classSessionRoutes =
require("./routes/classSessionRoutes");

app.use(
    "/api/class-session",
    classSessionRoutes
);

app.use("/api/curiosity", curiosityRoutes);
app.use("/api/ai", aiRoutes);

app.use(
    "/api/annotation-materials",
    annotationMaterialRoutes
);

app.use("/api", admissionRoutes);
app.use("/api", admissionRoutes);
app.use(
    "/api/admission-parent",
    admissionParentRoutes
);

app.use(
    "/discount",
    discountRoutes
);
app.post("/upload-file", uploadFile.single("file"), (req, res) => {

    const filePath = path.join(__dirname, "uploads", req.file.filename);

    // 🔥 FORCE correct content-type
    res.setHeader("Content-Type", req.file.mimetype);

    const fileUrl = `https://academy-backend-eatl.onrender.com/uploads/${req.file.filename}`;

    res.json({
        url: fileUrl
    });

});

app.get("/test-whatsapp", async (req, res) => {
  const axios = require("axios");

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: "919566911472",
        type: "text",
        text: {
          body: "🔥 Test message working!"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.send("✅ WhatsApp sent");
  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("❌ Failed");
  }
});

/* =====================================================
   WHATSAPP SERVICE TEST
   ===================================================== */

app.get("/test-whatsapp-service", async (req, res) => {

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
            data: result.data
        });

    }

    return res.status(500).json({
        success: false,
        message:
            "WhatsApp message failed",
        error: result.error
    });

});
const webhookRoutes = require("./routes/webhook");
app.use("/api", webhookRoutes);

app.use("/api/student-attendance", studentAttendanceRoutes);
/* ================= PERIOD ASSIGNMENTS ================= */

const PeriodAssignment = require("./models/PeriodAssignment");  // adjust if path different

app.get("/api/founder/periodassignments", async (req, res) => {

    try{

        const data = await PeriodAssignment.find();

        res.json({ data });

    }catch(err){
        console.log(err);
        res.status(500).json({ message:"Error fetching periods" });
    }

});

app.delete("/api/founder/periodassignments/:id", async (req, res) => {

    try{

        await PeriodAssignment.findByIdAndDelete(req.params.id);

        res.json({ message: "Period deleted successfully ✅" });

    }catch(err){
        console.log(err);
        res.status(500).json({ message: "Delete failed ❌" });
    }

});
/* ================= SOCKET ================= */

io.on("connection", (socket) => {




        // ================= WEBRTC =================

/* ================= TEACHER JOIN ================= */


    /* DRAW */
    // ================= DRAW =================
socket.on("draw", (data) => {

    if(!boardData[data.room]){
        boardData[data.room] = [];
    }

    boardData[data.room].push(data);

    socket.to(data.room).emit("draw", data);
});


// ================= SCREEN DRAW =================
socket.on("screenDraw", (data) => {
    socket.to(data.room).emit("screenDraw", data);
});

// ================= EMOJI REACTION =================
socket.on("emojiReaction", (data) => {

    socket.to(data.room).emit(
        "emojiReaction",
        data
    );
});
// ================= TEXT DRAW =================
socket.on("textDraw", (data) => {

    socket.to(data.room).emit("textDraw", data);

});
// ================= CANVAS TYPE SYNC =================
socket.on("canvasTypeChanged", (data) => {

    socket.to(data.room).emit("canvasTypeChanged", {
        type: data.type
    });

});
socket.on("fileShare", (data) => {
    socket.to(data.room).emit("fileShare", data);
});

socket.on("loadPDF", (data) => {
    socket.to(data.room).emit("loadPDF", data);
});
    /* CLEAR */
    socket.on("clear", (room) => {

    // 🔥 CLEAR MEMORY ALSO
    boardData[room] = [];

    socket.to(room).emit("clear");
});
socket.on("pageChange", (data) => {
    socket.to(data.room).emit("pageChanged", {
        page: data.page
    });
});
    /* GIVE CONTROL */
    socket.on("giveControl", async (data) => {

        // 🔥 1. Update MEMORY (instant)
        roomControl[data.room] = data.studentId;

        // 🔥 2. Update DATABASE (backup)
                // 🔥 3. Notify all users
        io.to(data.room).emit("controlChanged", {
            studentId: data.studentId
        });

    });

    socket.on("lockBoard", (room) => {
    boardLock[room] = true;
    io.to(room).emit("boardLocked", true);
});

socket.on("unlockBoard", (room) => {
    boardLock[room] = false;
    io.to(room).emit("boardLocked", false);
});
    /* ================= PDF SYNC ================= */

socket.on("pdfUpload", (data) => {

    // send to all students in room
    socket.to(data.room).emit("pdfReceive", {
        pdfData: data.pdfData
    });

});
/* ================= RAISE HAND ================= */

socket.on("raiseHand", (data) => {

    if(!raisedHands[data.room]){
        raisedHands[data.room] = [];
    }

    if(!raisedHands[data.room].some(s => s.studentId === data.studentId)){
    raisedHands[data.room].push({
        studentId: data.studentId,
        name: data.name
    });
}

    io.to(data.room).emit("handList", raisedHands[data.room]);
});

socket.on("lowerHand", (data) => {

    if(raisedHands[data.room]){
        raisedHands[data.room] =
    raisedHands[data.room].filter(s => s.studentId !== data.studentId);
    }

    io.to(data.room).emit("handList", raisedHands[data.room] || []);
});

/* ============================================================
   ANNOTATION V1
   SAVE / LOAD / LIVE SYNC
   ============================================================ */

   /*
============================================================
ANNOTATION SESSION STATE
OPEN / CLOSE / STATUS
============================================================
*/


/*
------------------------------------------------------------
TEACHER OPENS ANNOTATION
------------------------------------------------------------
*/

socket.on(
    "annotationStart",
    (data) => {

        try {

            if (!data || !data.room) {

                return;

            }


            /*
            ------------------------------------------------
            REMEMBER ANNOTATION IS ACTIVE
            ------------------------------------------------
            */

            annotationActive[data.room] = true;

            /*
------------------------------------------------
RESET STUDENT ANNOTATION PERMISSION
EVERY NEW ANNOTATION SESSION STARTS LOCKED
------------------------------------------------
*/

annotationPermission[data.room] = null;


            /*
            ------------------------------------------------
            TELL EVERYONE IN THE ROOM
            ------------------------------------------------
            */

            io.to(
                data.room
            ).emit(
                "annotationStarted",
                {
                    room: data.room
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


/*
------------------------------------------------------------
TEACHER CLOSES ANNOTATION
------------------------------------------------------------
*/

socket.on(
    "annotationStop",
    (data) => {

        try {

            if (!data || !data.room) {

                return;

            }


            /*
            ------------------------------------------------
            REMEMBER ANNOTATION IS CLOSED
            ------------------------------------------------
            */

            annotationActive[data.room] = false;



            /*
------------------------------------------------
REMOVE STUDENT ANNOTATION PERMISSION
WHEN ANNOTATION CLOSES
------------------------------------------------
*/

annotationPermission[data.room] = null;


            /*
            ------------------------------------------------
            TELL EVERYONE IN THE ROOM
            ------------------------------------------------
            */

            io.to(
                data.room
            ).emit(
                "annotationStopped",
                {
                    room: data.room
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


/*
------------------------------------------------------------
NEW USER REQUESTS CURRENT ANNOTATION STATE
------------------------------------------------------------
*/

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
                    room: room,

                    active:
                        annotationActive[room] === true
                }
            );


            console.log(
                "ANNOTATION V1: STATUS SENT",
                room,
                annotationActive[room] === true
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

/* =========================================================
   ANNOTATION STUDENT PERMISSION — STEP 1
   ========================================================= */


/*
------------------------------------------------------------
TEACHER GIVES ANNOTATION PERMISSION
------------------------------------------------------------
*/

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


            /*
            ------------------------------------------------
            ONLY TEACHER CAN GIVE PERMISSION
            ------------------------------------------------
            */

            if (
                socket.role !== "teacher"
            ) {

                console.log(
                    "ANNOTATION PERMISSION DENIED: NOT TEACHER",
                    socket.id
                );

                return;

            }


            /*
            ------------------------------------------------
            MAKE SURE TARGET IS A STUDENT
            ------------------------------------------------
            */

            const student =
                roomParticipants[data.room]?.find(
                    p =>
                        p.socketId ===
                        data.studentSocketId &&
                        p.role === "student"
                );


            if (!student) {

                console.log(
                    "ANNOTATION PERMISSION DENIED: STUDENT NOT FOUND",
                    data.studentSocketId
                );

                return;

            }


            /*
            ------------------------------------------------
            SAVE PERMISSION
            ------------------------------------------------
            */

            annotationPermission[data.room] =
                data.studentSocketId;


            /*
            ------------------------------------------------
            TELL EVERYONE WHO HAS PERMISSION
            ------------------------------------------------
            */

            io.to(
                data.room
            ).emit(
                "annotationPermissionChanged",
                {

                    room:
                        data.room,

                    studentSocketId:
                        data.studentSocketId

                }
            );


            console.log(
                "ANNOTATION PERMISSION GRANTED:",
                data.room,
                data.studentSocketId
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


/*
------------------------------------------------------------
TEACHER REVOKES ANNOTATION PERMISSION
------------------------------------------------------------
*/

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


            /*
            ------------------------------------------------
            ONLY TEACHER CAN REVOKE
            ------------------------------------------------
            */

            if (
                socket.role !== "teacher"
            ) {

                console.log(
                    "ANNOTATION PERMISSION REVOKE DENIED: NOT TEACHER",
                    socket.id
                );

                return;

            }


            /*
            ------------------------------------------------
            CLEAR PERMISSION
            ------------------------------------------------
            */

            annotationPermission[data.room] =
                null;


            /*
            ------------------------------------------------
            TELL EVERYONE
            ------------------------------------------------
            */

            io.to(
                data.room
            ).emit(
                "annotationPermissionChanged",
                {

                    room:
                        data.room,

                    studentSocketId:
                        null

                }
            );


            console.log(
                "ANNOTATION PERMISSION REVOKED:",
                data.room
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



/*
============================================================
SAVE ANNOTATION
============================================================
*/

/*
============================================================
SAVE ANNOTATION
============================================================
*/

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


            /*
            ------------------------------------------------
            SAVE USING UNIQUE ANNOTATION SESSION KEY
            ------------------------------------------------
            */

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


            /*
            ------------------------------------------------
            SEND LIVE UPDATE TO CLASSROOM
            ------------------------------------------------

            IMPORTANT:

            We still use data.room here.

            Therefore teacher/student synchronization
            continues to use the normal classroom room.
            ------------------------------------------------
            */

            socket.to(
                data.room
            ).emit(
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


/*
============================================================
LOAD ANNOTATION
============================================================
*/

/*
============================================================
LOAD ANNOTATION
============================================================
*/

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


            /*
            ------------------------------------------------
            FIND SAVED DATA USING UNIQUE SESSION KEY
            ------------------------------------------------
            */

            const annotation =
                await Annotation.findOne(
                    {
                        room:
                            request.annotationKey
                    }
                );


            /*
            ------------------------------------------------
            SEND DATA BACK ONLY TO REQUESTING TAB
            ------------------------------------------------
            */

            socket.emit(
                "annotationLoaded",
                {

                    /*
                    Actual classroom room
                    */

                    room:
                        request.room,


                    /*
                    Unique annotation session
                    */

                    annotationKey:
                        request.annotationKey,


                    /*
                    Saved drawing data
                    */

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



/*
============================================================
CLEAR ANNOTATION
============================================================
*/

socket.on(
    "annotationClear",
    async (room) => {

        try {

            if (!room) {
                return;
            }


            await Annotation.findOneAndUpdate(
                {
                    room: room
                },
                {
                    room: room,
                    data: null
                },
                {
                    upsert: true
                }
            );


            /*
            ------------------------------------------------
            TELL EVERYONE
            ------------------------------------------------
            */

            io.to(
                room
            ).emit(
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

/* ================= LOCK BOARD ================= */
}); 
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "recordings/");
    },
    filename: function(req, file, cb){
        const uniqueName = Date.now() + ".webm";
        cb(null, uniqueName);
    }
});

const upload = multer({ storage });
app.use("/recordings", express.static("recordings"));
app.post("/api/upload-recording", upload.single("video"), async (req, res) => {

    const { className, subject, teacherId } = req.body;

    const fileUrl = `https://academy-backend-eatl.onrender.com/recordings/${req.file.filename}`;
    if(!req.file){
    return res.status(400).json({ message: "No file uploaded" });
}

    // 🔥 SAVE IN DB
    await Recording.create({
        className,
        subject,
        teacherId,
        videoUrl: fileUrl
    });

    res.json({
        message: "Uploaded",
        url: fileUrl
    });
});
app.get("/api/recordings/:className", async (req, res) => {

    const token = req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({ message: "No token" });
    }

    

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(decoded.role !== "student"){
            return res.status(403).json({ message: "Access denied" });
        }

        const { subject } = req.query;

        let filter = {
            className: req.params.className
        };

        if(subject){
            filter.subject = subject;
        }

        const data = await Recording.find(filter).sort({ createdAt: -1 });

        res.json({ data });

    }catch(err){
        res.status(401).json({ message: "Invalid token" });
    }
});

/* ================= CLASS SUMMARY ================= */

app.post("/api/save-class-summary", async (req, res) => {

    try{

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

        const today = new Date();

        const inTime = teacherInTime;

const outTime = teacherOutTime;

const totalMinutes = Math.floor(

(
new Date(outTime)

-

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

    teacherInTime: inTime,

    teacherOutTime: outTime,

    totalMinutes,

    homework,

    classSummary,

    homeworkStatus: "Pending",

    status: "Completed"

});

        // CLEAR MEMORY
        delete teacherAttendanceMemory[room];

        res.json({
            success: true,
            data: summary
        });

    }catch(err){

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Error saving summary"
        });

    }

});

app.get("/api/get-meeting-time", async (req, res) => {

    const room = req.query.room;

    const data = teacherAttendanceMemory[room];

    if(!data){

        return res.json({
            inTime: "-",
            outTime: "-"
        });

    }

    res.json({

        inTime:
            new Date(data.inTime).toLocaleTimeString(),

        outTime:
            new Date().toLocaleTimeString()

    });

});
/* ================= DB ================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

/* ================= START ================= */

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});

const homeworkRoutes =
require("./routes/homeworkRoutes");

const aiAssessmentRoutes = require("./routes/aiAssessmentRoutes");

app.use(
"/api",
homeworkRoutes
);

app.use("/api/ai-assessment", aiAssessmentRoutes);

