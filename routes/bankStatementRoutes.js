/*
==========================================================
GOPES PINNACLE ACADEMY
BANK STATEMENT ROUTES
==========================================================
*/

const express = require("express");

const router = express.Router();

const multer = require("multer");

const fs = require("fs");

const path = require("path");

const mongoose = require("mongoose");

const BankStatement =
    require("../models/BankStatement");

const BankTransaction =
    require("../models/BankTransaction");

const {
    parseBankStatementPdf
} =
    require("../services/bankStatementParser");


/*
==========================================================
TEMPORARY BANK STATEMENT DIRECTORY
==========================================================
*/

const tempDirectory =
    path.join(
        __dirname,
        "../temp-bank-statements"
    );


if (
    !fs.existsSync(
        tempDirectory
    )
) {

    fs.mkdirSync(
        tempDirectory,
        {
            recursive: true
        }
    );

}


/*
==========================================================
MULTER
==========================================================
*/

const storage =
    multer.diskStorage({

        destination:
            function (
                req,
                file,
                cb
            ) {

                cb(
                    null,
                    tempDirectory
                );

            },

        filename:
            function (
                req,
                file,
                cb
            ) {

                const uniqueName =
                    Date.now() +
                    "-" +
                    Math.round(
                        Math.random() *
                        1000000000
                    ) +
                    path.extname(
                        file.originalname
                    );

                cb(
                    null,
                    uniqueName
                );

            }

    });


const upload =
    multer({

        storage,

        limits: {

            fileSize:
                15 * 1024 * 1024

        },

        fileFilter:
            function (
                req,
                file,
                cb
            ) {

                const extension =
                    path.extname(
                        file.originalname
                    ).toLowerCase();


                if (
                    extension !== ".pdf"
                ) {

                    return cb(
                        new Error(
                            "Only PDF bank statements are supported."
                        )
                    );

                }


                cb(
                    null,
                    true
                );

            }

    });


/*
==========================================================
DELETE TEMPORARY FILE
==========================================================
*/

function deleteTemporaryFile(
    filePath
) {

    if (
        filePath &&
        fs.existsSync(filePath)
    ) {

        try {

            fs.unlinkSync(
                filePath
            );

        }
        catch (error) {

            console.error(
                "Unable to delete temporary bank statement:",
                error.message
            );

        }

    }

}


/*
==========================================================
NORMALIZE BANK
==========================================================
*/

function normalizeBank(
    bank
) {

    const value =
        String(
            bank || ""
        )
        .trim()
        .toUpperCase();


    if (
        value !== "SBI" &&
        value !== "BOB"
    ) {

        return null;

    }


    return value;

}


/*
==========================================================
UPLOAD + PROCESS BANK STATEMENT
==========================================================

POST:

/api/founder/upload

Form-data:

bank
statementPeriod
pdfPassword
statement
==========================================================
*/

router.post(
    "/upload",
    upload.single("statement"),
    async function (
        req,
        res
    ) {

        let temporaryFile =
            null;

        let statementRecord =
            null;

        try {

            /*
            ------------------------------------------------
            FILE
            ------------------------------------------------
            */

            if (
                !req.file
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        "Please upload a bank statement PDF."

                });

            }


            temporaryFile =
                req.file.path;


            /*
            ------------------------------------------------
            BANK
            ------------------------------------------------
            */

            const bank =
                normalizeBank(
                    req.body.bank
                );


            if (
                !bank
            ) {

                deleteTemporaryFile(
                    temporaryFile
                );


                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        "Please select SBI or BOB."

                });

            }


            /*
            ------------------------------------------------
            STATEMENT PERIOD
            ------------------------------------------------
            */

            const statementPeriod =
                String(
                    req.body.statementPeriod ||
                    ""
                ).trim();


            if (
                !statementPeriod
            ) {

                deleteTemporaryFile(
                    temporaryFile
                );


                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        "Statement period is required."

                });

            }


            /*
            ------------------------------------------------
            PASSWORD

            IMPORTANT:
            We only use this during processing.

            We NEVER save it.
            ------------------------------------------------
            */

            const pdfPassword =
                String(
                    req.body.pdfPassword ||
                    ""
                );


            /*
            ------------------------------------------------
            CREATE STATEMENT RECORD
            ------------------------------------------------
            */

            statementRecord =
                await BankStatement.create({

                    bank,

                    fileName:
                        req.file.originalname,

                    statementPeriod,

                    transactionCount: 0,

                    uploadedBy:
                        req.user &&
                        req.user._id
                            ? req.user._id
                            : null,

                    status:
                        "PROCESSING"

                });


            /*
            =================================================
            PARSE PDF
            =================================================
            */

            const result =
                await parseBankStatementPdf({

                    filePath:
                        temporaryFile,

                    bank,

                    password:
                        pdfPassword

                });


            /*
            ------------------------------------------------
            Validate transaction extraction
            ------------------------------------------------
            */

            if (
                !result.transactions ||
                result.transactions.length === 0
            ) {

                throw new Error(
                    "No bank transactions could be extracted from this PDF."
                );

            }


            /*
            =================================================
            PREPARE TRANSACTIONS
            =================================================
            */

            const transactionDocuments =
                result.transactions.map(
                    transaction => ({

                        statementId:
                            statementRecord._id,

                        bank:
                            transaction.bank,

                        transactionDate:
                            transaction.transactionDate,

                        description:
                            transaction.description,

                        bankReference:
                            transaction.bankReference,

                        debit:
                            transaction.debit || 0,

                        credit:
                            transaction.credit || 0,

                        balance:
                            transaction.balance,

                        transactionType:
                            transaction.transactionType,

                        reconciliationStatus:
                            "UNMATCHED",

                        studentPaymentId:
                            null

                    })
                );


            /*
            =================================================
            SAVE TRANSACTIONS
            =================================================
            */

            await BankTransaction.insertMany(
                transactionDocuments
            );


            /*
            =================================================
            UPDATE STATEMENT
            =================================================
            */

            await BankStatement.findByIdAndUpdate(

                statementRecord._id,

                {

                    transactionCount:
                        transactionDocuments.length,

                    status:
                        "IMPORTED",

                    errorMessage:
                        ""

                }

            );


            /*
            =================================================
            DELETE ORIGINAL TEMPORARY PDF
            =================================================
            */

            deleteTemporaryFile(
                temporaryFile
            );


            temporaryFile =
                null;


            /*
            =================================================
            SUCCESS
            =================================================
            */

            return res.json({

                success: true,

                message:
                    "Bank statement imported successfully.",

                statementId:
                    statementRecord._id,

                bank,

                fileName:
                    req.file.originalname,

                pageCount:
                    result.pageCount,

                transactionCount:
                    transactionDocuments.length

            });

        }
        catch (error) {

            console.error(
                "Bank statement processing error:",
                error
            );


            /*
            ------------------------------------------------
            DELETE TEMPORARY PDF
            ------------------------------------------------
            */

            deleteTemporaryFile(
                temporaryFile
            );


            /*
            ------------------------------------------------
            Mark statement failed
            ------------------------------------------------
            */

            if (
                statementRecord
            ) {

                let errorMessage =
                    error.message ||
                    "Bank statement processing failed.";


                if (
                    error.message ===
                    "PDF_PASSWORD_REQUIRED"
                ) {

                    errorMessage =
                        "This PDF is password protected. Please enter the PDF password.";

                }


                if (
                    error.message ===
                    "PDF_PASSWORD_INCORRECT"
                ) {

                    errorMessage =
                        "The PDF password is incorrect.";

                }


                try {

                    await BankStatement.findByIdAndUpdate(

                        statementRecord._id,

                        {

                            status:
                                "FAILED",

                            errorMessage

                        }

                    );

                }
                catch (
                    updateError
                ) {

                    console.error(
                        "Unable to update statement failure:",
                        updateError.message
                    );

                }

            }


            return res.status(
                500
            ).json({

                success: false,

                message:
                    error.message ===
                    "PDF_PASSWORD_REQUIRED"

                        ? "Please enter the PDF password."

                        : error.message ===
                          "PDF_PASSWORD_INCORRECT"

                            ? "Incorrect PDF password."

                            : (
                                error.message ||
                                "Bank statement processing failed."
                              )

            });

        }

    }
);


