const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema({

    lessonPlan:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"LessonPlan",

        required:true

    },

    student:{

        type:mongoose.Schema.Types.ObjectId,

        ref:"User",

        required:true

    },

    status:{

        type:String,

        enum:["Pending","Submitted","Reviewed"],

        default:"Pending"

    },

    submittedFiles:[{

        fileName:String,

        s3Key:String,

        s3Url:String

    }],

    reviewFiles:[{

        fileName:String,

        s3Key:String,

        s3Url:String

    }],

    marks:{

        type:Number,

        default:0

    },

    remarks:{

        type:String,

        default:""

    },

    submittedAt:Date,

    reviewedAt:Date

},{timestamps:true});

module.exports = mongoose.model("Homework",homeworkSchema);