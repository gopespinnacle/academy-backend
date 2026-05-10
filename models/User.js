const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["founder", "teacher", "student", "parent"],
        required: true
    },

  grade: String,
board: String,
subject: [
{
type:String
}
],
eca: [
{
type: String
}
],

language: [
{
type: String
}
],
mobile: {
    type: String
},

whatsapp: {
    type: String
},

meetingLink: {
    type: String,
    default: ""
},
experience: {
    type: Number,
    default: 0
},

salaryMonth: {
    type: Number,
    default: 0
},

sessionsWeek: {
    type: Number,
    default: 0
},

salarySession: {
    type: Number,
    default: 0
},
attendanceDays:{
type:Number,
default:0
},
    assignedClasses: [String],
    loginEmail:{
type:String
},

loginPassword:{
type:String
},
assignedStudents: [
{
type: mongoose.Schema.Types.ObjectId,
ref: "User"
}
],
    // 🔐 PHASE 1 SECURITY ADDITIONS

    failedLoginAttempts: {
        type: Number,
        default: 0
    },

    lastFailedLogin: Date,

    accountLockedUntil: Date,

    loginHistory: [
        {
            ip: String,
            device: String,
            date: Date
        }
    ]

}, { timestamps: true });


// 🔐 PASSWORD HASHING
userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// 🔐 PASSWORD CHECK METHOD
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);