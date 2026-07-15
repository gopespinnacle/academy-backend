
const axios = require("axios");
const {

buildTeacherApplicationMessage,

buildFounderApplicationMessage

} = require("../utils/whatsappTemplates");



async function sendWhatsApp(mobile, application, type = "teacher") {

    try {

        let message;

if (type === "teacher") {

    message = buildTeacherApplicationMessage(application);

} else {

    message = buildFounderApplicationMessage(application);

}

        await axios.post(

            `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`,

            {
                messaging_product: "whatsapp",

                to: "91" + mobile,

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

        console.log("WhatsApp sent successfully");

    } catch (err) {

        console.log("WhatsApp Error");

        console.log(err.response?.data || err.message);

    }

}

module.exports = sendWhatsApp;