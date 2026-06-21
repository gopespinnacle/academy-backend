const mongoose = require("mongoose");

const PeriodChapterSchema = new mongoose.Schema({

    periodId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"TeacherSchedule",
        required:true
    },

    teacherId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    teacherName:String,

    className:String,

    subject:String,

    day:String,

    startTime:String,

    endTime:String,

    chapterNo:String,

    chapterName:String,

    topicName:String,

    documentName:String,

    driveLink:String,

    driveFileId:String,

    uploadDate:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model(
    "PeriodChapter",
    PeriodChapterSchema
);