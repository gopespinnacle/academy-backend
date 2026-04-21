console.log("🔥 Time Clash Routes Loaded");
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const TeacherSchedule = require("../models/TeacherSchedule");

// 🔥 CHECK CLASH ROUTE
router.post("/check-clash", protect, authorize("founder"), async (req, res) => {

    const { teacher, day, startTime, endTime, scheduleId } = req.body;

    const schedules = await TeacherSchedule.find({ teacher, day });

    const toMinutes = (time) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    for (let s of schedules) {

        // skip current editing schedule
        if (scheduleId && s._id.toString() === scheduleId) continue;

        const oldStart = toMinutes(s.startTime);
        const oldEnd = toMinutes(s.endTime);

        const BUFFER = 10; // 🔥 IMPORTANT

        const effectiveOldEnd = oldEnd + BUFFER;

        // ✅ CORRECT OVERLAP CHECK
        if (newStart < effectiveOldEnd && newEnd > oldStart) {
            return res.json({
                clash: true,
                message: `Clash with ${s.startTime} - ${s.endTime}`
            });
        }
    }

    res.json({ clash: false });

});

module.exports = router;