const User = require("../models/User");
const jwt = require("jsonwebtoken");

exports.getTeachers = async (req, res) => {
    try {
/*
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const founder = await User.findById(decoded.id);

        if (!founder || founder.role !== "founder") {
            return res.status(403).json({ message: "Access denied" });
        }*/

        const teachers = await User.find({ role: "teacher" })
        .select("name email subject eca language mobile whatsapp experience salaryMonth sessionsWeek salarySession meetingLink createdAt");

        res.json({ teachers });

    } catch (error) {
        res.status(500).json({ message: "Error fetching teachers" });
    }
};