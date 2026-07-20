const pdf = require("pdf-parse");

exports.extractText = async (fileBuffer) => {

    const data = await pdf(fileBuffer);

    return {
        text: data.text,
        pages: data.numpages,
        info: data.info
    };

};