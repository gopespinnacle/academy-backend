const mongoose = require("mongoose");

const admissionParentSchema = new mongoose.Schema({

    email:{
        type:String,
        unique:true
    },

    password:String

});

module.exports =
mongoose.model(
    "AdmissionParent",
    admissionParentSchema
);