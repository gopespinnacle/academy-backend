const Curiosity = require("../models/Curiosity");
const { uploadFile, deleteFile } = require("../config/s3");


exports.uploadContent = async (req, res) => {

    try {

        if (!req.file) {
            return res.status(400).json({
                success:false,
                message:"No file uploaded"
            });
        }

        const result = await uploadFile(
    req.file,
    "curiosity"
);

        

        const curiosity = await Curiosity.create({

            title:req.body.title,

            category:req.body.category,

            description:req.body.description,

            mediaType:req.body.mediaType,

            mediaUrl:result.Location,

            s3Key:result.Key,

            featured:req.body.featured==="true"

        });

        res.json({
            success:true,
            data:curiosity
        });

    } catch(err){

        console.log(err);

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

};



exports.getAllContent = async(req,res)=>{

    try{

        const data = await Curiosity.find()
        .sort({createdAt:-1});

        res.json(data);

    }catch(err){

        res.status(500).json(err);

    }

};

exports.getCategoryContent = async (req, res) => {

    try {

        const category = req.params.category;

        const data = await Curiosity.find({

            category: category

        }).sort({

            createdAt: -1

        });

        res.json({

            success: true,

            data

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message

        });

    }

};

exports.deleteContent = async (req, res) => {

    try {

        const item = await Curiosity.findById(req.params.id);

        console.log("DELETE ITEM:", item);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Not Found"
            });
        }

        console.log("S3 KEY:", item.s3Key);

        await deleteFile(item.s3Key);

        await item.deleteOne();

        res.json({
            success: true
        });

    } catch (err) {

        console.error("DELETE ERROR:", err);

        res.status(500).json({
            success: false,
            message: err.message
        });

    }

};