const pdf = require("pdf-parse");
const { createCanvas } = require("@napi-rs/canvas");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync =
    promisify(execFile);


exports.extractText = async (fileBuffer) => {

    console.log("======================================");
    console.log("PDF OCR EXTRACTION STARTED");
    console.log("======================================");


    /*
     * STEP 1
     * Try normal PDF text extraction first.
     */

    let normalText = "";
    let normalPages = 0;

    try {

        const data =
            await pdf(fileBuffer);

        normalText =
            data.text || "";

        normalPages =
            data.numpages || 0;

        console.log(
            "NORMAL PDF TEXT LENGTH:",
            normalText.length
        );

        console.log(
            "NORMAL PDF PAGES:",
            normalPages
        );

    } catch (err) {

        console.error(
            "NORMAL PDF EXTRACTION FAILED:",
            err.message
        );

    }


    /*
     * STEP 2
     * If useful text already exists,
     * use it directly.
     */

    if (
        normalText.trim().length > 100
    ) {

        console.log(
            "USE NORMAL PDF TEXT EXTRACTION"
        );

        return {

            text: normalText,

            pages: normalPages,

            pageTexts:
                normalText
                    .split("\f")
                    .map(
                        page =>
                            page.trim()
                    ),

            info: {}

        };

    }


    /*
     * STEP 3
     * Scanned/image PDF.
     * Start OCR.
     */

    console.log(
        "NORMAL TEXT IS EMPTY/TOO SHORT."
    );

    console.log(
        "STARTING PDF PAGE OCR..."
    );


    /*
     * Load PDF.js.
     */

    const pdfjsLib =
        await import(
            "pdfjs-dist/legacy/build/pdf.mjs"
        );


    const pdfData =
        new Uint8Array(fileBuffer);


    const loadingTask =
        pdfjsLib.getDocument({
            data: pdfData
        });


    const pdfDocument =
        await loadingTask.promise;


    console.log(
        "PDF OCR PAGE COUNT:",
        pdfDocument.numPages
    );


    const pageTexts = [];


    /*
     * Process every page separately.
     */

    try {

        for (
            let pageNumber = 1;
            pageNumber <= pdfDocument.numPages;
            pageNumber++
        ) {

            console.log(
                `OCR PAGE ${pageNumber}/${pdfDocument.numPages} STARTED`
            );


            const page =
                await pdfDocument.getPage(
                    pageNumber
                );


            /*
             * Keep image resolution moderate
             * for Render memory.
             */

            const scale = 1.0;


            const viewport =
                page.getViewport({
                    scale
                });


            let canvas =
                createCanvas(
                    Math.ceil(viewport.width),
                    Math.ceil(viewport.height)
                );


            let context =
                canvas.getContext("2d");


            /*
             * Render PDF page to canvas.
             */

            await page.render({

                canvasContext:
                    context,

                viewport

            }).promise;


            /*
             * Convert page to PNG.
             */

            const imageBuffer =
                canvas.toBuffer(
                    "image/png"
                );


            console.log(
                `OCR PAGE ${pageNumber} IMAGE SIZE:`,
                imageBuffer.length
            );


            /*
             * Save PNG temporarily.
             */

            const imagePath =
                path.join(
                    os.tmpdir(),
                    `gopes-ocr-${process.pid}-${Date.now()}-${pageNumber}.png`
                );


            await fs.promises.writeFile(
                imagePath,
                imageBuffer
            );


            /*
             * Run OCR in a SEPARATE Node process.
             */

            try {

                const workerScript =
                    path.join(
                        __dirname,
                        "ocrPage.js"
                    );


                const result =
                    await execFileAsync(
                        process.execPath,
                        [
                            workerScript,
                            imagePath
                        ],
                        {
                            maxBuffer:
                                10 * 1024 * 1024
                        }
                    );


                const output =
                    result.stdout || "";


                /*
                 * Extract only the OCR text
                 * between our markers.
                 */

                const startMarker =
                    "OCR_RESULT_START";

                const endMarker =
                    "OCR_RESULT_END";


                const startIndex =
                    output.indexOf(
                        startMarker
                    );


                const endIndex =
                    output.indexOf(
                        endMarker
                    );


                if (
                    startIndex === -1 ||
                    endIndex === -1
                ) {

                    throw new Error(
                        `OCR result markers missing for page ${pageNumber}.`
                    );

                }


                const pageText =
                    output
                        .substring(
                            startIndex +
                            startMarker.length,
                            endIndex
                        )
                        .trim();


                pageTexts.push(
                    pageText
                );


                console.log(
                    `OCR PAGE ${pageNumber} TEXT LENGTH:`,
                    pageText.length
                );


                console.log(
                    `OCR PAGE ${pageNumber} PREVIEW:`,
                    pageText
                        .substring(0, 200)
                        .replace(/\n/g, " ")
                );


            } finally {

                /*
                 * Delete temporary image.
                 */

                try {

                    await fs.promises.unlink(
                        imagePath
                    );

                } catch (cleanupError) {

                    console.error(
                        `OCR TEMP FILE CLEANUP FAILED FOR PAGE ${pageNumber}:`,
                        cleanupError.message
                    );

                }

            }


            /*
             * Release PDF.js and canvas memory.
             */

            page.cleanup();

            context = null;

            canvas = null;

        }


    } finally {

        /*
         * Release PDF document resources.
         */

        try {

            if (
                pdfDocument.cleanup
            ) {

                await pdfDocument.cleanup();

            }

        } catch (cleanupError) {

            console.error(
                "PDF DOCUMENT CLEANUP ERROR:",
                cleanupError.message
            );

        }

    }


    /*
     * Combine all page text.
     */

    const combinedText =
        pageTexts.join("\n\n");


    console.log(
        "======================================"
    );

    console.log(
        "OCR COMPLETE"
    );

    console.log(
        "TOTAL OCR TEXT LENGTH:",
        combinedText.length
    );

    console.log(
        "PAGE TEXT LENGTHS:",
        pageTexts.map(
            (page, index) =>
                `Page ${index + 1}: ${page.length}`
        )
    );

    console.log(
        "======================================"
    );


    return {

        text:
            combinedText,

        pages:
            pdfDocument.numPages,

        pageTexts,

        info: {}

    };

};