const mongoose = require("mongoose");

const homeworkSchema = new mongoose.Schema({

teacher:{
type:mongoose.Schema.Types.ObjectId,
ref:"User",
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

homework:{
type:String,
required:true
},

dueDate:Date

},{timestamps:true});

module.exports = mongoose.model("Homework",homeworkSchema);