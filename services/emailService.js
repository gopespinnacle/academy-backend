const nodemailer = require("nodemailer");

const buildFacultyApplicationEmail =
require("../emailTemplates/facultyApplicationEmail");

const transporter = nodemailer.createTransport({

    host: process.env.EMAIL_HOST,

    port: Number(process.env.EMAIL_PORT),

    secure: process.env.EMAIL_SECURE === "true",

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    }

});

async function sendFacultyApplicationEmail(application){

    const html =
    buildFacultyApplicationEmail(application);

    // Teacher Email

    await transporter.sendMail({

    from: `"Gopes Pinnacle Academy" <${process.env.EMAIL_USER}>`,

    replyTo: process.env.EMAIL_USER,

    to: application.email,

    bcc: process.env.EMAIL_USER,

    subject: `Faculty Application Received | ${application.applicationId}`,

    html

});

    // Founder Email

   await transporter.sendMail({

    from: `"Gopes Pinnacle Academy" <${process.env.EMAIL_USER}>`,

    replyTo: process.env.EMAIL_USER,

    to: process.env.FOUNDER_EMAIL,

    subject: `New Faculty Application | ${application.applicationId}`,

    html

});

}

module.exports = {

    sendFacultyApplicationEmail

};