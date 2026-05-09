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

    totalAmount:Number,

    utr:String,

    paymentStatus:{
        type:String,
        default:"Pending"
    },

    applicationStatus:{
        type:String,
        default:"Pending"
    }

},
{
    timestamps:true
});

module.exports = mongoose.model("Admission", admissionSchema);