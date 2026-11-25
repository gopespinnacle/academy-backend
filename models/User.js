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
        enum: ["founder", "teacher", "student", "parent", "admin"],
        required: true
    },

    grade: String,

    board: String,

    subject: [
        {
            type: String
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

    // ================= STUDENT ADMISSION DETAILS =================

    parentName: {
        type: String,
        default: ""
    },

    studentDOB: {
        type: String,
        default: ""
    },

    parentMobile: {
        type: String,
        default: ""
    },

    parentWhatsapp: {
        type: String,
        default: ""
    },

    parentEmail: {
        type: String,
        default: ""
    },

    courses: {
        type: [String],
        default: []
    },

    selectedPlan: {
        type: String,
        default: ""
    },

    totalAmount: {
        type: String,
        default: ""
    },

    utr: {
        type: String,
        default: ""
    },

    // ================= STUDENT / TEACHER ID SYSTEM =================

    studentId: {
        type: String,
        unique: true,
        sparse: true
    },

    // Championship participant account
    accountType: {
        type: String,
        enum: ["academy", "championship"],
        default: "academy"
    },

    mustChangePassword: {
        type: Boolean,
        default: false
    },

    passwordChangedAt: {
        type: Date,
        default: null
    },

    teacherId: {
        type: String,
        unique: true,
        sparse: true
    },

    // ================= ADMIN ID SYSTEM =================

    adminId: {
        type: String,
        unique: true,
        sparse: true
    },

    adminEmail: {
        type: String,
        default: ""
    },

    // ================= ADDRESS =================

    address: {
        type: String,
        default: ""
    },

    // ================= TEACHER / FINANCE =================

    monthlyFee: {
        type: Number,
        default: 0
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

    attendanceDays: {
        type: Number,
        default: 0
    },

    assignedClasses: [String],

    loginEmail: {
        type: String
    },

    loginPassword: {
        type: String
    },

    assignedStudents: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    // ================= SECURITY =================

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
    ],

    // ================= MENU PERMISSIONS =================

    menuPermissions: {

        dashboard: {
            type: Boolean,
            default: true
        },

        myClasses: {
            type: Boolean,
            default: true
        },

        attendance: {
            type: Boolean,
            default: true
        },

        aiAssessment: {
            type: Boolean,
            default: true
        },

        homework: {
            type: Boolean,
            default: true
        },

        calendar: {
            type: Boolean,
            default: true
        },

        marksEntry: {
            type: Boolean,
            default: true
        }

    },

    // ================= FIREBASE =================

    fcmToken: {
        type: String,
        default: ""
    },

    // ================= MESSENGER =================

    lastSeenAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });


// ================= PASSWORD HASHING =================

userSchema.pre("save", async function() {

    if (!this.isModified("password")) return;

    this.password = await bcrypt.hash(this.password, 10);

});


// ================= PASSWORD CHECK =================

userSchema.methods.matchPassword = async function(enteredPassword) {

    return await bcrypt.compare(
        enteredPassword,
        this.password
    );

};


module.exports = mongoose.model("User", userSchema);