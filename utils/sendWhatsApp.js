
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

async function testWhatsApp() {

    try {

        await sendWhatsApp(

            "9566911472",

            {

                teacherName: "Vishnu Gopeka",

                applicationId: "TEST-0001",

                email: "info@gopespinnacle.com",

                mobile: "9566911472",

                education: "M.E.",

                timing: "6 PM - 7 PM"

            },

            "teacher"

        );

        console.log("================================");
        console.log("WHATSAPP TEST SUCCESS");
        console.log("================================");

    } catch (error) {

        console.log("================================");
        console.log("WHATSAPP TEST FAILED");
        console.log(error.response?.data || error.message);
        console.log("================================");

    }

}
testWhatsApp();

module.exports = sendWhatsApp;