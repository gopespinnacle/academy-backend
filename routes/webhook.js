const express = require("express");
const router = express.Router();
const Message = require("../models/Message");
const {
  sendWhatsAppMessage
} = require("../services/whatsappService");

// =====================================================
// META WEBHOOK VERIFICATION
// =====================================================

router.get("/webhook", (req, res) => {

  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("Webhook verification request received");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {

    console.log("WhatsApp webhook verified successfully");

    return res.status(200).send(challenge);

  } else {

    console.log("Webhook verification failed");

    return res.sendStatus(403);
  }
});


// =====================================================
// RECEIVE WHATSAPP MESSAGE
// =====================================================

router.post("/webhook", async (req, res) => {

  try {
    console.log("=================================");
console.log("📥 WHATSAPP WEBHOOK RECEIVED");
console.log(JSON.stringify(req.body, null, 2));
console.log("=================================");


    // Meta requires a quick 200 response
    res.sendStatus(200);

    const value =
      req.body?.entry?.[0]?.changes?.[0]?.value;

    if (!value) {
      return;
    }


    // =====================================================
    // RECEIVE INCOMING MESSAGE
    // =====================================================

    const message = value.messages?.[0];

    if (!message) {
      return;
    }


    const from = message.from;

    let text = "";

    // Text message
    if (message.type === "text") {

      text = message.text?.body || "";

    } else {

      text = `[${message.type} message]`;

    }


    console.log("=================================");
    console.log("📩 NEW WHATSAPP MESSAGE");
    console.log("From:", from);
    console.log("Message:", text);
    console.log("Type:", message.type);
    console.log("=================================");


    // =====================================================
    // SAVE INCOMING MESSAGE TO DATABASE
    // =====================================================

    await Message.create({

      from: from,

      to: process.env.WHATSAPP_PHONE_NUMBER,

      text: text,

      direction: "incoming",

      messageType: message.type,

      whatsappMessageId: message.id,

      timestamp: new Date()

    });


    console.log("✅ Incoming WhatsApp message saved");

    // =====================================================
// AUTO REPLY — NOTIFICATION ONLY NUMBER
// =====================================================

const autoReply = `
🎓 GOPES PINNACLE ACADEMY

Thank you for your message.

This WhatsApp number is used for academy notifications only and does not accept parent queries or support messages.

For assistance, please contact us through the official academy support channel.

📞 [+91-9566911472]

Thank you.
`;


const replyResult = await sendWhatsAppMessage(
  from,
  autoReply
);

if (replyResult.success) {

  console.log(
    "✅ Automatic notification-only reply sent"
  );

} else {

  console.log(
    "❌ Automatic reply failed:",
    replyResult.error
  );

}

  } catch (error) {

    console.error(
      "❌ WhatsApp webhook error:",
      error.response?.data || error.message
    );

  }

});

module.exports = router;