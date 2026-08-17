const mongoose = require("mongoose");

const annotationSchema = new mongoose.Schema(
    {
        room: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        data: {
            type: mongoose.Schema.Types.Mixed,
            default: null
        }

    },
    {
        timestamps: true
    }
);

module.exports =
    mongoose.model(
        "Annotation",
        annotationSchema
    );