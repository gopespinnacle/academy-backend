const axios = require("axios");
const FormData = require("form-data");

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

async function sendWhatsAppTemplate(phone, parameters) {

    try {

        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",

                to: phone,

                type: "template",

                template: {
                    name: "daily_class_report",

                    language: {
                        code: "en"
                    },

                    components: [
                        {
                            type: "body",

                            parameters: parameters.map(value => ({
                                type: "text",
                                text: String(value ?? "")
                            }))
                        }
                    ]
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
            "✅ WhatsApp template sent:",
            response.data
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {

        console.log(
            "❌ WhatsApp Template Error:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error:
                error.response?.data || error.message
        };
    }
}

async function sendStudentAccountWhatsApp(
    phone,
    studentName,
    studentId,
    loginId,
    password
) {

    try {

        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",

                to: phone,

                type: "template",

                template: {

                    name: "student_account_created",

                    language: {
                        code: "en"
                    },

                    components: [

                        {
                            type: "body",

                            parameters: [

                                {
                                    type: "text",
                                    text: String(studentName ?? "")
                                },

                                {
                                    type: "text",
                                    text: String(studentId ?? "")
                                },

                                {
                                    type: "text",
                                    text: String(loginId ?? "")
                                },

                                {
                                    type: "text",
                                    text: String(password ?? "")
                                }

                            ]
                        }

                    ]
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
            "✅ Student account WhatsApp sent:",
            response.data
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {

        console.log(
            "❌ Student account WhatsApp Error:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error:
                error.response?.data || error.message
        };
    }
}


async function sendChampionshipRegistrationAck(
    phone,
    studentName,
    competitions,
    totalAmount
) {
    try {
        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",
                template: {
                    name: "championship_registration_ack",
                    language: {
                        code: "en"
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: String(studentName)
                                },
                                {
                                    type: "text",
                                    text: String(competitions)
                                },
                                {
                                    type: "text",
                                    text: String(totalAmount)
                                }
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

        console.log(
            "Championship registration acknowledgement sent:",
            response.data
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {
        console.error(
            "Championship registration acknowledgement error:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}


async function sendChampionshipOTP(phone, otp) {

    try {

        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",

                template: {
                    name: "championship_password_otp",

                    language: {
                        code: "en"
                    },

                    components: [

                        {
                            type: "body",

                            parameters: [
                                {
                                    type: "text",
                                    text: String(otp)
                                }
                            ]
                        },

                        {
                            type: "button",
                            sub_type: "url",
                            index: "0",

                            parameters: [
                                {
                                    type: "text",
                                    text: String(otp)
                                }
                            ]
                        }

                    ]
                }
            },
            {
                headers: {
                    Authorization:
                        `Bearer ${process.env.WHATSAPP_TOKEN}`,

                    "Content-Type": "application/json"
                }
            }
        );

        console.log(
            "✅ Championship OTP template sent:",
            response.data
        );

        return {
            success: true,
            data: response.data
        };

    } catch (error) {

        console.error(
            "❌ Championship OTP template error:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}



async function sendWhatsAppDocument(
    phone,
    pdfBuffer,
    filename,
    studentName,
    participantId
) {
    try {

        // Step 1: Upload PDF to WhatsApp
        const formData = new FormData();

        formData.append("messaging_product", "whatsapp");

        formData.append("file", pdfBuffer, {
            filename: filename,
            contentType: "application/pdf"
        });

        const uploadResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/media`,
            formData,
            {
                headers: {
                    ...formData.getHeaders(),
                    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`
                }
            }
        );

        const mediaId = uploadResponse.data.id;

        // Step 2: Send PDF using approved Utility template
        const sendResponse = await axios.post(
            `https://graph.facebook.com/v18.0/${process.env.PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: "whatsapp",
                to: phone,
                type: "template",

                template: {
                    name: "championship_participant_confirmation",

                    language: {
                        code: "en"
                    },

                    components: [
                        {
                            type: "header",
                            parameters: [
                                {
                                    type: "document",
                                    document: {
                                        id: mediaId,
                                        filename: filename
                                    }
                                }
                            ]
                        },
                        {
                            type: "body",
                            parameters: [
                                {
                                    type: "text",
                                    text: String(studentName ?? "")
                                },
                                {
                                    type: "text",
                                    text: String(participantId ?? "")
                                }
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

        console.log("Championship PDF sent successfully.");

        return {
            success: true,
            data: sendResponse.data
        };

    } catch (error) {

        console.error(
            "WhatsApp championship PDF delivery failed:",
            error.response?.data || error.message
        );

        return {
            success: false,
            error: error.response?.data || error.message
        };
    }
}

module.exports = {
    sendWhatsAppMessage,
    sendWhatsAppTemplate,
    sendStudentAccountWhatsApp,
    sendChampionshipOTP,
    sendChampionshipRegistrationAck,
    sendWhatsAppDocument
};