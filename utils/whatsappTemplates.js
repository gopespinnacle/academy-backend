function buildTeacherApplicationMessage(application) {

return `🎓 Gopes Pinnacle Academy

Dear ${application.teacherName},

Your Faculty Application has been received successfully.

🆔 Application ID:
${application.applicationId}

📧 Please check your email for the complete application summary.

Our recruitment team will review your application and contact you regarding the next stage of the recruitment process.

Thank you for your interest in Gopes Pinnacle Academy.

🌐 www.gopespinnacle.com`;

}



function buildFounderApplicationMessage(application) {

return `🎓 Gopes Pinnacle Academy

📢 New Faculty Application Received

🆔 Application ID:
${application.applicationId}

👤 Name:
${application.teacherName}

📧 Email:
${application.email}

📱 Mobile:
${application.mobile}

🎓 Qualification:
${application.qualification}

Please review the complete application in the Founder ERP dashboard.

🌐 www.gopespinnacle.com`;

}



module.exports = {

buildTeacherApplicationMessage,

buildFounderApplicationMessage

};