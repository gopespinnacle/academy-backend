require("dotenv").config();
const discountRoutes =
require("./routes/discountRoutes");
const jwt = require("jsonwebtoken");
const Recording = require("./models/Recording");
const ClassSummary = require("./models/ClassSummary");
const multer = require("multer");

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
let roomControl = {};
let raisedHands = {};
let boardLock = {};
let boardData = {}; // 🔥 STORE DRAWINGS
let teacherAttendanceMemory = {};
// ROUTES
const studentAttendanceRoutes = require("./routes/studentattendanceRoutes");
const founderTimeClashRoutes = require("./routes/founderTimeClashRoutes");
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const founderRoutes = require("./routes/founderRoutes");
const admissionAccountRoutes =
require("./routes/admissionAccountRoutes");
const studentRoutes = require("./routes/studentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const admissionParentRoutes =
require("./routes/admissionParentRoutes");
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
        origin: ["https://www.gopespinnacle.com"],
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["websocket"] // 🔥 IMPORTANT: remove polling
});

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

// ✅ FIRST load MAIN routes
app.use("/api/founder", founderRoutes);

// ✅ THEN load additional routes
app.use("/api/founder", founderTimeClashRoutes);

app.use("/api/student", studentRoutes);

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


    socket.on("joinRoom", (room) => {

    socket.join(room);

    // 🔥 SEND OLD DRAWINGS
    if(boardData[room]){
        socket.emit("loadBoard", boardData[room]);
    }

    // 🔥 SEND BOARD LOCK STATUS
    if(boardLock[room]){
        socket.emit("boardLocked", true);
    }

    // 🔥 SEND CONTROL STATUS
    if(roomControl[room]){
        socket.emit("controlChanged", {
            studentId: roomControl[room]
        });
    }

socket.on("ready", (room) => {
    socket.to(room).emit("ready");
});
});


        // ================= WEBRTC =================

// TEACHER SEND OFFER
socket.on("offer", (data) => {
    socket.to(data.room).emit("offer", {
        offer: data.offer
    });
});

// STUDENT SEND ANSWER
socket.on("answer", (data) => {
    socket.to(data.room).emit("answer", {
        answer: data.answer
    });
});

// ICE CANDIDATES
socket.on("ice-candidate", (data) => {
    socket.to(data.room).emit("ice-candidate", {
        candidate: data.candidate
    });
});
/* ================= TEACHER JOIN ================= */

socket.on("teacherJoined", (data) => {

    console.log("🔥 Teacher joined room:", data.room);

    // SAVE IN TIME
    teacherAttendanceMemory[data.room] = {
        inTime: new Date()
    };

    io.to(data.room).emit("teacherIsLive");

});
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
    room,
    className,
    periodTime,
    studentName,
    teacherName,
    homework,
    teacherInTime,
    teacherOutTime
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

        const summary = await ClassSummary.create({

            className,

            date: today.toLocaleDateString(),

            periodTime,

            studentName,

            teacherName,

            teacherInTime: inTime,

            teacherOutTime: outTime,

            totalMinutes,

            homework

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


