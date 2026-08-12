console.log("FOUNDER ROUTES LOADED");
console.log("🔥 ADMISSION ROUTE FILE LOADED");
const fs = require("fs");
const {
    sendFacultyApplicationEmail
} = require("../services/emailService");

const sendWhatsApp = require("../utils/sendWhatsApp");
const facultyAgreement =
require("../agreement/facultyAgreement");
const TeacherApplication = require("../models/TeacherApplication");
const Counter =
require("../models/Counter");
const Admission = require("../models/Admission");
const AdmissionEnquiry =
require("../models/AdmissionEnquiry");
const PeriodAssignment = require("../models/PeriodAssignment");
const PeriodChapter =
require("../models/PeriodChapter");
const axios = require("axios");

const express = require("express");
const router = express.Router();
const founderController = require("../controllers/founderController")
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const User = require("../models/User");
const MonthlyFee = require("../models/MonthlyFee");

const FinanceCategory = require("../models/FinanceCategory");
const IncomeExpense = require("../models/IncomeExpense");
const Marks = require("../models/Marks");
const Assessment = require("../models/Assessment");
const AuditLog = require("../models/AuditLog");
const TeacherSchedule = require("../models/TeacherSchedule");
const TeacherSession = require("../models/TeacherSession");
const TeacherAttendance = require("../models/TeacherAttendance");
const TeacherStudentMap = require("../models/TeacherStudentMap");
const Attendance = require("../models/Attendance");
const CompensationClass = require("../models/CompensationClass");
const Subject = require("../models/Subject");
const Category = require("../models/Category");
const { uploadFile } = require("../config/s3");



const { protect, authorize } = require("../middleware/authMiddleware");


/* ================= ADD TEACHER ================= */

router.post("/add-teacher", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const founder = await User.findById(decoded.id);
        if (!founder || founder.role !== "founder") {
            return res.status(403).json({ message: "Access denied" });
        }

        const {
            name, email, password, subject, eca, language,
            mobile, whatsapp, experience,
            salaryMonth, sessionsWeek, salarySession, meetingLink
            
        } = req.body;

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ message: "Teacher already exists" });
        }

        const teacher = new User({
            name, email, password,
            role: "teacher",
            subject, eca, language,
            mobile, whatsapp, experience,
            salaryMonth, sessionsWeek, salarySession,
             meetingLink
        });

        await teacher.save();

        res.status(201).json({ message: "Teacher created successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error creating teacher" });
    }
});

/* ================= GET TEACHERS ================= */

router.get("/teachers", founderController.getTeachers);
/* ================= ANALYTICS ================= */

router.get("/analytics", async (req, res) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const founder = await User.findById(decoded.id);
        if (!founder || founder.role !== "founder") {
            return res.status(403).json({ message: "Access denied" });
        }

        const totalStudents = await User.countDocuments({ role: "student" });
        const totalTeachers = await User.countDocuments({ role: "teacher" });
        const totalAssessments = await Assessment.countDocuments();

        const marks = await Marks.find();
        const average =
            marks.length > 0
                ? marks.reduce((sum, m) => sum + m.marksObtained, 0) / marks.length
                : 0;

        const pendingModifications = await Marks.countDocuments({
            modificationRequested: true
        });

        const recentActivities = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(5);

        res.json({
            totalStudents,
            totalTeachers,
            totalAssessments,
            averageMarks: average.toFixed(2),
            pendingModifications,
            recentActivities
        });

    } catch (error) {
        res.status(500).json({ message: "Error loading analytics" });
    }
});

/* ================= STUDENT ID GENERATOR ================= */

async function getNextStudentId(){

    const counter =
        await Counter.findByIdAndUpdate(

            "student",

            {
                $inc:{
                    sequenceValue:1
                }
            },

            {
                new:true,
                upsert:true
            }

        );

    return `GPA-${String(counter.sequenceValue).padStart(4, "0")}`;

}

async function getNextStudentId(){

    const counter =
        await Counter.findByIdAndUpdate(

            "student",

            {
                $inc:{
                    sequenceValue:1
                }
            },

            {
                new:true,
                upsert:true
            }

        );

    return `GPA-${String(counter.sequenceValue).padStart(4, "0")}`;

}

/* ================= EXISTING STUDENT ID MIGRATION ================= */

router.post(
    "/generate-missing-student-ids",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const students = await User.find({
                role: "student",
                $or: [
                    { studentId: { $exists: false } },
                    { studentId: null },
                    { studentId: "" }
                ]
            }).sort({ createdAt: 1 });

            const generatedIds = [];

            for (const student of students) {

                const studentId = await getNextStudentId();

                student.studentId = studentId;

                await student.save();

                generatedIds.push({
                    name: student.name,
                    studentId
                });

            }

            res.json({
                success: true,
                count: generatedIds.length,
                students: generatedIds
            });

        } catch (error) {

            console.log(
                "STUDENT ID MIGRATION ERROR:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Error generating student IDs"
            });

        }

    }
);

