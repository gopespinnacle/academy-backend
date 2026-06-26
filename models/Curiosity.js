const mongoose = require("mongoose");

const curiositySchema = new mongoose.Schema({

    title:{
        type:String,
        required:true
    },

    category:{
    type:String,
    enum:[
        "Vocabulary",
        "Science Wonders",
        "Aptitude",
        "World Knowledge",
        "Grammar",
        "Brain Teasers",
        "Life Skills"
    ],
    default:"Vocabulary"
},

    description:{
        type:String
    },

    mediaType:{
        type:String,
        enum:["video","image","pdf"],
        required:true
    },

    mediaUrl:{
        type:String,
        required:true
    },

    s3Key:{
        type:String,
        required:true
    },

    featured:{
        type:Boolean,
        default:false
    },

    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }

},{
    timestamps:true
});

module.exports = mongoose.model("Curiosity",curiositySchema);