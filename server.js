require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ROUTES
const founderTimeClashRoutes = require("./routes/founderTimeClashRoutes");
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const founderRoutes = require("./routes/founderRoutes");
const studentRoutes = require("./routes/studentRoutes");

// CRON JOBS
require("./cron/sessionCron");
require("./cron/attendanceCron");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/founder", founderRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/founder", founderTimeClashRoutes);

/* ================= TEST ================= */

app.get("/", (req, res) => {
    res.send("🚀 Academy ERP Backend Running Successfully");
});

/* ================= DB ================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

/* ================= START ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});