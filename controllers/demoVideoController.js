const DemoVideo = require("../models/DemoVideo");
const {
    uploadFile,
    deleteFile,
    getUploadUrl
} = require("../config/s3");

exports.uploadDemoVideo = async (req, res) => {

    try{

        if(!req.file){

            return res.status(400).json({
                success:false,
                message:"Video not selected."
            });

        }

        const existingVideo = await DemoVideo.findOne({

    title: req.body.title,

    grade: req.body.grade,

    subject: req.body.subject

});

if(existingVideo){

    return res.status(400).json({

        success:false,

        message:"A demo video with the same title already exists for this Grade and Subject."

    });

}

        const result = await uploadFile(
            req.file,
            "demo-videos"
        );

        const video = await DemoVideo.create({

    title:req.body.title,

    teacherName:req.body.teacherName,

    grade:req.body.grade,

    subject:req.body.subject,

    videoUrl:result.Location,

    fileName:result.Key,

    duration:req.body.duration || ""

});

        res.json({

            success:true,

            message:"Demo video uploaded successfully.",

            data:video

        });

    }catch(err){

        console.log(err);

        res.status(500).json({

            success:false,

            message:"Upload failed."

        });

    }

};

exports.getVideo = async (req, res) => {

    try {

        const video = await DemoVideo.findById(req.params.id);

        if (!video) {

            return res.status(404).json({
                success: false,
                message: "Video not found"
            });

        }

        res.json({
            success: true,
            data: video
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};
exports.getVideos = async (req, res) => {

    try {

        const { grade, subject } = req.query;

        const videos = await DemoVideo.find({
            grade,
            subject
        }).sort({
            uploadDate: -1
        });

        res.json({
            success: true,
            data: videos
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Error loading videos."
        });

    }

};

exports.incrementViews = async (req, res) => {

    try {

        const video = await DemoVideo.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found"
            });
        }

        video.views += 1;

        await video.save();

        res.json({
            success: true,
            views: video.views
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};

exports.deleteVideo = async (req, res) => {

    try {

        const video = await DemoVideo.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        // Delete from AWS S3
        await deleteFile(video.fileName);

        // Delete from MongoDB
        await DemoVideo.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Video deleted successfully."
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Delete failed."
        });

    }

};

exports.updateVideo = async (req, res) => {

    try {

        const { title, teacherName } = req.body;

        const video = await DemoVideo.findById(req.params.id);

        if (!video) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }

        video.title = title;
        video.teacherName = teacherName;

        await video.save();

        res.json({
            success: true,
            message: "Video updated successfully.",
            data: video
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Update failed."
        });

    }

};

exports.duplicateVideo = async (req, res) => {

    try {

        const sourceVideo = await DemoVideo.findById(req.params.id);

        if (!sourceVideo) {
            return res.status(404).json({
                success: false,
                message: "Video not found."
            });
        }
        
        const existingVideo = await DemoVideo.findOne({

    title: sourceVideo.title,

    grade: req.body.grade,

    subject: req.body.subject

});

if(existingVideo){

    return res.status(400).json({

        success:false,

        message:"A demo video with the same title already exists for this Grade and Subject."

    });

}
        const newVideo = await DemoVideo.create({

            title: sourceVideo.title,

            teacherName: sourceVideo.teacherName,

            grade: req.body.grade,

            subject: req.body.subject,

            videoUrl: sourceVideo.videoUrl,

            fileName: sourceVideo.fileName,

            duration: sourceVideo.duration,

            views: 0

        });

        res.json({
            success: true,
            message: "Video duplicated successfully.",
            data: newVideo
        });

    } catch (err) {

        console.log(err);

        res.status(500).json({
            success: false,
            message: "Duplicate failed."
        });

    }

};

exports.saveVideo = async (req, res) => {

    try {

        const existingVideo = await DemoVideo.findOne({

            title: req.body.title,
            grade: req.body.grade,
            subject: req.body.subject

        });

        if (existingVideo) {

            return res.status(400).json({

                success: false,
                message: "A demo video with the same title already exists for this Grade and Subject."

            });

        }

        const video = await DemoVideo.create({

            title: req.body.title,

            teacherName: req.body.teacherName,

            grade: req.body.grade,

            subject: req.body.subject,

            videoUrl: req.body.videoUrl,

            fileName: req.body.fileName,

            duration: req.body.duration,

            views: 0

        });

        res.json({

            success: true,

            message: "Video saved successfully.",

            data: video

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Save failed."

        });

    }

};


exports.generateUploadUrl = async (req, res) => {

    try {

        const { fileName, contentType } = req.body;

        const result = await getUploadUrl(fileName, contentType);

        res.json({

            success: true,

            uploadUrl: result.uploadUrl,

            videoUrl: result.videoUrl,

            key: result.key

        });

    } catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,

            message: "Unable to generate upload URL."

        });

    }

};