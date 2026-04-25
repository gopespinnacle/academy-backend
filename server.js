require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// ROUTES
const studentAttendanceRoutes = require("./routes/studentattendanceRoutes");
const founderTimeClashRoutes = require("./routes/founderTimeClashRoutes");
const authRoutes = require("./routes/authRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const founderRoutes = require("./routes/founderRoutes");
const studentRoutes = require("./routes/studentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
// CRON JOBS
require("./cron/sessionCron");
require("./cron/attendanceCron");
require("./cron/attendanceAutoExit");
const app = express();
app.use(cors({
    origin: ["https://www.gopespinnacle.com"],
    methods: ["GET", "POST", "PUT", "DELETE"],
}));

/* ================= TEST ================= */
app.get("/", (req, res) => {
    res.send("🚀 Academy ERP Backend Running Successfully");
});

/* ================= Close TEST ================= */

app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ================= ROUTES ================= */

app.use("/api/auth", authRoutes);
app.use("/api/teacher", teacherRoutes);

// ✅ FIRST load MAIN routes
app.use("/api/founder", founderRoutes);

// ✅ THEN load additional routes
app.use("/api/founder", founderTimeClashRoutes);

app.use("/api/student", studentRoutes);

app.use("/api", admissionRoutes);

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

app.use("/api/auth", authRoutes);

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
/* ================= DB ================= */

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Error:", err));

/* ================= START ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🔥 Server running on port ${PORT}`);
});