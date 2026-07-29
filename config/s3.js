console.log("Bucket:", process.env.AWS_BUCKET);
console.log("Region:", process.env.AWS_REGION);
console.log("Access:", process.env.AWS_ACCESS_KEY ? "YES" : "NO");
console.log("Secret:", process.env.AWS_SECRET_KEY ? "YES" : "NO");

const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand
} = require("@aws-sdk/client-s3");

const {
    getSignedUrl
} = require("@aws-sdk/s3-request-presigner");

const client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
}
});

exports.uploadFile = async (file, folder) => {

    const key = `${folder}/${Date.now()}-${file.originalname}`;


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

    console.log("Deleting from S3:", key);

    await client.send(new DeleteObjectCommand({

        Bucket: process.env.AWS_BUCKET,

        Key: key

    }));

    console.log("Deleted successfully from S3");


};

exports.getUploadUrl = async (fileName, contentType) => {

    const key = `demo-videos/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({

        Bucket: process.env.AWS_BUCKET,

        Key: key,

        ContentType: contentType

    });

    const uploadUrl = await getSignedUrl(
        client,
        command,
        {
            expiresIn: 300
        }
    );

    return {

        uploadUrl,

        key,

        videoUrl:
`https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`

    };

};