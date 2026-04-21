const express = require("express");
const router = express.Router();
const Admission = require("../models/Admission");

router.post("/admission", async (req, res) => {
    try {
        const { parentName, studentName, grade, mobile } = req.body;

        const newAdmission = new Admission({
            parentName,
            studentName,
            grade,
            mobile
        });

        await newAdmission.save();

        res.status(200).json({ message: "Saved successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;