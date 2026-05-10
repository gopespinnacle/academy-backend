const Homework = require("../models/Homework");
const User = require("../models/User");

/* CREATE HOMEWORK (TEACHER) */
exports.createHomework = async (teacherId, data) => {
    const teacher = await User.findById(teacherId);

    const newHomework = new Homework({
        teacher: teacher._id,
        className: data.className,
        subject: data.subject,
        homework: data.homework,
        dueDate: data.dueDate
    });

    await newHomework.save();

    return { message: "Homework assigned successfully" };
};

/* GET HOMEWORK (STUDENT) */
exports.getStudentHomework = async (studentId) => {
    const student = await User.findById(studentId);

    const homework = await Homework.find({
        className: student.grade
    }).sort({ createdAt: -1 });

    return homework;
};