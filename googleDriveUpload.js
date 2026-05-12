const fs = require("fs");
const { google } = require("googleapis");

const credentials = JSON.parse(
    process.env.GOOGLE_CREDENTIALS
);

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: [
        "https://www.googleapis.com/auth/drive"
    ]
});

const drive = google.drive({
    version: "v3",
    auth
});

async function uploadFile(file){

    const response = await drive.files.create({

        requestBody: {
            name: file.originalname
        },

        media: {
            mimeType: file.mimetype,
            body: fs.createReadStream(file.path)
        },

        fields: "id"
    });

    await drive.permissions.create({

        fileId: response.data.id,

        requestBody: {
            role: "reader",
            type: "anyone"
        }

    });

    fs.unlinkSync(file.path);

    return `https://drive.google.com/file/d/${response.data.id}/view`;

}

module.exports = uploadFile;