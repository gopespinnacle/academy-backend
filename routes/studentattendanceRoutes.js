const express = require("express");
const router = express.Router();

const Attendance = require("../models/Attendance");


// ✅ MARK ATTENDANCE (JOIN BUTTON)
router.post("/mark", async (req, res) => {

    try{

        const { studentId, className, subject, day, startTime, endTime } = req.body;

        // 🔁 prevent duplicate
        const existing = await Attendance.findOne({
            studentId,
            className,
            subject,
            day,
            startTime
        });

        if(existing){
            return res.json({ message: "Already marked ✅" });
        }

        const newAttendance = new Attendance({
            studentId,
            className,
            subject,
            day,
            startTime,
            endTime
        });

        await newAttendance.save();

        res.json({ message: "Attendance marked ✅" });

    }catch(err){
        console.log(err);
        res.status(500).json({ message: "Error saving attendance ❌" });
    }
});


// ✅ GET ATTENDANCE
router.get("/:studentId", async (req, res) => {

    try{

        const data = await Attendance.find({
            studentId: req.params.studentId
        });

        res.json({ data });

    }catch(err){
        console.log("ERROR:", err);  // 👈 ADD THIS
        res.status(500).json({ message:"Error" });
    }

});

module.exports = router;