/* ================= STUDENT CRUD ================= */

router.get("/students", async (req,res)=>{
    const students = await User.find({ role: "student" });
    res.json({ students });
});

/* ================= FINANCE CATEGORIES ================= */

router.get(
    "/finance-categories",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const categories =
                await FinanceCategory.find({
                    active: true
                })
                .sort({
                    type: 1,
                    category: 1
                });

            res.json({

                success: true,

                categories

            });

        } catch (error) {

            console.log(
                "FINANCE CATEGORY ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Error loading finance categories"

            });

        }

    }
);


/* ================= SAVE INCOME / EXPENSE ================= */

router.post(
    "/finance-transaction",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const {
                date,
                type,
                category,
                subCategory,
                description,
                amount
            } = req.body;


            // ================= BASIC VALIDATION =================

            if (!date) {

                return res.status(400).json({
                    success: false,
                    message: "Date is required"
                });

            }


            if (
                type !== "Income" &&
                type !== "Expense"
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid transaction type"
                });

            }


            if (!category) {

                return res.status(400).json({
                    success: false,
                    message: "Category is required"
                });

            }


            if (!subCategory) {

                return res.status(400).json({
                    success: false,
                    message: "Sub Category is required"
                });

            }


            // ================= DATE VALIDATION =================

            const transactionDate =
                new Date(date);


            if (
                Number.isNaN(
                    transactionDate.getTime()
                )
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid transaction date"
                });

            }


            // ================= AMOUNT VALIDATION =================

            const transactionAmount =
                Number(amount);


            if (
                !Number.isFinite(
                    transactionAmount
                ) ||
                transactionAmount < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid transaction amount"
                });

            }


            // ================= VERIFY CATEGORY =================

            const financeCategory =
                await FinanceCategory.findOne({

                    type,

                    category,

                    active: true

                });


            if (!financeCategory) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Selected Category does not exist"
                });

            }


            // ================= VERIFY SUB CATEGORY =================

            const subCategoryExists =
                financeCategory.subCategories
                    .includes(subCategory);


            if (!subCategoryExists) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Selected Sub Category does not belong to the selected Category"
                });

            }


            // ================= CREATE TRANSACTION =================

            const transaction =
                new IncomeExpense({

                    date:
                        transactionDate,

                    type,

                    category,

                    subCategory,

                    description:
                        description || "",

                    amount:
                        transactionAmount,

                    createdBy:
                        req.user
                            ? req.user._id
                            : null

                });


            await transaction.save();


            // ================= RESPONSE =================

            res.status(201).json({

                success: true,

                message:
                    "Income / Expense saved successfully",

                transaction

            });


        } catch (error) {

            console.log(
                "SAVE FINANCE TRANSACTION ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Error saving income / expense"

            });

        }

    }
);

// ==========================================================
// UPDATE FINANCE TRANSACTION
// ==========================================================

router.put(
    "/finance-transaction/:id",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const {
                date,
                type,
                category,
                subCategory,
                description,
                amount
            } = req.body;


            // ================= VALIDATION =================

            if (
                !date ||
                !type ||
                !category ||
                !subCategory ||
                amount === undefined
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Date, type, category, sub category and amount are required."

                });

            }


            if (
                !["Income", "Expense"].includes(type)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid transaction type."

                });

            }


            const transactionDate =
                new Date(date);


            if (
                Number.isNaN(
                    transactionDate.getTime()
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid transaction date."

                });

            }


            const transactionAmount =
                Number(amount);


            if (
                !Number.isFinite(
                    transactionAmount
                ) ||
                transactionAmount < 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid transaction amount."

                });

            }


            // ================= CHECK CATEGORY =================

            const financeCategory =
                await FinanceCategory.findOne({

                    type: type,

                    category: category,

                    active: true

                });


            if (!financeCategory) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid finance category."

                });

            }


            if (
                !financeCategory.subCategories.includes(
                    subCategory
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid finance sub category."

                });

            }


            // ================= FIND TRANSACTION =================

            const transaction =
                await IncomeExpense.findById(
                    req.params.id
                );


            if (!transaction) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Finance transaction not found."

                });

            }


            // ================= UPDATE =================

            transaction.date =
                transactionDate;

            transaction.type =
                type;

            transaction.category =
                category;

            transaction.subCategory =
                subCategory;

            transaction.description =
                description || "";

            transaction.amount =
                transactionAmount;


            await transaction.save();


            // ================= RESPONSE =================

            return res.status(200).json({

                success: true,

                message:
                    "Finance transaction updated successfully.",

                transaction

            });


        } catch (error) {

            console.error(
                "UPDATE FINANCE TRANSACTION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to update finance transaction."

            });

        }

    }
);

