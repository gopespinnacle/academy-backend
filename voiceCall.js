require("dotenv").config();

const axios = require("axios");

async function makeVoiceCall(toNumber){

    try{

        const url =
        `https://${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}` +
        `@${process.env.EXOTEL_SUBDOMAIN}/v1/Accounts/${process.env.EXOTEL_SID}/Calls/connect.json`;

        const response = await axios.post(url, new URLSearchParams({

            From: "09999999999",
            To: toNumber,
            CallerId: "09999999999",
            TimeLimit: "30",
            CallType: "trans"

        }));

        console.log("Call Started");
        console.log(response.data);

    }catch(err){

        console.log(err.response?.data || err.message);

    }
}

makeVoiceCall("+91XXXXXXXXXX");