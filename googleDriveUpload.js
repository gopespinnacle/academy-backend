const fs = require("fs");
const { google } = require("googleapis");

const SCOPES = [
    "https://www.googleapis.com/auth/drive"
];

const credentials = JSON.parse(
    process.env.GOOGLE_CREDENTIALS
);

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
});

const drive = google.drive({
    version: "v3",
    auth,
});

async function uploadFile(file){

    const fileMetadata = {
        name: file.originalname,

        parents: [
    "1O6Zn8xlD_PCvtZOzG66OSqSSuTHOAp3k"
]
    };

    const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: "id",
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