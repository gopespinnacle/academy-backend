const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

    questionId:{
        type:mongoose.Schema.Types.ObjectId,
        default:null
    },

    question:{
        type:String,
        required:true
    },

    answer:{
        type:String,
        default:""
    },

    type:{
        type:String,
        default:"MCQ"
    },

    marks:{
        type:Number,
        default:1
    },

    difficulty:{
        type:String,
        default:"Easy"
    }

},{_id:false});

const questionPaperSchema = new mongoose.Schema({

    questionBank:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"QuestionBank",
        required:true
    },

    className:{
        type:String,
        required:true
    },

    subject:{
        type:String,
        required:true
    },

    chapter:{
        type:String,
        required:true
    },

    paperTitle:{
        type:String,
        default:"Question Paper"
    },

    totalMarks:{
        type:Number,
        default:25
    },

    duration:{
        type:String,
        default:"1 Hour"
    },

    difficulty:{
        type:String,
        default:"Mixed"
    },

    questions:[questionSchema],

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Teacher"
    }

},{
    timestamps:true
});

module.exports =
mongoose.model(
    "QuestionPaper",
    questionPaperSchema
);