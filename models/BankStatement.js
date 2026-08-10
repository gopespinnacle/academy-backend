/*
==========================================================
GOPES PINNACLE ACADEMY
BANK STATEMENT MODEL
==========================================================

Stores information about an imported SBI / BOB statement.

IMPORTANT:
The original statement file is NOT permanently stored.

The uploaded file will be temporarily processed.
Only statement information and extracted transactions
will remain in MongoDB.
==========================================================
*/

const mongoose = require("mongoose");

const bankStatementSchema = new mongoose.Schema(
    {

        // ================================================
        // BANK
        // ================================================

        bank: {
            type: String,
            required: true,
            enum: ["SBI", "BOB"],
            trim: true
        },


        // ================================================
        // ORIGINAL FILE NAME
        // ================================================

        fileName: {
            type: String,
            required: true,
            trim: true
        },


        // ================================================
        // STATEMENT PERIOD
        // Example: August 2026
        // ================================================

        statementPeriod: {
            type: String,
            required: true,
            trim: true
        },


        // ================================================
        // NUMBER OF TRANSACTIONS IMPORTED
        // ================================================

        transactionCount: {
            type: Number,
            default: 0,
            min: 0
        },


        // ================================================
        // USER WHO UPLOADED THE STATEMENT
        // ================================================

        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },


        // ================================================
        // IMPORT STATUS
        // ================================================

        status: {
            type: String,
            enum: [
                "PROCESSING",
                "IMPORTED",
                "FAILED"
            ],
            default: "PROCESSING"
        },


        // ================================================
        // ERROR MESSAGE
        // Used only if import fails
        // ================================================

        errorMessage: {
            type: String,
            default: "",
            trim: true
        }

    },
    {
        timestamps: true
    }
);


// ================================================
// INDEX
// ================================================

bankStatementSchema.index({
    bank: 1,
    statementPeriod: 1
});


module.exports = mongoose.model(
    "BankStatement",
    bankStatementSchema
);