/*
==========================================================
GET ALL BANK STATEMENTS
==========================================================
*/

router.get(
    "/",
    async function (
        req,
        res
    ) {

        try {

            const statements =
                await BankStatement.find()
                    .sort({

                        createdAt: -1

                    });


            return res.json({

                success: true,

                statements

            });

        }
        catch (error) {

            console.error(
                "Get bank statements error:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    "Unable to load bank statements."

            });

        }

    }
);
/*
==========================================================
DELETE ONE BANK STATEMENT
==========================================================

DELETE:

/api/founder/:statementId

IMPORTANT:
- Deletes all transactions belonging to the statement
- Deletes the statement record
- Original PDF is NOT stored permanently
==========================================================
*/

router.delete(
    "/:statementId",
    async function (
        req,
        res
    ) {

        try {

            const statementId =
                req.params.statementId;


            /*
            ------------------------------------------------
            VALIDATE ID
            ------------------------------------------------
            */

            if (
                !mongoose.Types.ObjectId.isValid(
                    statementId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        "Invalid bank statement ID."

                });

            }


            /*
            ------------------------------------------------
            CHECK STATEMENT EXISTS
            ------------------------------------------------
            */

            const statement =
                await BankStatement.findById(
                    statementId
                );


            if (
                !statement
            ) {

                return res.status(
                    404
                ).json({

                    success: false,

                    message:
                        "Bank statement not found."

                });

            }


            /*
            ------------------------------------------------
            DELETE ALL TRANSACTIONS
            ------------------------------------------------
            */

            await BankTransaction.deleteMany({

                statementId:
                    statementId

            });


            /*
            ------------------------------------------------
            DELETE STATEMENT
            ------------------------------------------------
            */

            await BankStatement.findByIdAndDelete(
                statementId
            );


            /*
            ------------------------------------------------
            SUCCESS
            ------------------------------------------------
            */

            return res.json({

                success: true,

                message:
                    "Bank statement and its transactions deleted successfully."

            });

        }
        catch (error) {

            console.error(
                "Delete bank statement error:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    "Unable to delete bank statement."

            });

        }

    }
);

/*
==========================================================
GET TRANSACTIONS FOR ONE STATEMENT
==========================================================
*/

router.get(
    "/:statementId/transactions",
    async function (
        req,
        res
    ) {

        try {

            const statementId =
                req.params.statementId;


            if (
                !mongoose.Types.ObjectId.isValid(
                    statementId
                )
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        "Invalid bank statement ID."

                });

            }


            const transactions =
                await BankTransaction.find({

                    statementId

                })
                .sort({

                    transactionDate: 1,
                    createdAt: 1

                });


            return res.json({

                success: true,

                transactions

            });

        }
        catch (error) {

            console.error(
                "Get bank transactions error:",
                error
            );


            return res.status(
                500
            ).json({

                success: false,

                message:
                    "Unable to load bank transactions."

            });

        }

    }
);


/*
==========================================================
EXPORT
==========================================================
*/

module.exports =
    router;