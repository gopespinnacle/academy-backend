const mongoose = require("mongoose");

const admissionAccountSchema =
new mongoose.Schema({

    parentName:{
        type:String,
        required:true
    },

    email:{
        type:String,
        required:true,
        unique:true
    },

    password:{
        type:String,
        required:true
    },

    createdAt:{
        type:Date,
        default:Date.now
    }

});

module.exports =
mongoose.model(
    "AdmissionAccount",
    admissionAccountSchema
);