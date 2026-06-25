const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const controller = require("../controllers/curiosityController");

router.post("/upload",
    upload.single("file"),
    controller.uploadContent
);

router.get("/all",
    controller.getAllContent
);

router.get(
    "/category/:category",
    controller.getCategoryContent
);

router.delete(
    "/:id",
    controller.deleteContent
);
module.exports = router;