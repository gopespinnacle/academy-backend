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

const { createCanvas } =
    require("@napi-rs/canvas");

const {
    createWorker
} = require("tesseract.js");


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

A transaction row normally starts with a date.

Different SBI / BOB PDF statements can place the first
date at slightly different X positions.

Therefore we do NOT depend on a very strict 22% limit.

We still protect against header dates by requiring the
date to appear in the transaction-table area.
==========================================================
*/

/*
==========================================================
FIND REAL TRANSACTION ROWS
==========================================================

IMPORTANT:

A bank statement contains many dates that are NOT
transactions.

Examples:

- Account opening date
- Statement period
- Statement From / To
- Summary dates
- Page dates
- Header dates

Therefore:

DATE ALONE IS NOT ENOUGH.

A real transaction must also have either:

1. A bank transaction keyword
OR
2. A monetary value in the transaction columns
OR
3. A bank reference / UPI reference

==========================================================
*/

function findTransactionRows(
    rows,
    pageWidth
) {

    const dateRows = [];


    /*
    ------------------------------------------------------
    DATE AREA
    ------------------------------------------------------
    */

    const leftLimit =
        pageWidth * 0.40;


    /*
    ------------------------------------------------------
    CHECK EVERY PDF ROW
    ------------------------------------------------------
    */

    for (
        let i = 0;
        i < rows.length;
        i++
    ) {

        const row =
            rows[i];


        /*
        --------------------------------------------------
        FIND DATE
        --------------------------------------------------
        */

        const dateItem =
            row.items.find(
                item => {

                    return (
                        item.x <= leftLimit &&
                        isDate(item.text)
                    );

                }
            );


        /*
        --------------------------------------------------
        NO DATE = NOT A TRANSACTION
        --------------------------------------------------
        */

        if (
            !dateItem
        ) {

            continue;

        }


        /*
        --------------------------------------------------
        BUILD ROW TEXT
        --------------------------------------------------
        */

        const rowText =
            cleanText(
                row.items
                    .map(
                        item =>
                            item.text
                    )
                    .join(" ")
            );


        const upperText =
            rowText.toUpperCase();


        /*
        --------------------------------------------------
        IGNORE STATEMENT / ACCOUNT INFORMATION
        --------------------------------------------------
        */

        if (
            upperText.includes(
                "STATEMENT FROM"
            ) ||
            upperText.includes(
                "STATEMENT TO"
            ) ||
            upperText.includes(
                "ACCOUNT OPENED"
            ) ||
            upperText.includes(
                "ACCOUNT OPENING"
            ) ||
            upperText.includes(
                "STATEMENT PERIOD"
            ) ||
            upperText.includes(
                "ACCOUNT INFORMATION"
            )
        ) {

            continue;

        }


        /*
        --------------------------------------------------
        IGNORE TABLE HEADERS
        --------------------------------------------------
        */

        if (
            upperText.includes("DETAILS") &&
            upperText.includes("BALANCE")
        ) {

            continue;

        }


        /*
        --------------------------------------------------
        LOOK FOR TRANSACTION KEYWORDS
        --------------------------------------------------
        */

        const hasTransactionKeyword =
            upperText.includes("UPI/DR") ||
            upperText.includes("UPI/CR") ||
            upperText.includes("WDL TFR") ||
            upperText.includes("DEP TFR") ||
            upperText.includes("NEFT") ||
            upperText.includes("RTGS") ||
            upperText.includes("IMPS") ||
            upperText.includes("ATM") ||
            upperText.includes("POS") ||
            upperText.includes("CASH") ||
            upperText.includes("CHEQUE") ||
            upperText.includes("CHQ") ||
            upperText.includes("TRANSFER") ||
            upperText.includes("WITHDRAWAL") ||
            upperText.includes("DEPOSIT");


        /*
        --------------------------------------------------
        LOOK FOR MONEY IN RIGHT SIDE
        --------------------------------------------------

        The right side normally contains:

        Debit | Credit | Balance
        --------------------------------------------------
        */

        const hasRightSideAmount =
            row.items.some(
                item => {

                    if (
                        item.x <
                        pageWidth * 0.55
                    ) {

                        return false;

                    }


                    return (
                        parseAmount(
                            item.text
                        ) !== null
                    );

                }
            );


        /*
        --------------------------------------------------
        LOOK FOR BANK REFERENCE
        --------------------------------------------------
        */

        const hasBankReference =
            row.items.some(
                item => {

                    const text =
                        String(
                            item.text || ""
                        )
                        .trim();


                    return (
                        /^\d{8,16}$/.test(
                            text
                        )
                    );

                }
            );


        /*
        --------------------------------------------------
        REAL TRANSACTION TEST
        --------------------------------------------------

        A date by itself is NOT enough.

        The row must contain some evidence that it
        belongs to a transaction.
        --------------------------------------------------
        */

        if (
            !hasTransactionKeyword &&
            !hasRightSideAmount &&
            !hasBankReference
        ) {

            continue;

        }


        /*
        --------------------------------------------------
        STORE TRANSACTION START
        --------------------------------------------------
        */

        dateRows.push({

            index:
                i,

            date:
                dateItem.text

        });

    }


    return dateRows;

}


