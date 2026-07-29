const express = require("express");
const router = express.Router();



const {
    uploadDemoVideo,
    getVideos,
    deleteVideo,
    updateVideo,
    getVideo,
    incrementViews,
    duplicateVideo,
    generateUploadUrl,
    saveVideo
} = require("../controllers/demoVideoController");

/*
=========================================
UPLOAD DEMO VIDEO
=========================================
*/

router.post(
    "/upload-url",
    generateUploadUrl
);

router.post(
    "/save",
    saveVideo
);

router.post(
    "/upload-url",
    generateUploadUrl
);

router.post(
    "/save",
    saveVideo
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