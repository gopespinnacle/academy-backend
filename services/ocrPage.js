const { createWorker } = require("tesseract.js");

async function runOCR() {

    try {

        /*
         * Receive PNG image path from the parent process.
         */

        const imagePath =
            process.argv[2];

        if (!imagePath) {

            throw new Error(
                "OCR image path was not provided."
            );

        }


        console.log(
            "OCR WORKER STARTED"
        );


        /*
         * Create Tesseract worker.
         */

        const worker =
    await createWorker("eng");


/*
 * Configure OCR for normal educational
 * document/page layouts.
 */

await worker.setParameters({

    tessedit_pageseg_mode: "3",

    preserve_interword_spaces: "1"

});


        /*
         * Run OCR on the image.
         */

        const result =
            await worker.recognize(
                imagePath
            );


        const text =
            result.data.text || "";


        console.log(
            "OCR WORKER TEXT LENGTH:",
            text.length
        );


        /*
         * Return OCR result to parent process.
         *
         * Prefix makes it easy for the parent
         * process to identify the result.
         */

        process.stdout.write(
            "OCR_RESULT_START\n"
        );

        process.stdout.write(
            text
        );

        process.stdout.write(
            "\nOCR_RESULT_END\n"
        );


        /*
         * Terminate Tesseract before exiting.
         */

        await worker.terminate();


        console.log(
            "OCR WORKER FINISHED"
        );


        process.exit(0);

    } catch (err) {

        console.error(
            "OCR WORKER ERROR:",
            err.message
        );

        process.exit(1);

    }

}


runOCR();