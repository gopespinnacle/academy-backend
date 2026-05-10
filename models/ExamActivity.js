const mongoose = require("mongoose");

const examActivitySchema = new mongoose.Schema({

student:{
type:mongoose.Schema.Types.ObjectId,
ref:"User"
},

assessment:{
type:mongoose.Schema.Types.ObjectId,
ref:"Assessment"
},

tabSwitch:{
type:Number,
default:0
},

createdAt:{
type:Date,
default:Date.now
}

});

module.exports = mongoose.model("ExamActivity",examActivitySchema);