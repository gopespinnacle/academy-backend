const axios = require("axios");

async function sendWhatsAppMessage(phone, message) {

    try {

        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",

                to: phone,

                type: "text",

                text: {
                    body: message
                }
            },
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.WHATSAPP_TOKEN}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );

        console.log(
            "✅ WhatsApp message sent:",
            response.data
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {

        console.log(
            "❌ WhatsApp Error:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error:
                error.response?.data || error.message
        };
    }
}

module.exports = {
    sendWhatsAppMessage
};