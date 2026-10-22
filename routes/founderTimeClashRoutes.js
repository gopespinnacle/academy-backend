
console.log("🔥 Time Clash Routes Loaded");

const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const TeacherSchedule = require("../models/TeacherSchedule");

// CHECK TEACHER SCHEDULE CLASH — 2-MINUTE BUFFER
router.post(
    "/check-clash",
    protect,
    authorize("founder"),
    async (req, res) => {
        try {
            const { teacher, day, startTime, endTime, scheduleId } = req.body;

            if (!teacher || !day || !startTime || !endTime) {
                return res.status(400).json({
                    clash: false,
                    message: "Teacher, day, start time and end time are required."
                });
            }

            const toMinutes = (time) => {
                const [h, m] = time.split(":").map(Number);
                return h * 60 + m;
            };

            const newStart = toMinutes(startTime);
            const newEnd = toMinutes(endTime);

            if (
                !Number.isFinite(newStart) ||
                !Number.isFinite(newEnd) ||
                newStart >= newEnd
            ) {
                return res.status(400).json({
                    clash: false,
                    message: "Please enter a valid start and end time."
                });
            }

            const schedules = await TeacherSchedule.find({ teacher, day });

            const BUFFER = 2; // 2 minutes between classes

            for (const s of schedules) {
                // Ignore the schedule currently being edited
                if (scheduleId && s._id.toString() === scheduleId) {
                    continue;
                }

                const oldStart = toMinutes(s.startTime);
                const oldEnd = toMinutes(s.endTime);

                // Enforce the buffer on both sides of the existing class
                const effectiveOldStart = oldStart - BUFFER;
                const effectiveOldEnd = oldEnd + BUFFER;

                if (
                    newStart < effectiveOldEnd &&
                    newEnd > effectiveOldStart
                ) {
                    return res.json({
                        clash: true,
                        message: `Clash with ${s.startTime} - ${s.endTime}. Keep at least a 2-minute gap between classes.`
                    });
                }
            }

            return res.json({ clash: false });

        } catch (error) {
            console.error("Time clash check error:", error);

            return res.status(500).json({
                clash: false,
                message: "Unable to check timetable clashes. Please try again."
            });
        }
    }
);

module.exports = router;
