const pdf = require("pdf-parse");

exports.extractText = async (fileBuffer) => {

    const pages = [];

    const options = {

        pagerender: async (pageData) => {

            const renderOptions = {
                normalizeWhitespace: false,
                disableCombineTextItems: false
            };

            const textContent =
                await pageData.getTextContent(renderOptions);

            const pageText =
                textContent.items
                    .map(item => item.str)
                    .join(" ");

            pages.push(pageText);

            return pageText;

        }

    };

    const data =
        await pdf(fileBuffer, options);

        console.log(
    "PDF TOTAL TEXT LENGTH:",
    data.text ? data.text.length : 0
);

console.log(
    "PDF PAGE TEXT LENGTHS:",
    pages.map((page, index) =>
        `Page ${index + 1}: ${page.length}`
    )
);

    return {

        text: data.text,

        pages: data.numpages,

        pageTexts: pages,

        info: data.info

    };

};