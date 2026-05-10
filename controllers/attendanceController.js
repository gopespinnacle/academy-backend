const Attendance = require("../models/Attendance");

/* MARK ATTENDANCE */
exports.markAttendance = async ({ studentId, className, status }) => {
    const attendance = new Attendance({
        studentId,
        className,
        status
    });

    await attendance.save();

    return { message: "Attendance marked successfully" };
};

/* GET STUDENT ATTENDANCE */
exports.getStudentAttendance = async (studentId) => {
    const records = await Attendance.find({ studentId })
    .sort({ createdAt: -1 });

    return records;
};