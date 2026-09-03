const pdf = require("pdf-parse");
const { createCanvas } = require("@napi-rs/canvas");
const { createWorker } = require("tesseract.js");

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

        const data = await pdf(fileBuffer);

        normalText = data.text || "";
        normalPages = data.numpages || 0;

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
     * return it without OCR.
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

            pageTexts: normalText
                .split("\f")
                .map(page => page.trim()),

            info: {}

        };

    }


    /*
     * STEP 3
     * PDF is probably scanned/image based.
     * Start OCR.
     */

    console.log(
        "NORMAL TEXT IS EMPTY/TOO SHORT."
    );

    console.log(
        "STARTING PDF PAGE OCR..."
    );


    /*
     * PDF.js is an ES module in the installed version.
     * Dynamic import allows us to use it
     * from this CommonJS backend.
     */

    const pdfjsLib =
        await import(
            "pdfjs-dist/legacy/build/pdf.mjs"
        );


    /*
     * Load PDF from memory.
     */

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


    /*
     * Start Tesseract worker.
     */

    


    const pageTexts = [];


    try {

        /*
         * Process every page sequentially.
         */

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
             * Scale controls OCR image quality.
             *
             * 2.0 gives a good balance between
             * quality and Render memory usage.
             */

            const scale = 1.0;

            const viewport =
                page.getViewport({
                    scale
                });


            /*
             * Create canvas for this PDF page.
             */

            let canvas =
    createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
    );

let context =
    canvas.getContext("2d");


            /*
             * Render PDF page into canvas.
             */

            await page.render({

                canvasContext: context,

                viewport

            }).promise;


            /*
             * Convert canvas to PNG.
             */

            let imageBuffer =
    canvas.toBuffer("image/png");


            console.log(
                `OCR PAGE ${pageNumber} IMAGE SIZE:`,
                imageBuffer.length
            );


            /*
             * Run OCR.
             */

            const worker =
    await createWorker("eng");

const result =
    await worker.recognize(
        imageBuffer
    );

await worker.terminate();


            const pageText =
                result.data.text || "";


            pageTexts.push(
                pageText.trim()
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

        }

        /*
 * Release PDF/image memory before next page.
 */

page.cleanup();

imageBuffer = null;
context = null;
canvas = null;

    } catch (err) {

        console.error(
            "OCR EXTRACTION FAILED:",
            err.message
        );

        throw err;

    }


    /*
     * Combine all OCR page text.
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

        text: combinedText,

        pages: pdfDocument.numPages,

        pageTexts,

        info: {}

    };

};