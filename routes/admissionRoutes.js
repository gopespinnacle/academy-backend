const express = require("express");
const router = express.Router();
const Admission = require("../models/Admission");
const axios = require("axios");

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

        // 📲 SEND WHATSAPP MESSAGE (MOVE HERE ✅)
        await axios.post(
            "https://graph.facebook.com/v18.0/1082967508231476/messages",
            {
                messaging_product: "whatsapp",
                to: "919566911472",
                type: "text",
                text: {
                    body: `📢 New Admission Request

👨 Parent: ${parentName}
👧 Student: ${studentName}
📚 Grade: ${grade}
📞 Mobile: ${mobile}`
                }
            },
            {
                headers: {
                    Authorization: `Bearer EAAVkwxL5JawBRRSbmuzJLWMX025DjsaISq4qEozFNf2lAaNeheWpq2ZB8OgviaB5dGqPiWO4LuuK92qr83hogcX5mPElEZAtAtOxH8oVgjxLJB4IArNvsMoF0FRb7VOlqB6xPhSZABjCl0goh58aoRPXjQS9UbLcxZB8mcyySQGXClK3snZAwhC7h0kKsayBUlffDOQIedlhm4ZBZCEPwJqfpGIoZAMGGTKd63cC1sDy`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.status(200).json({ message: "Saved + WhatsApp Sent" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;