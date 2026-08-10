/*
==========================================================
GOPES PINNACLE ACADEMY
BANK STATEMENT PDF PARSER
==========================================================

Supports:

1. SBI PDF statements
2. Bank of Baroda PDF statements

The original PDF is only read temporarily.

The password is used only during processing.
It is NEVER stored.

Output:

BankTransaction compatible objects.
==========================================================
*/

const fs = require("fs");


/*
==========================================================
HELPERS
==========================================================
*/

function cleanText(value) {

    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();

}


function isDate(value) {

    return /^(\d{2}[\/-]\d{2}[\/-]\d{4})$/.test(
        String(value || "").trim()
    );

}


function parseDate(value) {

    if (!value) {
        return null;
    }

    const clean = String(value)
        .trim()
        .replace(/\//g, "-");

    const parts = clean.split("-");

    if (parts.length !== 3) {
        return null;
    }

    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);

    if (
        !day ||
        !month ||
        !year
    ) {
        return null;
    }

    return new Date(
        Date.UTC(
            year,
            month - 1,
            day
        )
    );

}


function parseAmount(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return null;
    }

    let text = String(value)
        .trim()
        .replace(/₹/g, "")
        .replace(/,/g, "")
        .trim();

    if (
        text === "" ||
        text === "-" ||
        text === "–"
    ) {
        return null;
    }

    const number = Number(text);

    if (Number.isNaN(number)) {
        return null;
    }

    return number;

}


/*
==========================================================
UPI / BANK REFERENCE EXTRACTION
==========================================================
*/

function extractBankReference(
    description,
    chequeNumber = ""
) {

    const text =
        cleanText(description);


    /*
    ------------------------------------------------------
    SBI style

    UPI/DR/509193445551/...
    UPI/CR/123456789012/...
    ------------------------------------------------------
    */

    let match =
        text.match(
            /UPI\/(?:DR|CR)\/(\d{8,})/i
        );

    if (match) {

        return match[1];

    }


    /*
    ------------------------------------------------------
    BOB style

    UPI/688645971545/12:38:20/...
    ------------------------------------------------------
    */

    match =
        text.match(
            /UPI\/(\d{8,})\//i
        );

    if (match) {

        return match[1];

    }


    /*
    ------------------------------------------------------
    Generic UPI reference fallback
    ------------------------------------------------------
    */

    match =
        text.match(
            /(?:UPI|UPI\/[^\/]+)\/(\d{10,})/i
        );

    if (match) {

        return match[1];

    }


    /*
    ------------------------------------------------------
    NEFT / IMPS / RTGS fallback
    ------------------------------------------------------
    */

    match =
        text.match(
            /(?:NEFT|IMPS|RTGS)[\/\s:-]*([A-Z0-9]{8,})/i
        );

    if (match) {

        return match[1];

    }


    /*
    ------------------------------------------------------
    Cheque number fallback
    ------------------------------------------------------
    */

    const cheque =
        cleanText(chequeNumber);

    if (
        cheque &&
        cheque !== "-" &&
        cheque !== "–"
    ) {

        return cheque;

    }


    return "";

}


/*
==========================================================
TRANSACTION TYPE
==========================================================
*/

function getTransactionType(
    debit,
    credit,
    description
) {

    if (
        credit > 0 &&
        debit === 0
    ) {

        return "CREDIT";

    }


    if (
        debit > 0 &&
        credit === 0
    ) {

        return "DEBIT";

    }


    const text =
        cleanText(description)
            .toUpperCase();


    if (
        text.includes("TRANSFER") ||
        text.includes("SELF")
    ) {

        return "TRANSFER";

    }


    return "OTHER";

}


/*
==========================================================
GROUP PDF TEXT ITEMS INTO VISUAL ROWS
==========================================================
*/

