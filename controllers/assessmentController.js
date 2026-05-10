const Assessment = require("../models/Assessment");
const Marks = require("../models/Marks");
const StudentAnswer = require("../models/StudentAnswer");
const User = require("../models/User");

/* CREATE ASSESSMENT */
exports.createAssessment = async (teacherId, data, file) => {

    const assessment = new Assessment({
        title: data.title,
        className: data.className,
        subject: data.subject,
        totalMarks: data.totalMarks,
        examDuration: data.examDuration,
        examStartTime: data.examStartTime,
        questionPaper: file?.filename,
        createdBy: teacherId
    });

    await assessment.save();

    return { message: "Assessment created successfully" };
};

/* GET TEACHER ASSESSMENTS */
exports.getTeacherAssessments = async (teacherId) => {
    return await Assessment.find({ createdBy: teacherId });
};

/* GET STUDENT ASSESSMENTS */
exports.getStudentAssessments = async (studentId) => {

    const student = await User.findById(studentId);

    return await Assessment.find({
        className: student.grade,
        sentToStudents: true
    });
};

/* UPLOAD ANSWER */
exports.uploadAnswer = async (studentId, assessmentId, file) => {

    const answer = new StudentAnswer({
        assessment: assessmentId,
        student: studentId,
        answerFile: file.filename
    });

    await answer.save();

    return { message: "Answer uploaded successfully" };
};

/* GIVE MARKS */
exports.giveMarks = async (answerId, marks) => {

    const answer = await StudentAnswer.findById(answerId);

    answer.marks = marks;

    await answer.save();

    return { message: "Marks saved" };
};