/*
==========================================================
EXTRACT ONE TRANSACTION
==========================================================
*/

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
    FIND DATE
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
    DESCRIPTION
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


    const upperDescription =
        description.toUpperCase();


    /*
    ------------------------------------------------------
    IGNORE SBI STATEMENT HEADER / ACCOUNT INFORMATION
    ------------------------------------------------------
    */

    if (
        upperDescription.includes("STATEMENT FROM") ||
        upperDescription.includes("STATEMENT TO") ||
        upperDescription.includes("ACCOUNT OPENED") ||
        upperDescription.includes("ACCOUNT OPENING") ||
        upperDescription.includes("STATEMENT PERIOD")
    ) {

        return null;

    }


    /*
    ------------------------------------------------------
    IGNORE TABLE HEADER
    ------------------------------------------------------
    */

    if (
        upperDescription.includes("DETAILS") &&
        upperDescription.includes("BALANCE")
    ) {

        return null;

    }


    /*
    ------------------------------------------------------
    BANK REFERENCE
    ------------------------------------------------------
    */

    const bankReference =
        extractBankReference(
            description
        );


    /*
    ------------------------------------------------------
    TRANSACTION TYPE

    SBI examples:

    UPI/DR = DEBIT
    UPI/CR = CREDIT
    WDL TFR = DEBIT
    DEP TFR = CREDIT
    ------------------------------------------------------
    */

    const transactionText =
        upperDescription;


    const isDebitTransaction =
        transactionText.includes("UPI/DR/") ||
        transactionText.includes("WDL TFR") ||
        transactionText.includes("WITHDRAWAL");


    const isCreditTransaction =
        transactionText.includes("UPI/CR/") ||
        transactionText.includes("DEP TFR") ||
        transactionText.includes("DEPOSIT");


    /*
    ------------------------------------------------------
    FIND MONETARY VALUES

    IMPORTANT:

    We only look at the right side of the statement.

    The RIGHT-MOST amount is Balance.

    The amount immediately BEFORE Balance is the actual
    transaction amount.

    This prevents account numbers / UPI reference numbers
    from being treated as Debit.
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
            .map(item => {

                const amount =
                    parseAmount(
                        item.text
                    );

                return {

                    ...item,

                    amount

                };

            })
            .filter(item => {

                return (
                    item.amount !== null
                );

            })
            .sort(
                (a, b) =>
                    a.x - b.x
            );


    /*
    ------------------------------------------------------
    WE NEED AT LEAST:

    Movement Amount
    +
    Balance

    ------------------------------------------------------
    */

    if (
        amountItems.length < 2
    ) {

        return null;

    }


    /*
    ------------------------------------------------------
    RIGHT-MOST AMOUNT = BALANCE
    ------------------------------------------------------
    */

    const balanceItem =
        amountItems[
            amountItems.length - 1
        ];


    const balance =
        balanceItem.amount;


    /*
    ------------------------------------------------------
    ALL AMOUNTS BEFORE BALANCE

    These may contain:

    - account numbers
    - reference numbers
    - actual transaction amount

    Therefore we DO NOT automatically take [0].
    ------------------------------------------------------
    */

    const movementItems =
        amountItems.slice(
            0,
            -1
        );


    if (
        movementItems.length === 0
    ) {

        return null;

    }


    /*
    ------------------------------------------------------
    IMPORTANT FIX

    The ACTUAL transaction amount is the
    RIGHT-MOST monetary value before Balance.

    Example:

    WRONG OLD LOGIC:

    [989415115300] [2500] [6801]
          ↑           ↑      ↑
      account/noise  credit balance

    Old code selected:

    989415115300 ❌

    New code selects:

    2500 ✅
    ------------------------------------------------------
    */

    const transactionAmountItem =
        movementItems[
            movementItems.length - 1
        ];


    const transactionAmount =
        transactionAmountItem.amount;


    /*
    ------------------------------------------------------
    INITIAL VALUES
    ------------------------------------------------------
    */

    let debit = 0;

    let credit = 0;


    /*
    ------------------------------------------------------
    EXPLICIT SBI DEBIT
    ------------------------------------------------------
    */

    if (
        isDebitTransaction &&
        !isCreditTransaction
    ) {

        debit =
            transactionAmount;

    }


    /*
    ------------------------------------------------------
    EXPLICIT SBI CREDIT
    ------------------------------------------------------
    */

    else if (
        isCreditTransaction &&
        !isDebitTransaction
    ) {

        credit =
            transactionAmount;

    }


    /*
    ------------------------------------------------------
    FALLBACK

    If description does not clearly say DR / CR,
    use the position of the transaction amount.

    Debit is normally left of Credit.
    ------------------------------------------------------
    */

    else {

        const x =
            transactionAmountItem.x;


        if (
            x >=
            pageWidth * 0.72
        ) {

            credit =
                transactionAmount;

        }
        else {

            debit =
                transactionAmount;

        }

    }


    /*
    ------------------------------------------------------
    SAFETY

    A transaction should NOT have both Debit and Credit.
    ------------------------------------------------------
    */

    if (
        debit > 0 &&
        credit > 0
    ) {

        if (
            isCreditTransaction
        ) {

            debit = 0;

        }
        else {

            credit = 0;

        }

    }


    /*
    ------------------------------------------------------
    BUILD TRANSACTION
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
    password = ""
}) {

    /*
    ======================================================
    LOAD PDF.JS
    ======================================================
    */

    const pdfjsLib =
        await import(
            "pdfjs-dist/legacy/build/pdf.mjs"
        );


    /*
    ======================================================
    READ PDF FILE
    ======================================================
    */

    const fileBuffer =
        fs.readFileSync(
            filePath
        );


    /*
    ======================================================
    PASSWORD HANDLING
    ======================================================
    */

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


                    if (
                        reason === 1
                    ) {

                        updatePassword(
                            password
                        );

                        return;

                    }


                    passwordError =
                        new Error(
                            "PDF_PASSWORD_INCORRECT"
                        );

                }

        });


    /*
    ======================================================
    OPEN PDF
    ======================================================
    */

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


    /*
    ======================================================
    CHECK FOR TEXT LAYER
    ======================================================
    */

    let hasTextLayer = false;


    for (
        let pageNumber = 1;
        pageNumber <=
            Math.min(
                pdf.numPages,
                2
            );
        pageNumber++
    ) {

        const testPage =
            await pdf.getPage(
                pageNumber
            );


        const testText =
            await testPage.getTextContent({

                normalizeWhitespace: false,

                disableCombineTextItems: false

            });


        if (
            testText.items &&
            testText.items.some(
                item =>
                    item.str &&
                    item.str.trim()
            )
        ) {

            hasTextLayer = true;

            break;

        }

    }


    console.log(
        "📄 PDF text layer:",
        hasTextLayer
            ? "YES"
            : "NO"
    );


    /*
    ======================================================
    OCR FALLBACK FOR IMAGE-BASED PDF
    ======================================================
    */

    if (
        !hasTextLayer
    ) {

        console.log(
            "📷 Image-based PDF detected."
        );


        const ocrTransactions =
            await extractTransactionsUsingOCR(
                pdf,
                bank
            );


        return {

            pageCount:
                pdf.numPages,

            transactions:
                ocrTransactions

        };

    }


    /*
    ======================================================
    PROCESS TEXT-BASED PDF
    ======================================================
    */

    const transactions = [];


    /*
    ======================================================
    PROCESS EVERY PAGE
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


        /*
        --------------------------------------------------
        GROUP PDF TEXT ITEMS INTO ROWS
        --------------------------------------------------
        */

        const rows =
            groupItemsIntoRows(
                textContent.items
            );


        /*
        --------------------------------------------------
        FIND TRANSACTION STARTS
        --------------------------------------------------
        */

        const transactionStarts =
            findTransactionRows(
                rows,
                viewport.width
            );


        /*
        --------------------------------------------------
        CREATE TRANSACTION GROUPS
        --------------------------------------------------
        */

        for (
            let i = 0;
            i <
            transactionStarts.length;
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


            /*
            ------------------------------------------------
            EXTRACT TRANSACTION
            ------------------------------------------------
            */

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


    /*
    ======================================================
    FINAL RESULT
    ======================================================
    */

    return {

        pageCount:
            pdf.numPages,

        transactions

    };

}