function groupItemsIntoRows(
    items
) {

    const rows = [];


    /*
    ------------------------------------------------------
    PDF text items have Y coordinates.

    Items with nearly identical Y values belong to
    the same visual line.
    ------------------------------------------------------
    */

    const tolerance = 2.5;


    const sorted =
        items
            .filter(item =>
                item &&
                typeof item.str === "string" &&
                item.str.trim() !== ""
            )
            .map(item => ({

                text:
                    cleanText(item.str),

                x:
                    Number(item.transform?.[4] || 0),

                y:
                    Number(item.transform?.[5] || 0)

            }))
            .sort((a, b) => {

                if (
                    Math.abs(a.y - b.y) > tolerance
                ) {

                    return b.y - a.y;

                }

                return a.x - b.x;

            });


    for (const item of sorted) {

        let row = null;


        for (const existing of rows) {

            if (
                Math.abs(
                    existing.y - item.y
                ) <= tolerance
            ) {

                row = existing;

                break;

            }

        }


        if (!row) {

            row = {

                y: item.y,

                items: []

            };

            rows.push(row);

        }


        row.items.push(item);

    }


    rows.sort(
        (a, b) => b.y - a.y
    );


    rows.forEach(row => {

        row.items.sort(
            (a, b) => a.x - b.x
        );

        row.text =
            row.items
                .map(item => item.text)
                .join(" ");

    });


    return rows;

}


/*
==========================================================
FIND TRANSACTION ROW STARTS
==========================================================

A transaction row normally starts with a date in the
left-most table column.

We intentionally use the PDF coordinate rather than
simply searching the entire text because the statement
contains many other dates in the header.
==========================================================
*/

function findTransactionRows(
    rows,
    pageWidth
) {

    const dateRows = [];


    const leftLimit =
        pageWidth * 0.22;


    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i];


        const dateItem =
            row.items.find(item => {

                return (
                    item.x <= leftLimit &&
                    isDate(item.text)
                );

            });


        if (dateItem) {

            dateRows.push({

                index: i,

                date:
                    dateItem.text

            });

        }

    }


    return dateRows;

}


/*
==========================================================
EXTRACT ONE TRANSACTION
==========================================================
*/

function extractTransaction(
    rowGroup,
    bank,
    pageWidth
) {

    const allItems =
        rowGroup.flatMap(
            row => row.items
        );


    /*
    ------------------------------------------------------
    Find dates
    ------------------------------------------------------
    */

    const dateItems =
        allItems.filter(
            item =>
                isDate(item.text)
        );


    if (
        dateItems.length === 0
    ) {

        return null;

    }


    const transactionDate =
        parseDate(
            dateItems[0].text
        );


    if (!transactionDate) {

        return null;

    }


    /*
    ------------------------------------------------------
    BOB:
    first date = Transaction Date
    second date = Value Date

    SBI:
    first date = Value Date
    second date = Post Date
    ------------------------------------------------------
    */


    /*
    ------------------------------------------------------
    Find monetary values in the right side of the table.

    We use X position so numbers inside UPI descriptions
    are not mistaken for Debit/Credit/Balance.
    ------------------------------------------------------
    */

    const amountItems =
        allItems
            .filter(item => {

                return (
                    item.x >=
                    pageWidth * 0.58
                );

            })
            .filter(item => {

                return (
                    parseAmount(item.text) !== null
                );

            })
            .map(item => ({

                ...item,

                amount:
                    parseAmount(item.text)

            }))
            .sort(
                (a, b) => a.x - b.x
            );


    /*
    ------------------------------------------------------
    Balance is the right-most monetary value.
    ------------------------------------------------------
    */

    let balance = null;

    if (amountItems.length > 0) {

        balance =
            amountItems[
                amountItems.length - 1
            ].amount;

    }


    /*
    ------------------------------------------------------
    Debit / Credit

    We use the amount positions before Balance.

    Usually:

    Debit | Credit | Balance
    ------------------------------------------------------
    */

    let debit = 0;
    let credit = 0;


    if (
        amountItems.length >= 2
    ) {

        const middleAmounts =
            amountItems.slice(
                0,
                -1
            );


        if (
            middleAmounts.length === 1
        ) {

            /*
            If only one amount exists, we cannot safely
            determine whether it is Debit or Credit only
            from its value.

            Later we can use the exact column X position.
            */

            const amount =
                middleAmounts[0].amount;

            const x =
                middleAmounts[0].x;


            /*
            Credit column is normally to the right of
            Debit column.

            */

            if (
                x >
                pageWidth * 0.74
            ) {

                credit = amount;

            }
            else {

                debit = amount;

            }

        }
        else {

            /*
            More than one amount:

            first = Debit
            second = Credit
            */

            debit =
                middleAmounts[0].amount || 0;

            credit =
                middleAmounts[1].amount || 0;

        }

    }


    /*
    ------------------------------------------------------
    DESCRIPTION

    Keep text between date area and amount columns.
    ------------------------------------------------------
    */

    const descriptionItems =
        allItems.filter(item => {

            return (
                item.x >
                    pageWidth * 0.15 &&
                item.x <
                    pageWidth * 0.58 &&
                !isDate(item.text)
            );

        });


    const description =
        cleanText(
            descriptionItems
                .map(item => item.text)
                .join(" ")
        );


    /*
    ------------------------------------------------------
    CHEQUE / REFERENCE AREA

    For now we use the description-based extraction
    because SBI and BOB UPI references are embedded
    inside the Details / Description field.
    ------------------------------------------------------
    */

    const bankReference =
        extractBankReference(
            description
        );


    /*
    ------------------------------------------------------
    Ignore obvious table headers
    ------------------------------------------------------
    */

    const upperDescription =
        description.toUpperCase();


    if (
        upperDescription.includes("DETAILS") &&
        upperDescription.includes("BALANCE")
    ) {

        return null;

    }


    /*
    ------------------------------------------------------
    Build transaction
    ------------------------------------------------------
    */

    return {

        bank,

        transactionDate,

        description,

        bankReference,

        debit,

        credit,

        balance,

        transactionType:
            getTransactionType(
                debit,
                credit,
                description
            )

    };

}


