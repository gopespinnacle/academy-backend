const mongoose = require("mongoose");

const homeworkAssignmentSchema = new mongoose.Schema(
    {
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        schedule: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TeacherStudentSchedule",
            required: true,
            index: true
        },
        className: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 180
        },
        instructions: {
            type: String,
            default: "",
            maxlength: 10000
        },
        topic: {
            type: String,
            default: "",
            trim: true
        },
        dueDate: {
            type: Date,
            required: true,
            index: true
        },
        attachments: {
            type: [{
                name: { type: String, default: "" },
                url: { type: String, required: true }
            }],
            default: []
        },
        assignedStudents: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }],
        status: {
            type: String,
            enum: ["published", "closed"],
            default: "published",
            index: true
        }
    },
    { timestamps: true }
);

homeworkAssignmentSchema.index({ teacher: 1, className: 1, subject: 1, createdAt: -1 });
homeworkAssignmentSchema.index({ assignedStudents: 1, dueDate: 1 });

module.exports = mongoose.model("HomeworkAssignment", homeworkAssignmentSchema);
