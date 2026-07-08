const mongoose = require("mongoose");

const periodAssignmentSchema = new mongoose.Schema({

    teacher:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },

    assistantTeacher:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    default:null
},

    className:String,
    subject:String,
    day:String,
    startTime:String,
    endTime:String,

    assignments:[
        {
            student:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            subjects:[String],
            languages:[String],
            eca:[String]
        }
    ]

},{timestamps:true});

module.exports = mongoose.model("PeriodAssignment", periodAssignmentSchema);