// ==========================================================
// DELETE FINANCE TRANSACTION
// ==========================================================

router.delete(
    "/finance-transaction/:id",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const transaction =
                await IncomeExpense.findById(
                    req.params.id
                );


            if (!transaction) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Finance transaction not found."

                });

            }


            await IncomeExpense.findByIdAndDelete(
                req.params.id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Finance transaction deleted successfully."

            });


        } catch (error) {

            console.error(
                "DELETE FINANCE TRANSACTION ERROR:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to delete finance transaction."

            });

        }

    }
);
/* ================= FINANCE TRANSACTION REPORT ================= */

router.get(
    "/finance-transactions",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const {
                view,
                date,
                month,
                year,
                type,
                category,
                subCategory
            } = req.query;


            // ==================================================
            // VALIDATE VIEW
            // ==================================================

            if (
                view !== "day" &&
                view !== "month"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "View must be day or month"

                });

            }


            let startDate;
            let endDate;


            // ==================================================
            // DAY VIEW
            // ==================================================

            if (view === "day") {

                if (!date) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Date is required for day view"

                    });

                }


                // IST midnight

                startDate =
                    new Date(
                        `${date}T00:00:00+05:30`
                    );


                // Next IST midnight

                endDate =
                    new Date(
                        `${date}T00:00:00+05:30`
                    );

                endDate.setDate(
                    endDate.getDate() + 1
                );


            }


            // ==================================================
            // MONTH VIEW
            // ==================================================

            if (view === "month") {

                const selectedMonth =
                    Number(month);

                const selectedYear =
                    Number(year);


                if (
                    !selectedMonth ||
                    !selectedYear ||
                    selectedMonth < 1 ||
                    selectedMonth > 12
                ) {

                    return res.status(400).json({

                        success: false,

                        message:
                            "Valid month and year are required"

                    });

                }


                // JavaScript month is zero-based

                startDate =
                    new Date(
                        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01T00:00:00+05:30`
                    );


                // First day of next month

                if (selectedMonth === 12) {

                    endDate =
                        new Date(
                            `${selectedYear + 1}-01-01T00:00:00+05:30`
                        );

                } else {

                    endDate =
                        new Date(
                            `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01T00:00:00+05:30`
                        );

                }

            }


            // ==================================================
            // BUILD QUERY
            // ==================================================

            const query = {

                date: {

                    $gte: startDate,

                    $lt: endDate

                }

            };


            // Optional Type filter

            if (
                type === "Income" ||
                type === "Expense"
            ) {

                query.type = type;

            }


            // Optional Category filter

            if (category) {

                query.category =
                    category;

            }


            // Optional Sub Category filter

            if (subCategory) {

                query.subCategory =
                    subCategory;

            }


            // ==================================================
            // GET TRANSACTIONS
            // ==================================================

            const transactions =
                await IncomeExpense.find(query)

                    .populate(
                        "createdBy",
                        "name email"
                    )

                    .sort({
                        date: -1,
                        createdAt: -1
                    });


            // ==================================================
            // CALCULATE TOTALS
            // ==================================================

            let totalIncome = 0;

            let totalExpense = 0;


            transactions.forEach(
                transaction => {

                    const amount =
                        Number(
                            transaction.amount || 0
                        );


                    if (
                        transaction.type ===
                        "Income"
                    ) {

                        totalIncome +=
                            amount;

                    }


                    if (
                        transaction.type ===
                        "Expense"
                    ) {

                        totalExpense +=
                            amount;

                    }

                }
            );


            const netBalance =
                totalIncome -
                totalExpense;


            // ==================================================
            // RESPONSE
            // ==================================================

            res.json({

                success: true,

                view,

                startDate,

                endDate,

                transactions,

                totals: {

                    totalIncome,

                    totalExpense,

                    netBalance

                }

            });


        } catch (error) {

            console.log(
                "FINANCE TRANSACTION REPORT ERROR:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Error loading finance transactions"

            });

        }

    }
);
/* ================= MONTHLY FEE REPORT ================= */

router.get(
    "/fee-report",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const month = Number(req.query.month);
            const year = Number(req.query.year);

            if (
                !month ||
                !year ||
                month < 1 ||
                month > 12
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Valid month and year are required"
                });
            }

            // Get all students
            const students = await User.find({
                role: "student"
            }).sort({
                name: 1
            });

            // Get existing fee records for selected month
            const feeRecords = await MonthlyFee.find({
                month,
                year
            });

            // Create quick lookup by student MongoDB ID
            const feeMap = {};

            feeRecords.forEach(record => {

                feeMap[
                    record.student.toString()
                ] = record;

            });

            const report = students.map(student => {

                const record =
                    feeMap[student._id.toString()];

                return {

                    studentId:
                        student.studentId || "",

                    studentName:
                        student.name,

                    actualFee:
                        record
                            ? record.actualFee
                            : Number(student.monthlyFee || 0),

                    feePaid:
                        record
                            ? record.feePaid
                            : 0,

                    teacherFee:
                        record
                            ? record.teacherFee
                            : 0,

                    academyFee:
                        record
                            ? record.academyFee
                            : 0,

                    paymentStatus:
                        record
                            ? record.paymentStatus
                            : "Pending",

                    paymentDate:
                        record
                            ? record.paymentDate
                            : null,

                    paymentReference:
                        record
                            ? record.paymentReference
                            : "",

                    feeRecordId:
                        record
                            ? record._id
                            : null

                };

            });

            // ================= TOTALS =================

            const totals = report.reduce(
                (total, student) => {

                    total.actualFee +=
                        Number(student.actualFee || 0);

                    total.feePaid +=
                        Number(student.feePaid || 0);

                    total.teacherFee +=
                        Number(student.teacherFee || 0);

                    total.academyFee +=
                        Number(student.academyFee || 0);

                    return total;

                },
                {
                    actualFee: 0,
                    feePaid: 0,
                    teacherFee: 0,
                    academyFee: 0
                }
            );

            res.json({

                success: true,

                month,

                year,

                report,

                totals

            });

        } catch (error) {

            console.log(
                "FEE REPORT ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message: "Error loading fee report"

            });

        }

    }
);

/* ================= SAVE MONTHLY FEE ================= */

/* ================= SAVE MONTHLY FEE + FINANCE ================= */

router.post(
    "/fee-record",
    protect,
    authorize("founder"),
    async (req, res) => {

        try {

            const {
                studentId,
                month,
                year,
                feePaid,
                teacherFee
            } = req.body;


            // ================= VALIDATION =================

            if (!studentId) {

                return res.status(400).json({
                    success: false,
                    message: "Student ID is required"
                });

            }


            const selectedMonth = Number(month);
            const selectedYear = Number(year);

            if (
                !selectedMonth ||
                !selectedYear ||
                selectedMonth < 1 ||
                selectedMonth > 12
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid month or year"
                });

            }


            const paidAmount =
                Number(feePaid);

            const teacherAmount =
                Number(teacherFee);


            if (
                !Number.isFinite(paidAmount) ||
                paidAmount < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid Fee Paid amount"
                });

            }


            if (
                !Number.isFinite(teacherAmount) ||
                teacherAmount < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid Teacher Fee amount"
                });

            }


            if (teacherAmount > paidAmount) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Fee to Teacher cannot be greater than Fee Paid"
                });

            }


            // ================= FIND STUDENT =================

            const student = await User.findOne({
                role: "student",
                studentId: studentId
            });


            if (!student) {

                return res.status(404).json({
                    success: false,
                    message: "Student not found"
                });

            }


            // ================= FIND EXISTING FEE RECORD =================

            let feeRecord =
                await MonthlyFee.findOne({

                    student: student._id,

                    month: selectedMonth,

                    year: selectedYear

                });


            // ================= ACADEMY FEE =================

            const academyAmount =
                paidAmount - teacherAmount;


            // ================= CREATE MONTHLY FEE =================

            if (!feeRecord) {

                feeRecord = new MonthlyFee({

                    student: student._id,

                    studentId: student.studentId,

                    studentName: student.name,

                    month: selectedMonth,

                    year: selectedYear,

                    actualFee:
                        Number(student.monthlyFee || 0),

                    feePaid:
                        paidAmount,

                    teacherFee:
                        teacherAmount,

                    academyFee:
                        academyAmount,

                    paymentStatus:
                        paidAmount === 0
                            ? "Pending"
                            : paidAmount >= Number(student.monthlyFee || 0)
                                ? "Paid"
                                : "Partial",

                    paymentDate:
                        paidAmount > 0
                            ? new Date()
                            : null

                });

            }


            // ================= UPDATE MONTHLY FEE =================

            else {

                feeRecord.feePaid =
                    paidAmount;

                feeRecord.teacherFee =
                    teacherAmount;

                feeRecord.academyFee =
                    academyAmount;

                feeRecord.paymentStatus =
                    paidAmount === 0
                        ? "Pending"
                        : paidAmount >= feeRecord.actualFee
                            ? "Paid"
                            : "Partial";

                feeRecord.paymentDate =
                    paidAmount > 0
                        ? new Date()
                        : null;

            }


            await feeRecord.save();


            // ==========================================================
            // FINANCE INTEGRATION
            // ==========================================================

            /*
             * We use a unique internal marker inside description.
             *
             * This allows us to find the exact finance transaction
             * again when the Founder edits the monthly fee.
             *
             * No duplicate transactions will be created.
             */


            const financeDate =
                feeRecord.paymentDate || new Date();


            // ==========================================================
            // 1. FEE PAID → INCOME
            // ==========================================================

            const incomeMarker =
                `[MONTHLY_FEE:${feeRecord._id}:FEE_PAID]`;


            const incomeDescription =
                `${student.name} ${incomeMarker}`;


            const existingIncome =
                await IncomeExpense.findOne({

                    type: "Income",

                    category: "Student Fees",

                    subCategory: "Monthly Tuition Fees",

                    description: incomeDescription

                });


            if (paidAmount > 0) {

                if (existingIncome) {

                    existingIncome.date =
                        financeDate;

                    existingIncome.amount =
                        paidAmount;

                    existingIncome.createdBy =
                        req.user
                            ? req.user._id
                            : null;

                    await existingIncome.save();

                }

                else {

                    await IncomeExpense.create({

                        date:
                            financeDate,

                        type:
                            "Income",

                        category:
                            "Student Fees",

                        subCategory:
                            "Monthly Tuition Fees",

                        description:
                            incomeDescription,

                        amount:
                            paidAmount,

                        createdBy:
                            req.user
                                ? req.user._id
                                : null

                    });

                }

            }

            else {

                if (existingIncome) {

                    await IncomeExpense.findByIdAndDelete(
                        existingIncome._id
                    );

                }

            }


            // ==========================================================
            // 2. TEACHER FEE → EXPENSE
            // ==========================================================

            const teacherMarker =
                `[MONTHLY_FEE:${feeRecord._id}:TEACHER_FEE]`;


            const teacherDescription =
                `${student.name} ${teacherMarker}`;


            const existingTeacherExpense =
                await IncomeExpense.findOne({

                    type: "Expense",

                    category: "Teacher Payments",

                    subCategory: "Teacher Fees",

                    description: teacherDescription

                });


            if (teacherAmount > 0) {

                if (existingTeacherExpense) {

                    existingTeacherExpense.date =
                        financeDate;

                    existingTeacherExpense.amount =
                        teacherAmount;

                    existingTeacherExpense.createdBy =
                        req.user
                            ? req.user._id
                            : null;

                    await existingTeacherExpense.save();

                }

                else {

                    await IncomeExpense.create({

                        date:
                            financeDate,

                        type:
                            "Expense",

                        category:
                            "Teacher Payments",

                        subCategory:
                            "Teacher Fees",

                        description:
                            teacherDescription,

                        amount:
                            teacherAmount,

                        createdBy:
                            req.user
                                ? req.user._id
                                : null

                    });

                }

            }

            else {

                if (existingTeacherExpense) {

                    await IncomeExpense.findByIdAndDelete(
                        existingTeacherExpense._id
                    );

                }

            }


            // ================= RESPONSE =================

            res.json({

                success: true,

                message:
                    "Monthly fee and finance records saved successfully",

                feeRecord

            });


        } catch (error) {

            console.log(
                "SAVE MONTHLY FEE + FINANCE ERROR:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Error saving monthly fee and finance records"

            });

        }

    }
);

router.post("/student", protect, authorize("founder"), async (req,res)=>{
    try{
        const {
    name,
    grade,
    board,
    mobile,
    monthlyFee,
    subject,
    eca,
    language
} = req.body;

const studentId = await getNextStudentId();

        const email =
        name.toLowerCase().replace(/\s/g,"") +
        Math.floor(Math.random()*1000) +
        "@student.com";

        const password = Math.random().toString(36).slice(-6);

        const student = new User({
    name,
    email,
    password,

    grade,
    board,
    mobile,

    studentId,
    monthlyFee: Number(monthlyFee) || 0,

    role:"student",

    loginEmail: email,
    loginPassword: password,

    subject: subject || [],
    eca: eca || [],
    language: language || []
});
        await student.save();

       res.json({
    message:"Student added successfully",
    studentId,
    login:{ email, password }
});

    }catch(error){
        res.status(500).json({ message:"Server error" });
    }
});

router.put("/student/:id", async (req,res)=>{
    try{
        const updatedStudent = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new:true }
        );

        res.json({ student:updatedStudent });

    }catch(error){
        res.status(500).json({ message:"Server error" });
    }
});

router.delete("/student/:id", async (req,res)=>{
    await User.findByIdAndDelete(req.params.id);
    res.json({ message:"Student deleted successfully" });
});

/* ================= SCHEDULE ================= */

router.post("/add-schedule", protect, authorize("founder"), async (req,res)=>{
    try{

        const schedule = new TeacherSchedule(req.body);
        await schedule.save();

        res.json({ message:"Schedule added successfully" });

    }catch(error){
        res.status(500).json({ message:error.message });
    }
});

router.get("/schedules", protect, authorize("founder"), async (req,res)=>{
    const schedules = await TeacherSchedule.find()
    .populate("teacher","name subject");

    res.json({ schedules });
});

/* ================= PERIOD DETAILS ================= */

router.get("/period/:id", protect, authorize("founder"), async (req,res)=>{

    try{

        const schedule = await TeacherSchedule.findById(req.params.id)
        .populate("teacher","name subject");

        if(!schedule){
            return res.status(404).json({
                message:"Schedule not found"
            });
        }

        const assignments = await PeriodAssignment.find({

            teacher: schedule.teacher._id,
            className: schedule.className,
            day: schedule.day,
            startTime: schedule.startTime,
            endTime: schedule.endTime

        }).populate("student","name");

        res.json({

            schedule,
            assignments

        });

    }catch(error){

        console.log(error);

        res.status(500).json({
            message:"Server Error"
        });

    }

});

router.put("/update-schedule/:id", protect, authorize("founder"), async (req,res)=>{
    try{

            const updated = await TeacherSchedule.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new:true }
        );

        if(!updated){
            return res.status(404).json({ message:"Schedule not found" });
        }

        res.json({ message:"Schedule updated successfully", data: updated });

    }catch(error){
        res.status(500).json({ message:"Server error" });
    }
});
/* ================= TODAY CLASSES ================= */

router.get("/today-classes", protect, authorize("founder"), async (req,res)=>{
    try{
        const today = new Date();

        const start = new Date(today.setHours(0,0,0,0));
        const end = new Date(today.setHours(23,59,59,999));

        const sessions = await TeacherSession.find({
            date:{ $gte:start,$lte:end }
        }).populate("teacher","name subject");

        res.json({ sessions });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= LIVE CLASSES ================= */

router.get("/live-classes", protect, authorize("founder"), async (req,res)=>{
    try{
        const now = new Date();

        const sessions = await TeacherSession.find()
        .populate("teacher","name subject");

        const liveClasses = sessions.filter(s=>{
            const [sh,sm] = s.startTime.split(":");
            const [eh,em] = s.endTime.split(":");

            const start = new Date(s.date);
            start.setHours(sh,sm,0);

            const end = new Date(s.date);
            end.setHours(eh,em,0);

            return now >= start && now <= end;
        });

        res.json({ liveClasses });

    }catch(err){
        res.status(500).json({message:"Server error"});
    }
});

/* ================= SUBJECT ================= */

router.post("/add-subject", async (req,res)=>{
    const subject = new Subject({ name:req.body.name });
    await subject.save();
    res.json({ message:"Subject added" });
});

router.get("/subjects", async (req,res)=>{
    const subjects = await Subject.find();
    res.json({ subjects });
});

router.delete("/subject/:id", async (req,res)=>{
    await Subject.findByIdAndDelete(req.params.id);
    res.json({ message:"Deleted" });
});

/* ================= CATEGORY ================= */

router.post("/add-category", async(req,res)=>{
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.json({message:"Added successfully"});
});

router.get("/categories/:type", async(req,res)=>{
    const data = await Category.find({type:req.params.type});
    res.json({data});
});

router.delete("/category/:id", async(req,res)=>{
    await Category.findByIdAndDelete(req.params.id);
    res.json({message:"Deleted"});
});


router.get("/teacher/:id", async (req,res)=>{
    try{

        const teacher = await User.findById(req.params.id);

        if(!teacher){
            return res.status(404).json({message:"Teacher not found"});
        }

        res.json({ teacher });

    }catch(error){
        res.status(500).json({message:"Server error"});
    }
});


router.put("/update-teacher/:id", async (req,res)=>{
    try{

        const updatedTeacher = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new:true }
        );

        if(!updatedTeacher){
            return res.status(404).json({message:"Teacher not found"});
        }

        res.json({ message:"Teacher updated successfully", teacher: updatedTeacher });

    }catch(error){
        console.log(error);
        res.status(500).json({message:"Server error"});
    }
});


router.get("/teacher-schedule/:teacherId", async (req, res) => {
    try {

        const schedule = await TeacherSchedule.find({
            teacher: req.params.teacherId
        });

        res.json({ schedule });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error" });
    }
});



router.post("/get-period-assignments", async (req,res)=>{
    try{

        let { teacherId, className, subject, day, startTime } = req.body;

        startTime = startTime.trim();

        const data = await PeriodAssignment.find({
    teacher: teacherId,
    className,
    subject,
    day,
    startTime: { $regex: "^" + startTime }
})
.populate("assignments.student","name");

        console.log("FILTERED DATA:", data);

        let assignments = [];

data.forEach(period=>{

    period.assignments.forEach(a=>{

        assignments.push({

            student: a.student,

            subjects: a.subjects || [],

            languages: a.languages || [],

            eca: a.eca || []

        });

    });

});

        res.json({ assignments });

    }catch(err){
        console.log(err);
        res.status(500).json({message:"Server error"});
    }
});

router.post("/assign-period", async (req, res) => {

    try {

        const {
    teacherId,
    className,
    subject,
    day,
    startTime,
    endTime,
    students
} = req.body;

        await PeriodAssignment.deleteMany({
            teacher: teacherId,
            className,
            subject,
            day,
            startTime,
            endTime
        });

        const period = new PeriodAssignment({

            teacher: teacherId,

            className,

            subject,

            day,

            startTime,

            endTime,

            assignments: students.map(a => ({

                student: a.studentId,

                subjects: a.subjects || [],

                languages: a.languages || [],

                eca: a.eca || []

            }))

        });

        await period.save();

        res.json({
            success: true,
            assignments: period.assignments
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});

router.delete("/delete-schedule/:id", protect, authorize("founder"), async (req, res) => {
    try {

        const deleted = await TeacherSchedule.findByIdAndDelete(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Schedule not found" });
        }

        res.json({ message: "Schedule deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});

router.get("/compensation-report", async (req,res)=>{
    try{

        const StudentCompensation = require("../models/StudentCompensation");

        const data = await StudentCompensation.find()
        .populate("student","name")
        .populate("teacher","name");

        res.json({ data });

    }catch(err){
        res.status(500).json({ message:"Error" });
    }
});


/* ================= ADMISSION FORM ================= */
// ✅ GET ALL ADMISSIONS
router.get("/admissions", async (req, res) => {
    try {
        const data = await Admission.find().sort({ createdAt: -1 });
        res.json({ admissions: data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching admissions" });
    }
});

// DELETE ADMISSION
router.delete("/admission/:id", async (req, res) => {
  try {
    await Admission.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting" });
  }
});
const multer = require("multer");
const path = require("path");
const stream = require("stream");
const { google } = require("googleapis");


const upload = multer({
    storage: multer.memoryStorage()
});

const oauth2Client =
new google.auth.OAuth2(

process.env.GOOGLE_CLIENT_ID,

process.env.GOOGLE_CLIENT_SECRET,

process.env.GOOGLE_REDIRECT_URI

);

oauth2Client.setCredentials({

refresh_token:
process.env.GOOGLE_REFRESH_TOKEN

});

const drive =
google.drive({

version:"v3",

auth:oauth2Client

});

// ✅ TEACHER APPLICATION API
async function getNextApplicationId(){

    const today = new Date();

    const yyyy = today.getFullYear();

    const mm = String(today.getMonth()+1).padStart(2,"0");

    const dd = String(today.getDate()).padStart(2,"0");

    const datePart = `${yyyy}${mm}${dd}`;

    const counterId =
    `teacherApplication-${datePart}`;

    const counter =
    await Counter.findByIdAndUpdate(

        counterId,

        {
            $inc:{
                sequenceValue:1
            }
        },

        {
            new:true,
            upsert:true
        }

    );

   return `GPA-FA-${datePart}-${String(counter.sequenceValue).padStart(4, "0")}`;

}

router.post("/teacher-application", upload.single("resume"), async (req, res) => {

    try {

        const applicationId = await getNextApplicationId();

       
        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "Resume is required"
            });

        }

        // Upload Resume to AWS S3
        const result = await uploadFile(
    req.file,
    "teacher-resumes"
);

        const data = {

            applicationId,

            teacherName: req.body.teacherName,

            whatsapp: req.body.whatsapp,

            mobile: req.body.mobile,

            email: req.body.email,

            education: req.body.education,

            experience: req.body.experience,

            presentJob: req.body.presentJob,

            timing: req.body.timing,

            resumeUrl: result.Location,

            resumeKey: result.Key,

            subjects: JSON.parse(req.body.subjects || "[]"),

            skills: JSON.parse(req.body.skills || "[]"),

            languages: JSON.parse(req.body.languages || "[]"),

            agreementAccepted: true,

agreementAcceptedOn: new Date(),

agreementVersion: "v1.0",

agreementAcceptedStatement:
"I have read, understood and agree to the Freelance Educator Terms & Conditions.",

agreementContent:facultyAgreement

        };

        console.log("Generated Application ID:", applicationId);
console.log(data);

console.log("================================");
console.log("DATA TO SAVE");
console.log(data);
console.log("================================");

        const application = await TeacherApplication.create(data);

// Send response immediately
res.json({
    success: true,
    message: "Teacher Application Submitted Successfully"
});

// Send Email in Background
sendFacultyApplicationEmail(application)
.then(() => {

    console.log("====================================");
    console.log("Faculty Application Emails Sent");
    console.log("Teacher :", application.email);
    console.log("Founder :", process.env.FOUNDER_EMAIL);
    console.log("====================================");

})
.catch((error) => {

    console.log("====================================");
    console.log("Faculty Email Sending Failed");
    console.log(error);
    console.log("====================================");

});

// ============================
// WhatsApp to Teacher
// ============================

sendWhatsApp(
    application.mobile,
    application,
    "teacher"
)
.then(() => {

    console.log("Teacher WhatsApp Sent");

})
.catch((error) => {

    console.log("Teacher WhatsApp Error");
    console.log(error);

});

// ============================
// WhatsApp to Founder
// ============================

sendWhatsApp(
    process.env.FOUNDER_MOBILE,
    application,
    "founder"
)
.then(() => {

    console.log("Founder WhatsApp Sent");

})
.catch((error) => {

    console.log("Founder WhatsApp Error");
    console.log(error);

});
    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

});
// ✅ GET ALL TEACHER APPLICATIONS
router.get("/teacher-applications", async (req, res) => {
    try {
        const data = await TeacherApplication.find().sort({ createdAt: -1 });
        res.json({ applications: data });
    } catch (error) {
        res.status(500).json({ message: "Error fetching applications" });
    }
});

// ✅ DELETE TEACHER APPLICATION
router.delete("/teacher-application/:id", async (req, res) => {
    try {
        await TeacherApplication.findByIdAndDelete(req.params.id);
        res.json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting application" });
    }
});
router.delete("/delete-teacher/:id", async (req,res)=>{
    try{

        const User = require("../models/User");

        const teacher = await User.findByIdAndDelete(req.params.id);

        if(!teacher){
            return res.status(404).json({ message:"Teacher not found ❌" });
        }

        res.json({ message:"Teacher deleted ✅" });

    }catch(err){
        res.status(500).json({ message:"Server error ❌" });
    }
});

/* ================= ENQUIRIES ================= */

// GET ENQUIRIES
router.get("/enquiries", async (req, res) => {

    try {

        const enquiries =
            await AdmissionEnquiry.find()
            .sort({ createdAt: -1 });

        res.json({
            enquiries
        });

    } catch (error) {

        res.status(500).json({
            message: "Error fetching enquiries"
        });

    }

});


// DELETE ENQUIRY
router.delete("/enquiry/:id", async (req, res) => {

    try {

        await AdmissionEnquiry.findByIdAndDelete(
            req.params.id
        );

        res.json({
            message: "Deleted successfully"
        });

    } catch (error) {

        res.status(500).json({
            message: "Error deleting enquiry"
        });

    }

});

/*======================================================
            UPLOAD PERIOD CHAPTER
======================================================*/

/*======================================================
            UPLOAD PERIOD CHAPTER
======================================================*/

router.post(
"/period/upload",
upload.single("document"),

async(req,res)=>{

try{

if(!req.file){

return res.status(400).json({

success:false,

message:"No document selected"

});

}

const bufferStream =
new stream.PassThrough();

bufferStream.end(req.file.buffer);

const response =
await drive.files.create({

requestBody:{

name:req.file.originalname,

parents:[
"1QoEa2AhLOfNHcVVsJu6xVesGI4foJ_9m"
]

},

media:{

mimeType:req.file.mimetype,

body:bufferStream

},

fields:"id",

supportsAllDrives:true

});

const fileId =
response.data.id;

await drive.permissions.create({

fileId,

requestBody:{

role:"reader",

type:"anyone"

}

});

const driveLink =
`https://drive.google.com/file/d/${fileId}/view`;

const chapter =
new PeriodChapter({

periodId:req.body.periodId,

teacherId:req.body.teacherId,

teacherName:req.body.teacherName,

className:req.body.className,

subject:req.body.subject,

day:req.body.day,

startTime:req.body.startTime,

endTime:req.body.endTime,

chapterNo:req.body.chapterNo,

chapterName:req.body.chapterName,

topicName:req.body.topicName,

documentName:req.file.originalname,

driveFileId:fileId,

driveLink

});

await chapter.save();

res.json({

success:true,

chapter

});

}catch(err){

console.log("PERIOD UPLOAD ERROR");

console.log(
err.response?.data || err
);

res.status(500).json({

success:false,

message:err.message,

error:
err.response?.data || err

});

}

});

router.get("/period/chapters/:periodId", async (req,res)=>{

try{

const chapters =
await PeriodChapter.find({

periodId:req.params.periodId

}).sort({

uploadDate:-1

});

res.json({

success:true,

chapters

});

}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

});

/*======================================================
            GET SINGLE CHAPTER
======================================================*/

router.get(
"/period/chapter/:id",

async(req,res)=>{

try{

const chapter =
await PeriodChapter.findById(
req.params.id
);

if(!chapter){

return res.status(404).json({

success:false,

message:"Chapter not found"

});

}

res.json({

success:true,

chapter

});

}catch(err){

res.status(500).json({

success:false,

message:err.message

});

}

});

router.put(
    "/teacher/:id/menu-permissions",
    founderController.updateTeacherMenuPermissions
);

router.put(
    "/teacher/:id/toggle-screen-share",
    founderController.toggleScreenShare
);
module.exports = router;