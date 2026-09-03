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

    return {

        text: data.text,

        pages: data.numpages,

        pageTexts: pages,

        info: data.info

    };

};