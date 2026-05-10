const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const KEYFILEPATH = path.join(__dirname, "credentials.json");

const SCOPES = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({
    version: "v3",
    auth,
});

async function uploadFile(file) {

    const fileMetadata = {
        name: file.originalname,
        parents: ["1v4hjGN5LFb8ddXQVhEeI-SuInH35kgQ0"]
    };

    const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: "id, webViewLink",
    });

    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: "reader",
            type: "anyone",
        },
    });

    fs.unlinkSync(file.path);

    return `https://drive.google.com/file/d/${response.data.id}/view`;
}

module.exports = uploadFile;