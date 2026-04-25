const express = require("express");
const router = express.Router();
const Admission = require("../models/Admission");
const axios = require("axios");

router.post("/admission", async (req, res) => {
    try {
        const { parentName, studentName, grade, mobile, courses } = req.body;

        const newAdmission = new Admission({
    parentName,
    studentName,
    grade,
    mobile,
    courses   // 🔥 ADD THIS
});

        await newAdmission.save();

        // 📲 1. SEND TO ADMIN (YOU)
await axios.post(
  `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
  {
    messaging_product: "whatsapp",
    to: "919566911472", // your number
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
            { type: "text", text: mobile },
            { type: "text", text: courses.join(", ") }
          ]
        }
      ]
    }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    }
  }
);


// 📲 2. SEND TO PARENT
// 📲 SEND TEST MESSAGE
await axios.post(
  `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
  {
    messaging_product: "whatsapp",
    to: "919566911472",
    type: "text",
    text: {
      body: "🚀 Website working! Admission received."
    }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
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