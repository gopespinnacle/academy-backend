const nodemailer = require("nodemailer");

const buildFacultyApplicationEmail =
require("../emailTemplates/facultyApplicationEmail");

const transporter = nodemailer.createTransport({

    host: process.env.EMAIL_HOST,

    port: 465,

    secure: true,

    auth: {

        user: process.env.EMAIL_USER,

        pass: process.env.EMAIL_PASS

    },

    connectionTimeout: 10000,

    greetingTimeout: 10000,

    socketTimeout: 10000,

    tls: {

        rejectUnauthorized: false

    }

});
transporter.verify(function(error, success){

    if(error){

        console.log("====================================");
        console.log("SMTP VERIFY FAILED");
        console.log(error);
        console.log("====================================");

    }else{

        console.log("====================================");
        console.log("SMTP READY");
        console.log("====================================");

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