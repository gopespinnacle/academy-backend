const axios = require("axios");

module.exports = async function(data){

    const html = `

<h2>🚨 Teacher Application Error</h2>

<table border="1" cellpadding="8">

<tr>
<td><b>Teacher</b></td>
<td>${data.teacherName}</td>
</tr>

<tr>
<td><b>Mobile</b></td>
<td>${data.mobile}</td>
</tr>

<tr>
<td><b>WhatsApp</b></td>
<td>${data.whatsapp}</td>
</tr>

<tr>
<td><b>Email</b></td>
<td>${data.email}</td>
</tr>

<tr>
<td><b>Date</b></td>
<td>${data.date}</td>
</tr>

<tr>
<td><b>Page</b></td>
<td>${data.page}</td>
</tr>

<tr>
<td><b>Browser</b></td>
<td>${data.browser}</td>
</tr>

<tr>
<td><b>Online</b></td>
<td>${data.online}</td>
</tr>

<tr>
<td><b>Error</b></td>
<td>${data.error}</td>
</tr>

<tr>
<td><b>Stack</b></td>
<td><pre>${data.stack}</pre></td>
</tr>

</table>

`;

    await axios.post(

        "https://api.brevo.com/v3/smtp/email",

        {

            sender:{
                name:"Gopes Pinnacle Academy",
                email:process.env.BREVO_SENDER
            },

            to:[
                {
                    email:process.env.FOUNDER_EMAIL
                }
            ],

            subject:"🚨 Teacher Application Error",

            htmlContent:html

        },

        {

            headers:{

                "api-key":process.env.BREVO_API_KEY,

                "Content-Type":"application/json"

            }

        }

    );

};