/*
==========================================================
PARSE PDF
==========================================================
*/

async function parseBankStatementPdf({
    filePath,
    bank,
    password
}) {

    /*
    ------------------------------------------------------
    Load PDF.js dynamically.

    pdfjs-dist is ESM in current versions.
    ------------------------------------------------------
    */

    const pdfjsLib =
        await import(
            "pdfjs-dist/legacy/build/pdf.mjs"
        );


    const fileBuffer =
        fs.readFileSync(
            filePath
        );


    let passwordError = null;


    const loadingTask =
        pdfjsLib.getDocument({

            data:
                new Uint8Array(
                    fileBuffer
                ),

            password:
                password || undefined,

            useWorkerFetch: false,

            isEvalSupported: false,

            onPassword:
                function (
                    updatePassword,
                    reason
                ) {

                    /*
                    PDF.js password reasons:

                    1 = NEED_PASSWORD
                    2 = INCORRECT_PASSWORD
                    */

                    if (
                        !password
                    ) {

                        passwordError =
                            new Error(
                                "PDF_PASSWORD_REQUIRED"
                            );

                        return;

                    }


                    passwordError =
                        new Error(
                            "PDF_PASSWORD_INCORRECT"
                        );

                }

        });


    let pdf;


    try {

        pdf =
            await loadingTask.promise;

    }
    catch (error) {

        if (
            passwordError
        ) {

            throw passwordError;

        }

        throw error;

    }


    const transactions = [];


    /*
    ======================================================
    PROCESS EACH PAGE
    ======================================================
    */

    for (
        let pageNumber = 1;
        pageNumber <= pdf.numPages;
        pageNumber++
    ) {

        const page =
            await pdf.getPage(
                pageNumber
            );


        const viewport =
            page.getViewport({
                scale: 1
            });


        const textContent =
            await page.getTextContent({

                normalizeWhitespace: false,

                disableCombineTextItems: false

            });


        const rows =
            groupItemsIntoRows(
                textContent.items
            );


        const transactionStarts =
            findTransactionRows(
                rows,
                viewport.width
            );


        /*
        --------------------------------------------------
        Create groups:

        Transaction start
             ↓
        next transaction start
        --------------------------------------------------
        */

        for (
            let i = 0;
            i < transactionStarts.length;
            i++
        ) {

            const start =
                transactionStarts[i]
                    .index;


            const end =
                i + 1 <
                transactionStarts.length

                    ? transactionStarts[
                        i + 1
                    ].index

                    : rows.length;


            const rowGroup =
                rows.slice(
                    start,
                    end
                );


            const transaction =
                extractTransaction(
                    rowGroup,
                    bank,
                    viewport.width
                );


            if (
                transaction
            ) {

                transactions.push(
                    transaction
                );

            }

        }

    }


    return {

        pageCount:
            pdf.numPages,

        transactions

    };

}


module.exports = {

    parseBankStatementPdf

};