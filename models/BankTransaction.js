/*
==========================================================
GOPES PINNACLE ACADEMY
BANK TRANSACTION MODEL
==========================================================

Stores every transaction extracted from an SBI / BOB
bank statement.

This becomes the permanent transaction data used for:

    Bank Statements
          ↓
    Student Fee Reconciliation
          ↓
    Income / Expense
==========================================================
*/

const mongoose = require("mongoose");

const bankTransactionSchema = new mongoose.Schema(
    {

        // ================================================
        // PARENT BANK STATEMENT
        // ================================================

        statementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "BankStatement",
            required: true,
            index: true
        },


        // ================================================
        // BANK
        // ================================================

        bank: {
            type: String,
            required: true,
            enum: ["SBI", "BOB"],
            trim: true,
            index: true
        },


        // ================================================
        // TRANSACTION DATE
        // ================================================

        transactionDate: {
            type: Date,
            required: true,
            index: true
        },


        // ================================================
        // DESCRIPTION
        // ================================================

        description: {
            type: String,
            default: "",
            trim: true
        },


        // ================================================
        // BANK REFERENCE / UTR
        //
        // This will later be compared with the
        // Student Fee Payment Reference.
        // ================================================

        bankReference: {
            type: String,
            default: "",
            trim: true,
            index: true
        },


        // ================================================
        // DEBIT
        // ================================================

        debit: {
            type: Number,
            default: 0,
            min: 0
        },


        // ================================================
        // CREDIT
        // ================================================

        credit: {
            type: Number,
            default: 0,
            min: 0
        },


        // ================================================
        // RUNNING BALANCE
        // ================================================

        balance: {
            type: Number,
            default: null
        },


        // ================================================
        // TRANSACTION TYPE
        // ================================================

        transactionType: {
            type: String,
            enum: [
                "CREDIT",
                "DEBIT",
                "TRANSFER",
                "OTHER"
            ],
            default: "OTHER"
        },


        // ================================================
        // RECONCILIATION STATUS
        // ================================================

        reconciliationStatus: {
            type: String,
            enum: [
                "UNMATCHED",
                "MATCHED",
                "DUPLICATE"
            ],
            default: "UNMATCHED"
        },


        // ================================================
        // LINKED STUDENT PAYMENT
        //
        // This will remain NULL until the transaction
        // is matched with a Student Fee payment.
        // ================================================

        studentPaymentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudentPayment",
            default: null,
            index: true
        }

    },
    {
        timestamps: true
    }
);


// ================================================
// INDEXES
// ================================================

bankTransactionSchema.index({
    statementId: 1,
    transactionDate: 1
});

bankTransactionSchema.index({
    bank: 1,
    bankReference: 1
});


module.exports = mongoose.model(
    "BankTransaction",
    bankTransactionSchema
);