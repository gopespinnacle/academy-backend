const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema({

    parentName:String,

    studentName:String,

    grade:String,

    mobile:String,

    courses:[String],

    studentDOB:String,

    parentMobile:String,

    parentWhatsapp:String,

    parentEmail:String,

    address:String,

    subjects:[String],

    selectedPlan:String,

    totalAmount:String,

    utr:String

},
{
    timestamps:true
});

module.exports =
mongoose.model(
    "Admission",
    admissionSchema
);