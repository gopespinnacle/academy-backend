
const mongoose = require("mongoose");

const studentMaterialSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        subject: {
            type: String,
            required: true,
            trim: true
        },

        chapter: {
            type: String,
            required: true,
            trim: true
        },

        originalFileName: {
            type: String,
            required: true
        },

        fileKey: {
            type: String,
            required: true
        },

        contentType: {
            type: String,
            required: true
        },

        fileSize: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "StudentMaterial",
    studentMaterialSchema
);