/*
==========================================================
OCR FALLBACK
==========================================================
*/

async function extractTransactionsUsingOCR(
    pdf,
    bank
) {

    console.log(
        "📷 Image-based PDF detected."
    );

    console.log(
        "🔎 OCR FALLBACK STARTED"
    );

    const worker =
        await createWorker("eng");

    const transactions = [];

    try {

        for (
            let pageNumber = 1;
            pageNumber <= pdf.numPages;
            pageNumber++
        ) {

            console.log(
                `🔎 OCR page ${pageNumber}/${pdf.numPages}`
            );

            const page =
                await pdf.getPage(
                    pageNumber
                );

            /*
            ------------------------------------------------
            Render PDF page as image
            ------------------------------------------------
            */

            const viewport =
                page.getViewport({
                    scale: 2.5
                });

            const canvas =
                createCanvas(
                    Math.ceil(viewport.width),
                    Math.ceil(viewport.height)
                );

            const context =
                canvas.getContext("2d");

            await page.render({

                canvasContext:
                    context,

                viewport

            }).promise;


            /*
            ------------------------------------------------
            Convert page to PNG
            ------------------------------------------------
            */

            const imageBuffer =
                canvas.toBuffer(
                    "image/png"
                );


            /*
            ------------------------------------------------
            OCR
            ------------------------------------------------
            */

            const result =
                await worker.recognize(
                    imageBuffer
                );

            const words =
                result.data.words || [];

            console.log(
                `🔎 OCR words found: ${words.length}`
            );


            /*
            ------------------------------------------------
            Group OCR words into rows
            ------------------------------------------------
            */

            const rows = [];

            const tolerance = 12;


            for (
                const word of words
            ) {

                if (
                    !word.text ||
                    !word.text.trim()
                ) {

                    continue;

                }


                const x =
                    Number(
                        word.bbox?.x0 || 0
                    );

                const y =
                    Number(
                        word.bbox?.y0 || 0
                    );


                let row = null;


                for (
                    const existing of rows
                ) {

                    if (
                        Math.abs(
                            existing.y - y
                        ) <= tolerance
                    ) {

                        row = existing;

                        break;

                    }

                }


                if (!row) {

                    row = {

                        y,

                        items: []

                    };

                    rows.push(row);

                }


                row.items.push({

                    text:
                        cleanText(
                            word.text
                        ),

                    x,

                    y

                });

            }


            rows.sort(
                (a, b) =>
                    a.y - b.y
            );


            rows.forEach(
                row => {

                    row.items.sort(
                        (a, b) =>
                            a.x - b.x
                    );

                    row.text =
                        row.items
                            .map(
                                item =>
                                    item.text
                            )
                            .join(" ");

                }
            );


            /*
            ------------------------------------------------
            Find transaction starting rows
            ------------------------------------------------
            */

            const dateRows = [];


            for (
                let i = 0;
                i < rows.length;
                i++
            ) {

                const row =
                    rows[i];


                const dateItem =
                    row.items.find(
                        item =>
                            item.x <
                                viewport.width *
                                0.18 &&
                            isDate(
                                item.text
                            )
                    );


                if (dateItem) {

    const rowText =
        cleanText(row.text).toUpperCase();

    /*
    ------------------------------------------------------
    IGNORE SBI STATEMENT HEADER / ACCOUNT INFORMATION
    ------------------------------------------------------
    */

    if (
        rowText.includes("STATEMENT FROM") ||
        rowText.includes("STATEMENT TO") ||
        rowText.includes("ACCOUNT OPENED") ||
        rowText.includes("ACCOUNT OPENING") ||
        rowText.includes("STATEMENT PERIOD")
    ) {

        continue;

    }


    dateRows.push({

        index: i,

        date:
            dateItem.text

    });

}

            }


            /*
            ------------------------------------------------
            Extract transactions
            ------------------------------------------------
            */

            for (
                let i = 0;
                i < dateRows.length;
                i++
            ) {

                const start =
                    dateRows[i].index;


                const end =
                    i + 1 <
                    dateRows.length

                        ? dateRows[
                            i + 1
                        ].index

                        : rows.length;


                const rowGroup =
                    rows.slice(
                        start,
                        end
                    );


                const transaction =
                    extractOCRTransaction(
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

    }
    finally {

        await worker.terminate();

    }


    console.log(
        `✅ OCR transactions found: ${transactions.length}`
    );


    return transactions;

}


/*
==========================================================
OCR TRANSACTION EXTRACTION
==========================================================
*/

function extractOCRTransaction(
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
    DATE
    ------------------------------------------------------
    */

    const dateItem =
        allItems.find(
            item =>
                item.x <
                    pageWidth * 0.18 &&
                isDate(
                    item.text
                )
        );


    if (!dateItem) {

        return null;

    }


    const transactionDate =
        parseDate(
            dateItem.text
        );


    if (!transactionDate) {

        return null;

    }


    /*
    ------------------------------------------------------
    DESCRIPTION
    ------------------------------------------------------
    */

    const descriptionItems =
        allItems.filter(
            item =>
                item.x >
                    pageWidth * 0.12 &&
                item.x <
                    pageWidth * 0.58 &&
                !isDate(
                    item.text
                )
        );


    const description =
        cleanText(
            descriptionItems
                .map(
                    item =>
                        item.text
                )
                .join(" ")
        );


    /*
    ------------------------------------------------------
    AMOUNTS

    SBI / BOB:

    Debit | Credit | Balance
    ------------------------------------------------------
    */

    const amountItems =
        allItems
            .filter(
                item =>
                    item.x >=
                    pageWidth * 0.55
            )
            .map(
                item => ({

                    ...item,

                    amount:
                        parseOCRAmount(
                            item.text
                        )

                })
            )
            .filter(
                item =>
                    item.amount !== null
            )
            .sort(
                (a, b) =>
                    a.x - b.x
            );


    if (
        amountItems.length === 0
    ) {

        return null;

    }


    /*
    ------------------------------------------------------
    RIGHT-MOST NUMBER = BALANCE
    ------------------------------------------------------
    */

    const balanceItem =
        amountItems[
            amountItems.length - 1
        ];


    const balance =
        balanceItem.amount;


    let debit = 0;

    let credit = 0;


    /*
    ------------------------------------------------------
    AMOUNTS BEFORE BALANCE

    Debit column is left of Credit column.
    ------------------------------------------------------
    */

    const movementItems =
        amountItems.filter(
            item =>
                item !== balanceItem
        );


    for (
        const item of movementItems
    ) {

        if (
            item.x <
            pageWidth * 0.72
        ) {

            debit =
                item.amount;

        }
        else {

            credit =
                item.amount;

        }

    }


    /*
    ------------------------------------------------------
    BANK REFERENCE
    ------------------------------------------------------
    */

    const bankReference =
        extractBankReference(
            description
        );


    /*
    ------------------------------------------------------
    IGNORE HEADER ROWS
    ------------------------------------------------------
    */

    const upperDescription =
        description.toUpperCase();


    if (
        upperDescription.includes(
            "DETAILS"
        ) &&
        upperDescription.includes(
            "BALANCE"
        )
    ) {

        return null;

    }


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
OCR AMOUNT
==========================================================
*/

function parseOCRAmount(
    value
) {

    if (
        value === null ||
        value === undefined
    ) {

        return null;

    }


    let text =
        String(value)
            .trim()
            .replace(/[₹Rs.]/gi, "")
            .replace(/,/g, "")
            .trim();


    text =
        text
            .replace(
                /^O(?=\d)/i,
                "0"
            )
            .replace(
                /^I(?=\d)/i,
                "1"
            )
            .replace(
                /^l(?=\d)/i,
                "1"
            );


    if (
        text === "" ||
        text === "-" ||
        text === "–"
    ) {

        return null;

    }


    if (
        !/^\d+(?:\.\d{1,2})?$/.test(
            text
        )
    ) {

        return null;

    }


    const number =
        Number(text);


    if (
        Number.isNaN(number)
    ) {

        return null;

    }


    return number;

}

module.exports = {

    parseBankStatementPdf

};