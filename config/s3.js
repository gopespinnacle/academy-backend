console.log("Bucket:", process.env.AWS_BUCKET);
console.log("Region:", process.env.AWS_REGION);
console.log("Access:", process.env.AWS_ACCESS_KEY_ID ? "YES" : "NO");
console.log("Secret:", process.env.AWS_SECRET_ACCESS_KEY ? "YES" : "NO");

const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
});

exports.uploadFile = async (file) => {

    const key = Date.now() + "-" + file.originalname;

    await client.send(new PutObjectCommand({

        Bucket: process.env.AWS_BUCKET,

        Key: key,

        Body: file.buffer,

        ContentType: file.mimetype

    }));

    return {

        Key: key,

        Location: `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    };

};

exports.deleteFile = async (key) => {

    await client.send(new DeleteObjectCommand({

        Bucket: process.env.AWS_BUCKET,

        Key: key

    }));

};