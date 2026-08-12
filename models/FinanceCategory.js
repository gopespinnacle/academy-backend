const mongoose = require("mongoose");

const financeCategorySchema = new mongoose.Schema({

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

    // ================= SUB CATEGORIES =================

    subCategories: [
        {
            type: String
        }
    ],

    // ================= STATUS =================

    active: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true
});


// Prevent duplicate Category under same Type

financeCategorySchema.index(
    {
        type: 1,
        category: 1
    },
    {
        unique: true
    }
);


module.exports =
mongoose.model(
    "FinanceCategory",
    financeCategorySchema
);