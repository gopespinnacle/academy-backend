const axios = require("axios");

exports.sendWhatsApp = async (to, message) => {

    try {

        await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: to,
                type: "text",
                text: {
                    body: message
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ WhatsApp sent");

    } catch (err) {
        console.log("❌ WhatsApp error:", err.response?.data || err.message);
    }
};