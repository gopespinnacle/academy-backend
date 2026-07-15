const SibApiV3Sdk = require("@getbrevo/brevo");


const buildFacultyApplicationEmail =
require("../emailTemplates/facultyApplicationEmail");

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const apiKey = apiInstance.authentications["apiKey"];

apiKey.apiKey = process.env.BREVO_API_KEY;


async function sendFacultyApplicationEmail(application){

    const html =
    buildFacultyApplicationEmail(application);

    // Teacher Email

    // Teacher Email

await apiInstance.sendTransacEmail({

    sender: {

        name: "Gopes Pinnacle Academy",

        email: "info@gopespinnacle.com"

    },

    to: [

        {

            email: application.email

        }

    ],

    bcc: [

        {

            email: process.env.FOUNDER_EMAIL

        }

    ],

    replyTo: {

        email: "info@gopespinnacle.com"

    },

    subject: `Faculty Application Received | ${application.applicationId}`,

    htmlContent: html

});

    // Founder Email

   // Founder Email

await apiInstance.sendTransacEmail({

    sender: {

        name: "Gopes Pinnacle Academy",

        email: "info@gopespinnacle.com"

    },

    to: [

        {

            email: process.env.FOUNDER_EMAIL

        }

    ],

    replyTo: {

        email: "info@gopespinnacle.com"

    },

    subject: `New Faculty Application | ${application.applicationId}`,

    htmlContent: html

});

}

module.exports = {

    sendFacultyApplicationEmail

};