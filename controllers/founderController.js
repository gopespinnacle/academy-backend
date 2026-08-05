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
        .select("name email subject eca language mobile whatsapp experience salaryMonth sessionsWeek salarySession meetingLink createdAt menuPermissions");

        res.json({ teachers });

    } catch (error) {
        res.status(500).json({ message: "Error fetching teachers" });
    }
};

exports.updateTeacherMenuPermissions = async (req, res) => {

    try {

        const teacher = await User.findById(req.params.id);

        if (!teacher) {

            return res.status(404).json({

                success: false,

                message: "Teacher not found."

            });

        }

        teacher.menuPermissions = req.body.menuPermissions;

        await teacher.save();

        res.json({

            success: true,

            message: "Menu permissions updated successfully."

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};

exports.toggleScreenShare = async (req, res) => {

    try {

        const teacher = await User.findById(req.params.id);

        if (!teacher) {

            return res.status(404).json({

                success: false,

                message: "Teacher not found."

            });

        }

        teacher.allowScreenShare = !teacher.allowScreenShare;

        await teacher.save();

        res.json({

            success: true,

            allowScreenShare: teacher.allowScreenShare

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

};