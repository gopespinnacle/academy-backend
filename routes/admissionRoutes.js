const express = require("express");
const router = express.Router();
const Admission = require("../models/Admission");
const axios = require("axios");

router.post("/admission", async (req, res) => {
    try {
        const {

    parentName,
    studentName,
    grade,
    mobile,
    courses,

    studentDOB,
    parentMobile,
    parentWhatsapp,
    parentEmail,
    address,
    subjects,
    selectedPlan,
    totalAmount,
    utr

} = req.body;

        const newAdmission = new Admission({

    parentName,
    studentName,
    grade,
    mobile,
    courses,

    studentDOB,
    parentMobile,
    parentWhatsapp,
    parentEmail,
    address,
    subjects,
    selectedPlan,
    totalAmount,
    utr

});

        await newAdmission.save();

// 📲 1. SEND TO ADMIN (YOU)
await axios.post(
  `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
  {
    messaging_product: "whatsapp",
    to: "919566911472",
    type: "text",
    text: {
      body: `📥 New Admission

Parent: ${parentName}
Student: ${studentName}
Grade: ${grade}
Mobile: ${mobile}
Courses: ${courses.join(", ")}`
    }
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      "Content-Type": "application/json"
    }
  }
);


// 📲 2. SEND CONFIRMATION (TEMP → ALSO TO YOU)
await axios.post(
  `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
  {
    messaging_product: "whatsapp",
    to: "919566911472",   // 👈 SAME NUMBER (IMPORTANT)
    type: "text",
    text: {
      body: `Hi ${parentName},

Thank you for contacting Gopes Pinnacle Academy.

Your admission request for ${studentName} (Grade ${grade}) has been received.

Our team will contact you shortly.

– Gopes Pinnacle Academy`
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