const axios = require("axios");

async function sendWhatsApp(mobile, teacherName) {

    try {

        await axios.post(

            `https://graph.facebook.com/v23.0/${process.env.PHONE_NUMBER_ID}/messages`,

            {
                messaging_product: "whatsapp",

                to: "91" + mobile,

                type: "text",

                text: {
                    body:
`🎉 Thank You for Applying to Gopes Pinnacle Academy

Dear ${teacherName},

Thank you for your interest in joining Gopes Pinnacle Academy.

We have successfully received your teaching application and resume.

Our recruitment team will carefully review your profile. If your qualifications match our current requirements, we will contact you regarding the next stage of the recruitment process.

Warm Regards,

Gopes Pinnacle Academy
www.gopespinnacle.com`
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