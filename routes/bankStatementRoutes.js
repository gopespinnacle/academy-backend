/*
==========================================================
GOPES PINNACLE ACADEMY
BANK STATEMENT ROUTES
==========================================================

Purpose:

1. Receive SBI / BOB statement PDFs.
2. Process the PDF temporarily.
3. Extract transaction information.
4. Store BankStatement + BankTransaction in MongoDB.
5. Delete the temporary uploaded file.

IMPORTANT:

The original bank statement is NOT permanently stored.

Supported banks:
- SBI
- BOB
==========================================================
*/

const express = require("express");
const router = express.Router();

const multer = require("multer");
const fs = require("fs");
const path = require("path");

const mongoose = require("mongoose");

const BankStatement = require("../models/BankStatement");
const BankTransaction = require("../models/BankTransaction");


/*
==========================================================
MULTER CONFIGURATION
==========================================================

We use a temporary directory only.

The uploaded PDF will be deleted after processing.
==========================================================
*/

const tempDirectory = path.join(
    __dirname,
    "../temp-bank-statements"
);


/*
----------------------------------------------------------
Create temporary directory if it does not exist.
----------------------------------------------------------
*/

if (!fs.existsSync(tempDirectory)) {

    fs.mkdirSync(
        tempDirectory,
        {
            recursive: true
        }
    );

}


/*
----------------------------------------------------------
Temporary disk storage
----------------------------------------------------------
*/

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(
            null,
            tempDirectory
        );

    },


    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1000000000) +
            path.extname(file.originalname);

        cb(
            null,
            uniqueName
        );

    }

});


/*
==========================================================
FILE FILTER
==========================================================
*/

const upload = multer({

    storage: storage,

    limits: {

        fileSize: 15 * 1024 * 1024

    },

    fileFilter: function (req, file, cb) {

        const extension =
            path.extname(
                file.originalname
            ).toLowerCase();


        if (extension !== ".pdf") {

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
HELPER
==========================================================
*/

function deleteTemporaryFile(filePath) {

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
BANK VALIDATION
==========================================================
*/

function normalizeBank(bank) {

    const value =
        String(bank || "")
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
UPLOAD BANK STATEMENT
==========================================================

POST:

/api/bank-statements/upload

Form fields:

bank
statementPeriod
statement

Example:

bank = SBI

statementPeriod = August 2026

statement = SBI.pdf
==========================================================
*/

router.post(
    "/upload",
    upload.single("statement"),
    async function (req, res) {

        let temporaryFile = null;

        let statementRecord = null;


        try {

            /*
            --------------------------------------------------
            Validate uploaded file
            --------------------------------------------------
            */

            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Please upload a bank statement PDF."

                });

            }


            temporaryFile =
                req.file.path;


            /*
            --------------------------------------------------
            Validate bank
            --------------------------------------------------
            */

            const bank =
                normalizeBank(
                    req.body.bank
                );


            if (!bank) {

                deleteTemporaryFile(
                    temporaryFile
                );


                return res.status(400).json({

                    success: false,

                    message:
                        "Please select SBI or BOB."

                });

            }


            /*
            --------------------------------------------------
            Statement period
            --------------------------------------------------
            */

            const statementPeriod =
                String(
                    req.body.statementPeriod || ""
                ).trim();


            if (!statementPeriod) {

                deleteTemporaryFile(
                    temporaryFile
                );


                return res.status(400).json({

                    success: false,

                    message:
                        "Statement period is required."

                });

            }


            /*
            --------------------------------------------------
            Create BankStatement record
            --------------------------------------------------
            */

            statementRecord =
                await BankStatement.create({

                    bank: bank,

                    fileName:
                        req.file.originalname,

                    statementPeriod:
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
            ==================================================
            IMPORTANT
            ==================================================

            The actual PDF parser will be added in the
            next block after we test the exact SBI/BOB
            PDF structure.

            For now we deliberately stop here.

            We do NOT want to save incorrect transaction
            data based on guessed PDF positions.
            ==================================================
            */


            return res.status(200).json({

                success: true,

                message:
                    "Bank statement received successfully. PDF parser is ready for the next block.",

                statementId:
                    statementRecord._id,

                bank:
                    bank,

                fileName:
                    req.file.originalname

            });

        }
        catch (error) {

            console.error(
                "Bank statement upload error:",
                error
            );


            /*
            --------------------------------------------------
            Delete temporary file
            --------------------------------------------------
            */

            deleteTemporaryFile(
                temporaryFile
            );


            /*
            --------------------------------------------------
            If a BankStatement record was created,
            mark it as FAILED.
            --------------------------------------------------
            */

            if (statementRecord) {

                try {

                    await BankStatement.findByIdAndUpdate(

                        statementRecord._id,

                        {

                            status: "FAILED",

                            errorMessage:
                                error.message ||
                                "Bank statement processing failed."

                        }

                    );

                }
                catch (updateError) {

                    console.error(
                        "Unable to update statement status:",
                        updateError.message
                    );

                }

            }


            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Bank statement processing failed."

            });

        }

    }
);


/*
==========================================================
GET IMPORTED BANK STATEMENTS
==========================================================

GET:

/api/bank-statements

Used later by founder-bank-statements.html
==========================================================
*/

router.get(
    "/",
    async function (req, res) {

        try {

            const statements =
                await BankStatement.find()
                    .sort({
                        createdAt: -1
                    });


            return res.json({

                success: true,

                statements:
                    statements

            });

        }
        catch (error) {

            console.error(
                "Get bank statements error:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Unable to load bank statements."

            });

        }

    }
);


/*
==========================================================
GET TRANSACTIONS FOR ONE STATEMENT
==========================================================

GET:

/api/bank-statements/:statementId/transactions
==========================================================
*/

router.get(
    "/:statementId/transactions",
    async function (req, res) {

        try {

            const statementId =
                req.params.statementId;


            if (
                !mongoose.Types.ObjectId.isValid(
                    statementId
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid bank statement ID."

                });

            }


            const transactions =
                await BankTransaction.find({

                    statementId:
                        statementId

                })
                .sort({

                    transactionDate: 1

                });


            return res.json({

                success: true,

                transactions:
                    transactions

            });

        }
        catch (error) {

            console.error(
                "Get bank transactions error:",
                error
            );


            return res.status(500).json({

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

module.exports = router;