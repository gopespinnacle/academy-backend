const mongoose = require("mongoose");

const incomeExpenseSchema = new mongoose.Schema({

    // ================= DATE =================

    date: {
        type: Date,
        required: true
    },

    // ================= TYPE =================

    type: {
        type: String,
        enum: [
            "Income",
            "Expense"
        ],
        required: true
    },

    // ================= CATEGORY =================

    category: {
        type: String,
        required: true
    },

    // ================= SUB CATEGORY =================

    subCategory: {
        type: String,
        required: true
    },

    // ================= DESCRIPTION =================

    description: {
        type: String,
        default: ""
    },

    // ================= AMOUNT =================

    amount: {
        type: Number,
        required: true,
        min: 0
    },

    // ================= CREATED BY =================

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }

}, {
    timestamps: true
});


module.exports =
mongoose.model(
    "IncomeExpense",
    incomeExpenseSchema
);