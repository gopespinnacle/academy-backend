const express = require("express");
const router = express.Router();

const WeeklyParentCall = require("../models/WeeklyParentCall");
const { protect, authorize } = require("../middleware/authMiddleware");

// Student accounts can only read their own parent-call records.
router.use(protect, authorize("student"));

function getIssues(call) {
    const items = call?.actionPlan?.items || [];
    return (call?.discussion || [])
        .filter(q => {
            const status = String(q.status || "").toLowerCase();
            const notes = String(q.notes || "").trim();
            return !!notes || /needs improvement|concern|incomplete|too difficult|extra academic support|extra classes|study material|schedule support|teacher discussion|sometimes incomplete|frequently incomplete|other concern/i.test(status);
        })
        .map(q => {
            const saved = items.find(item =>
                String(item.task || "").startsWith(`__feedback_issue__${q.questionNumber || 0}__`)
            );
            return {
                questionNumber: q.questionNumber,
                question: q.question,
                parentResponse: q.status || "Not recorded",
                parentNotes: q.notes || "",
                resolutionStatus: saved?.status || "Pending",
                resolutionNotes: saved?.assignedTo || ""
            };
        });
}

function getFeedbackStatus(call, issues) {
    if (!issues.length) return "Feedback Solved";
    return issues.every(issue => issue.resolutionStatus === "Completed")
        ? "Feedback Solved"
        : "Feedback in-progress";
}

router.get("/", async (req, res) => {
    try {
        // Do not accept a student ID from the browser. The authenticated user's ID
        // is the only student ID used in this query.
        const calls = await WeeklyParentCall.find({
            student: req.user._id,
            recordStatus: { $in: ["Saved", "Completed"] }
        })
            .select("weekStart weekEnd callDateTime callStatus nextFollowUpDate discussion additionalRemarks parentFeedback teacherFeedback actionPlan recordStatus")
            .sort({ weekStart: -1, createdAt: -1 })
            .lean();

        const records = calls.map(call => {
            const issues = getIssues(call);
            return {
                weekStart: call.weekStart,
                weekEnd: call.weekEnd,
                callDateTime: call.callDateTime,
                callStatus: call.callStatus,
                nextFollowUpDate: call.nextFollowUpDate,
                recordStatus: call.recordStatus,
                discussion: (call.discussion || []).map(q => ({
                    questionNumber: q.questionNumber,
                    question: q.question,
                    status: q.status || "Not recorded",
                    notes: q.notes || ""
                })),
                additionalRemarks: call.additionalRemarks || "",
                parentFeedback: call.parentFeedback || {},
                teacherFeedback: call.teacherFeedback || {},
                actionPlanNotes: call.actionPlan?.notes || "",
                issues,
                feedbackStatus: getFeedbackStatus(call, issues)
            };
        });

        res.json({ success: true, records });
    } catch (err) {
        console.error("STUDENT PARENT FEEDBACK:", err);
        res.status(500).json({
            success: false,
            message: "Unable to load your parent feedback records."
        });
    }
});

module.exports = router;
