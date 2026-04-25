const express = require("express");
const router = express.Router();
const axios = require("axios");
const Message = require("../models/Message");

// VERIFY WEBHOOK (META REQUIREMENT)
router.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "myverifytoken"; // set same in Meta

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// RECEIVE MESSAGE
router.post("/webhook", async (req, res) => {

  try {
    const message = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

    if (message) {
      const from = message.from;
      const text = message.text?.body;

      console.log("📩 Incoming:", from, text);

      // 1️⃣ SAVE IN DB
      await Message.create({ from, text });

      // 2️⃣ FORWARD TO YOU
      await axios.post(
        `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: "919566911472",
          type: "text",
          text: {
            body: `📩 Student Reply\nNumber: ${from}\nMessage: ${text}`
          }
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
    }

    res.sendStatus(200);

  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

module.exports = router;