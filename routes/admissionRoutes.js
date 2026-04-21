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
    type: "template",
    template: {
      name: "admission_alert",
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: parentName },
            { type: "text", text: studentName },
            { type: "text", text: grade },
            { type: "text", text: mobile }
          ]
        }
      ]
    }
  },
  {
    headers: {
      Authorization: `Bearer YOUR_ACCESS_TOKEN`,
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