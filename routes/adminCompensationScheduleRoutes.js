
const express = require("express");
const router = express.Router();

const CompensationScheduleRequest = require("../models/CompensationScheduleRequest");
const { protect, authorize } = require("../middleware/authMiddleware");

const TeacherSession = require("../models/TeacherSession");
const User = require("../models/User");

// =====================================
// GET ALL COMPENSATION SCHEDULE REQUESTS
// Founder / Admin
// =====================================

router.get(
    "/requests",
    protect,
    authorize("founder", "admin"),
    async (req, res) => {
        try {
            const requests = await CompensationScheduleRequest.find()
                .populate("teacher", "name teacherName")
                .populate("students", "name studentId")
                .populate("reviewedBy", "name")
                .sort({ createdAt: -1 });

            res.json({
                success: true,
                requests
            });

        } catch (error) {
            console.error("Compensation requests error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to load compensation requests"
            });
        }
    }
);

// =====================================
// APPROVE COMPENSATION REQUEST
// =====================================

router.put(
    "/approve/:id",
    protect,
    authorize("founder", "admin"),
    async (req, res) => {
        try {
            const request = await CompensationScheduleRequest.findById(
                req.params.id
            );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Request not found"
                });
            }

            if (request.status !== "Pending") {
                return res.status(400).json({
                    success: false,
                    message: "This request has already been reviewed"
                });
            }

            // Get teacher details and meeting link
const teacher = await User.findById(request.teacher)
    .select("name meetingLink");

if (!teacher) {
    return res.status(404).json({
        success: false,
        message: "Teacher not found"
    });
}

// Combine the selected activities for the session
const activities = [
    ...(request.subject || []),
    ...(request.language || []),
    ...(request.eca || [])
];

const session = await TeacherSession.create({
    teacher: request.teacher,
    teacherName: teacher.name,
    className: request.className,
    subject: activities.join(", "),

    sessionType: "Compensation",
    date: request.date,
    startTime: request.startTime,
    endTime: request.endTime,
    meetingLink: teacher.meetingLink || "",
    assignedStudents: request.students,
    joinedStudents: [],
    status: "Pending"
});

// Update request after session creation
request.status = "Approved";
request.reviewedBy = req.user._id;
request.reviewerRole = req.user.role;
request.reviewedAt = new Date();

await request.save();

            res.json({
                success: true,
                message: "Compensation request approved",
                request
            });

        } catch (error) {
            console.error("Approve request error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to approve request"
            });
        }
    }
);

// =====================================
// REJECT COMPENSATION REQUEST
// =====================================

router.put(
    "/reject/:id",
    protect,
    authorize("founder", "admin"),
    async (req, res) => {
        try {
            const { rejectionReason } = req.body;

            const request = await CompensationScheduleRequest.findById(
                req.params.id
            );

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: "Request not found"
                });
            }

            if (request.status !== "Pending") {
                return res.status(400).json({
                    success: false,
                    message: "This request has already been reviewed"
                });
            }

            request.status = "Rejected";
            request.rejectionReason = rejectionReason || "";
            request.reviewedBy = req.user._id;
            request.reviewerRole = req.user.role;
            request.reviewedAt = new Date();

            await request.save();

            res.json({
                success: true,
                message: "Compensation request rejected",
                request
            });

        } catch (error) {
            console.error("Reject request error:", error);
            res.status(500).json({
                success: false,
                message: "Failed to reject request"
            });
        }
    }
);

module.exports = router;
