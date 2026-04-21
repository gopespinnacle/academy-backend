const User = require("../models/User");
const jwt = require("jsonwebtoken");

/* ================= REGISTER ================= */

exports.registerUser = async (req, res) => {
    try {

        const {
    name,
    email,
    password,
    role,
    grade,
    subject,
    eca,          // ✅ ADD
    language,     // ✅ ADD
    mobile,
    whatsapp,
    experience,
    salaryMonth,
    sessionsWeek,
    salarySession
} = req.body;

        
        // 🚨 BLOCK MULTIPLE FOUNDERS (STRONG VERSION)
if (role === "founder") {
    const founderCount = await User.countDocuments({ role: "founder" });

    if (founderCount > 0) {
        return res.status(400).json({
            message: "Founder account already exists."
        });
    }
}

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

 const newUser = new User({
    name,
    email,
    password,
    role,

    subject: subject || [],
    eca: eca || [],
    language: language || [],

    mobile: mobile || "",
    whatsapp: whatsapp || "",

    experience: experience || 0,
    salaryMonth: salaryMonth || 0,
    sessionsWeek: sessionsWeek || 0,
    salarySession: salarySession || 0
});

        await newUser.save();

        res.status(201).json({
            message: "User registered successfully"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


/* ================= LOGIN ================= */

exports.loginUser = async (req, res) => {
    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.status(200).json({
    message: "Login successful",
    token,
    role: user.role,
    user: user   // ✅ ADD THIS LINE
});

    } catch (error) {
        console.error("LOGIN ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};
const PeriodAssignment = require("../models/PeriodAssignment");

exports.assignPeriodStudents = async (req, res) => {

try {

const {
teacherId,
className,
subject,
day,
startTime,
endTime,
assignments
} = req.body;

/* 🔥 DELETE OLD (FOR EDIT) */
await PeriodAssignment.deleteMany({
teacher: teacherId,
className,
subject,
day,
startTime
});

/* 🔥 INSERT NEW */
const data = assignments.map(a => ({
teacher: teacherId,
student: a.studentId,
className,
subject,
day,
startTime,
endTime,
subjects: a.subjects,
languages: a.languages,
eca: a.eca
}));

await PeriodAssignment.insertMany(data);

res.json({ message: "Saved successfully" });

} catch (err) {
console.log(err);
res.status(500).json({ error: "Server error" });
}

};