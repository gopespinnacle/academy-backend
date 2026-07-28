const express = require("express");
const router = express.Router();

const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: {
        fileSize: 1024 * 1024 * 1024 // 1 GB
    }
});

const {
    uploadDemoVideo,
    getVideos,
    deleteVideo,
    updateVideo,
    getVideo,
    incrementViews,
    duplicateVideo
} = require("../controllers/demoVideoController");

/*
=========================================
UPLOAD DEMO VIDEO
=========================================
*/

router.post(
    "/upload",
    upload.single("video"),
    uploadDemoVideo
);
/*
=========================================
GET VIDEOS
=========================================
*/

router.get(
    "/list",
    getVideos
);

router.post("/:id/duplicate", duplicateVideo);

/*
=========================================
DELETE VIDEO
=========================================
*/

router.delete(
    "/:id",
    deleteVideo
);

/*
=========================================
UPDATE VIDEO
=========================================
*/

router.put(
    "/:id",
    updateVideo
);
/*
=========================================
GET SINGLE VIDEO
=========================================
*/

router.get(
    "/:id",
    getVideo
);
router.post("/:id/view", incrementViews);
module.exports = router;